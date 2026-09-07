/**
 * `/api/me/profile` — the authenticated user's profile (spec § 5.2).
 *
 * GET upserts before reading. The `auth.users` trigger normally creates the
 * row, but a trigger that failed to fire must never be what stands between a
 * user and their dashboard.
 */
import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { UpdateProfileBody } from "@workspace/api-zod";
import {
  DEFAULT_USER_PREFERENCES,
  db,
  userProfilesTable,
  type UserProfileRow,
} from "@workspace/db";
import { userIdOf } from "../lib/auth";
import { toProfile } from "../lib/serializers";
import { parseOrThrow } from "../lib/validate";

const router: IRouter = Router();

/**
 * Returns the caller's profile, creating it on first sight.
 *
 * Called on every authenticated profile read, which makes it the app's
 * de-facto "on login" hook: the client fetches the profile as soon as a
 * session exists, so the row is created there and then.
 *
 * `email` comes from the access token rather than the request body — the
 * client cannot claim to be an address it did not authenticate as.
 * `auth.users` remains the source of truth; this is a mirror kept current so
 * reads never have to cross into Supabase's auth schema.
 */
async function ensureProfile(
  userId: string,
  email: string | undefined,
): Promise<UserProfileRow> {
  const [existing] = await db
    .select()
    .from(userProfilesTable)
    .where(eq(userProfilesTable.id, userId))
    .limit(1);

  if (existing) {
    // Backfills rows written before this column existed, and follows an
    // address the user changed with their provider. Only writes when the
    // value actually differs, so a normal read stays a single SELECT.
    if (email && existing.email !== email) {
      const [updated] = await db
        .update(userProfilesTable)
        .set({ email, updatedAt: new Date() })
        .where(eq(userProfilesTable.id, userId))
        .returning();

      return updated ?? existing;
    }

    return existing;
  }

  const [created] = await db
    .insert(userProfilesTable)
    .values({
      id: userId,
      ...(email === undefined ? {} : { email }),
      preferences: DEFAULT_USER_PREFERENCES,
    })
    .onConflictDoNothing()
    .returning();

  if (created) return created;

  // A concurrent request won the insert race; read what it wrote.
  const [row] = await db
    .select()
    .from(userProfilesTable)
    .where(eq(userProfilesTable.id, userId))
    .limit(1);

  return row!;
}

router.get("/me/profile", async (req, res) => {
  const userId = userIdOf(req);
  res.json(toProfile(await ensureProfile(userId, req.userEmail)));
});

router.patch("/me/profile", async (req, res) => {
  const userId = userIdOf(req);
  const body = parseOrThrow(UpdateProfileBody, req.body);

  const current = await ensureProfile(userId, req.userEmail);

  const [row] = await db
    .update(userProfilesTable)
    .set({
      ...(body.displayName === undefined ? {} : { displayName: body.displayName }),
      ...(body.careerTrack === undefined ? {} : { careerTrack: body.careerTrack }),
      ...(body.seniority === undefined ? {} : { seniority: body.seniority }),
      ...(body.targetRole === undefined ? {} : { targetRole: body.targetRole }),
      ...(body.dailyMinutesTarget === undefined
        ? {}
        : { dailyMinutesTarget: body.dailyMinutesTarget }),
      ...(body.weeklyTasksTarget === undefined
        ? {}
        : { weeklyTasksTarget: body.weeklyTasksTarget }),
      // Preferences are merged, not replaced, so a client that knows about
      // fewer toggles than the server cannot silently reset the rest.
      ...(body.preferences === undefined
        ? {}
        : {
            preferences: {
              ...DEFAULT_USER_PREFERENCES,
              ...current.preferences,
              ...body.preferences,
            },
          }),
      updatedAt: new Date(),
    })
    .where(eq(userProfilesTable.id, userId))
    .returning();

  res.json(toProfile(row!));
});

export default router;
