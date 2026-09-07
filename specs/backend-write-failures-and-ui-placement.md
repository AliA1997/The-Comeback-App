# Spec: Backend Write Failures and UI Placement Defects

**Status**: Partially implemented — AC-2 through AC-7 done (2026-09-06).
AC-1 blocked on the § 5 diagnostic; see § 9.
**Created**: 2026-09-06
**Principles served**: III (Supportive, Never Punitive), IV (Momentum Made
Visible), V (Simplicity and Speed), VI (Privacy by Default)

## 1. Overview

Five defects were reported from device testing. They are not five independent
bugs. Four reduce to three root causes, and a fifth — missing error handling
on every create/update path — is what hides the others behind a UI that
appears to do nothing at all.

| # | Reported symptom | Root cause | Layer |
|---|---|---|---|
| R1 | Lists and tasks are not created | **C1** or **C2** (below) | Database |
| R2 | Buttons appear at the bottom of the screen | **C4** floating tab bar | App |
| R3 | Different Google accounts sign in as the same user | **C3** browser session reuse | App |
| R4 | User records are not created or upserted | **C1** or **C2** — same as R1 | Database |
| R5 | The time is not visible in the UI | **C5** banner mounted on 2 of 6 tabs | App |
| — | *(unreported)* every failure above is silent | **C6** no `onError` handlers | App |

R1 and R4 are the same defect observed at two tables. Writes to `lists`,
`tasks` and `user_profiles` travel the same path and fail together.

## 2. Scope

**In scope**: restoring writes to `comebackapp.*`; making write failures
visible; correct Google account selection; bottom-inset correctness on tab
screens; surfacing elapsed session time beyond the dashboard.

**Out of scope**: new features, schema redesign, the frozen countdown timer
mechanics (CLAUDE.md § Frozen), the frozen colour palette, offline write
queueing.

## 3. Root causes

### C1 — `DATABASE_URL` may not point at the Supabase Postgres

`lib/db/src/schema/_shared.ts` projects Supabase's `auth.users`, and all three
user-owned tables foreign-key to it with `ON DELETE CASCADE`:

- `user_profiles.id → auth.users(id)`
- `lists.user_id → auth.users(id)`
- `tasks.user_id → auth.users(id)`

`lib/db/src/index.ts` opens a plain `pg.Pool` on `DATABASE_URL`. If that
points at any database other than the Supabase project's own Postgres — for
example a Railway-provisioned Postgres attached to the API service — then the
`auth` schema does not exist, no row can satisfy the foreign key, and **every
insert to all three tables fails**. `GET` returns an empty list, so the app
looks empty rather than broken.

This is the failure mode CLAUDE.md § Environment already warns about. The API
is deployed to Railway (`EXPO_PUBLIC_API_URL` in `eas.json`), which is exactly
the configuration where a platform-provisioned database gets attached by
default.

### C2 — RLS blocks the API's connection

`lib/db/src/policies.sql` enables row level security on `user_profiles`,
`lists`, `tasks` and `task_types`, with policies keyed to `auth.uid()`.

`auth.uid()` reads a claim from the request JWT that Supabase's PostgREST
layer sets. The API does not go through PostgREST — it holds a direct
connection and never sets that claim, so **`auth.uid()` is always NULL** for
every API query. Under those policies:

- `SELECT` matches no rows → reads return empty
- `INSERT` fails `WITH CHECK (user_id = auth.uid())`, because
  `user_id = NULL` evaluates to NULL, not true → **write rejected**

Whether this actually bites depends on the connection's role. A table's owner
bypasses RLS unless `FORCE ROW LEVEL SECURITY` is set. So C2 applies only if
the API connects as a non-owner role without `BYPASSRLS`.

C1 and C2 produce the same user-visible symptom and must be distinguished by
the diagnostic in § 5 before either is fixed.

### C3 — the OAuth browser session is reused across accounts

`domains/auth/services/AuthService.ts`:

- `signInWithProvider()` calls `supabase.auth.signInWithOAuth()` with only
  `redirectTo` and `skipBrowserRedirect`. It passes **no `prompt` query
  parameter**, so Google is free to reuse an existing session instead of
  showing the account chooser.
- `signOut()` calls `supabase.auth.signOut()` and clears the React Query
  cache, but **never clears the browser's cookie jar**.

On Android `WebBrowser.openAuthSessionAsync` runs in a Chrome Custom Tab that
shares cookies with Chrome. Google therefore sees a live session, silently
re-issues a token for the *same* account, and Supabase returns the same
`sub`. The second account never gets a chance to authenticate.

This is an app-layer defect. `requireAuth` in
`artifacts/api-server/src/lib/auth.ts` correctly derives the user from
`payload.sub` and is not implicated.

### C4 — the tab bar floats over content, and screens guess its height

`app/(tabs)/_layout.tsx` sets `tabBarStyle: { position: 'absolute' }`. An
absolutely positioned tab bar is removed from layout flow and paints over
whatever is beneath it. Every tab screen must therefore reserve its own bottom
space.

They do — with a hardcoded constant, in **all six** tab screens:

- `DashboardScreen` — `paddingBottom: 120 + (web ? 34 : 0)`
- `TasksScreen` — `paddingBottom: 120`
- `ListsScreen` — `paddingBottom: 120 + (web ? 34 : 0)`
- `LearnScreen`, `InsightsScreen`, `ProfileScreen` — same expression

(`ListDetailScreen` carries the same constant but is a root-stack route that
covers the tab bar, so there the padding is dead space rather than a defect.)

`120` is a guess at *(bar height + bottom safe-area inset)*. That sum is
device-dependent: Android gesture navigation, three-button navigation and
display cutouts each yield a different `insets.bottom`. Where the real value
exceeds 120, the last row of content — typically an action button — sits under
the bar. Where it is smaller, the content floats short of it.

Two components additionally pin footers at `position: 'absolute', bottom: 0`
(`domains/learning/features/LessonScreen.tsx`,
`domains/user-profile/components/OnboardingWizard.tsx`), which places them
beneath the floating bar wherever they render inside the tab navigator.

### C5 — running time is visible on only two screens

`ActiveTimerBanner` is mounted in exactly two places: `DashboardScreen` and
`ListsScreen`. The full readout (`TimerDisplay`) lives only in the `/timer`
modal.

So on the Tasks, Insights, Learn and Profile tabs a running session shows no
time at all. There is no persistent indication that a timer is running, and no
way back to it without navigating to the dashboard first. This is a direct
miss against Principle IV — progress must be visible in under five seconds —
and against Principle V, since returning to the timer takes more taps than it
should.

### C6 — create and update failures are silent

`domains/task-planning/hooks/useTaskMutations.ts` and
`domains/lists/hooks/useLists.ts` register **only `onSuccess`** on:

- `useCreateTask`, `useUpdateTask`
- `useCreateList`, `useUpdateList`

There is no `onError`. `useDeleteTask` is the sole exception — it restores its
optimistic snapshot and shows *"That didn't save. Tap to try again."*

Consequently, when C1 or C2 makes the server reject a write, the form closes,
no toast appears, and the item is simply absent. The user cannot tell a
server error from their own mistake. That is precisely the experience
Principle III forbids, and it is why R1 and R4 were reported as "doesn't
create" rather than "shows an error".

C6 must be fixed regardless of the outcome of the § 5 diagnostic — it is what
made a configuration error look like a broken feature.

## 4. Acceptance criteria

### AC-1 — Writes succeed
Given a signed-in user, when they create a list, a task, or trigger a profile
upsert via `GET /api/me/profile`, the row is persisted and returned with a
`201`/`200`, and appears in the next read.

### AC-2 — Write failures are always visible
Every create and update mutation registers an `onError` that shows a toast in
the Principle III register — states what happened, offers the next step,
assigns no blame. No write may fail silently. Applies to `useCreateTask`,
`useUpdateTask`, `useCreateList`, `useUpdateList`.

### AC-3 — Account chooser always shown
`signInWithProvider` passes `queryParams: { prompt: 'select_account' }`.
Signing out and signing in with a different Google account results in a
different `sub`, a different profile, and no data from the previous account.

### AC-4 — Sign-out clears the browser session
`signOut()` clears the OAuth browser session in addition to the Supabase
session and the React Query cache, so the next sign-in starts from a clean
state.

> **Implemented with a deviation.** `expo-web-browser` exposes no
> cookie-clearing API — only `coolDownAsync`, `dismissBrowser`,
> `dismissAuthSession` and `maybeCompleteAuthSession`. The only way to drop a
> Google session from the app would be to walk the user through Google's own
> logout, signing them out of every Google product on the device. That is a
> worse outcome than the bug. `signOut()` therefore releases the warmed Custom
> Tabs service and clears the query cache, and **AC-3's account chooser is what
> actually guarantees the correct account** — it makes a reused cookie
> harmless rather than trying to prevent one.

### AC-5 — Bottom insets are measured, not guessed
Tab screens derive bottom padding from `useBottomTabBarHeight()` (or an
equivalent measured value) rather than the literal `120`. On a device with
gesture navigation and on one with three-button navigation, the last
interactive row is fully visible and tappable on every tab.

### AC-6 — Pinned footers clear the tab bar
`LessonScreen` and `OnboardingWizard` footers are not overlapped by the tab
bar in any navigation state.

### AC-7 — Running time is visible app-wide
When a timer is running, elapsed/remaining time is visible from every tab, and
tapping it returns to the timer. The per-second subscription stays isolated to
`TimerSecondsText` — CLAUDE.md § Frozen rule 2 is not relaxed. Mounting the
banner in the tab layout rather than in individual screens satisfies both.

## 5. Diagnostics — run before implementing § 3 C1/C2

C1 and C2 are indistinguishable from the app. Run these against the API's live
`DATABASE_URL` and record the result in this spec before writing any fix.

```sql
-- 1. Is this the Supabase database? NULL means C1 is confirmed.
SELECT to_regclass('auth.users') AS auth_users_exists;

-- 2. Which role is the API connecting as, and can it bypass RLS?
SELECT current_user, rolbypassrls
  FROM pg_roles
 WHERE rolname = current_user;

-- 3. Who owns the tables, and is RLS forced?
SELECT tablename, tableowner, rowsecurity, forcerowsecurity
  FROM pg_tables
 WHERE schemaname = 'comebackapp';

-- 4. What does auth.uid() return on this connection?
--    NULL confirms C2's precondition.
SELECT auth.uid();
```

**Interpretation**

- (1) returns NULL → **C1**. Repoint `DATABASE_URL` at the Supabase project's
  Postgres, then re-run `push` and `seed` per CLAUDE.md.
- (1) non-null, (2) `rolbypassrls = false`, and (3) shows `tableowner` ≠
  `current_user` → **C2**. Either connect as the owning role, or replace the
  `auth.uid()` policies with ones that recognise the API's service role, since
  the API — not PostgREST — is the only client.
- Both clear → the cause is elsewhere; capture the actual server error, which
  AC-2 will by then have surfaced.

## 6. Edge cases

- **Partial migration.** If `push` ran against the wrong database, that
  database now holds a `comebackapp` schema that must not be treated as
  authoritative. Repointing `DATABASE_URL` requires re-running `push` **and**
  `seed`, or task creation has no task types to reference.
- **The auth trigger is optional.** `lib/db/src/auth-trigger.sql` is applied
  by `seed.ts` inside a try/catch that only warns. A missing trigger is not a
  cause of R4 — `ensureProfile()` in `routes/profile.ts` upserts on the first
  authenticated request and already handles the insert race.
- **Account switching mid-session.** After AC-3, a user who switches accounts
  must land on the new account's empty state, never the previous account's
  cached lists. `signOut()` already calls `queryClient.clear()`; verify it
  runs before the new sign-in resolves.
- **Two accounts, one display name.** Distinct Google accounts have distinct
  `sub` values and must map to distinct Supabase users even if a display name
  or avatar matches.
- **Timer banner on the timer screen.** The app-wide banner must not render on
  `/timer` itself, which already shows `TimerDisplay`.

## 7. Error conditions

| Condition | Behaviour |
|---|---|
| Insert rejected by FK or RLS | API returns 500; app shows the AC-2 toast and keeps the user's input |
| `auth.users` missing at boot | API logs a fatal configuration error naming `DATABASE_URL`; `/api/healthz` stays up so the platform health check still passes |
| OAuth cancelled by the user | Not an error — return to resting state, no message (existing behaviour, preserved) |
| Token expired mid-write | 401; client refreshes via Supabase and retries once (`refactor-comeback-app.md` § 12.5) |
| Duplicate list name | Existing `duplicateListName()` 409 — unchanged, but must now reach the user via AC-2 |

## 8. Open questions

1. **Does the API's role own the `comebackapp` tables?** Determines whether
   the RLS policies as written are dead weight or an active blocker. § 5
   answers this.
2. **Should RLS policies be rewritten for a service-role client?** The
   policies were specified as defence in depth against a leaked anon key
   (`refactor-comeback-app.md` § 5.7). If the API connects as owner they never
   execute, which means the stated protection does not currently exist. Worth
   deciding deliberately rather than by accident.
3. **Should the timer banner live in `app/(tabs)/_layout.tsx` or in a
   root-level component?** The tab layout covers the five tab screens; a
   root-level mount would also cover the modal stack.
4. **R2 reproduction detail.** "Buttons appear at the bottom" is consistent
   with C4 across all tab screens, but if the report refers to one specific
   screen, naming it would confirm whether the pinned-footer variant (C4,
   second paragraph) is the actual case.

## 9. Implementation record — 2026-09-06

Typecheck clean in both packages; 47 tests pass (40 API, 7 app).

| AC | Status | Where |
|---|---|---|
| AC-1 | **Blocked** — needs § 5 run against the live database | — |
| AC-2 | Done | `shared/api/errorMessage.ts`, `useTaskMutations.ts`, `useLists.ts` |
| AC-3 | Done | `domains/auth/services/AuthService.ts` |
| AC-4 | Done, with the deviation recorded above | `domains/auth/services/AuthService.ts` |
| AC-5 | Done | `shared/ui/tabBarMetrics.ts`, `app/(tabs)/_layout.tsx`, 6 tab screens |
| AC-6 | Done | `domains/user-profile/components/OnboardingWizard.tsx` |
| AC-7 | Done | `app/(tabs)/_layout.tsx`, `ActiveTimerBanner.tsx` |

**New modules**

- `shared/ui/tabBarMetrics.ts` — single owner of the tab bar's height.
  The layout sizes the bar from it, screens pad from it, the timer dock
  positions against it, so the three cannot drift apart. This is what makes
  AC-5 hold on devices the hardcoded `120` was wrong for.

  AC-5 named `useBottomTabBarHeight()` first. That hook was **not** used, and
  should not be swapped in later: (a) it ships only as a transitive dependency
  of expo-router and pnpm does not hoist it, so it is not importable without
  adding `@react-navigation/bottom-tabs` to the app's own dependencies;
  (b) it throws outside a bottom-tab screen, and `ActiveTimerDock` renders as
  a sibling of `<Tabs>`, not inside one; (c) it does not apply to the
  `NativeTabs` layout used when liquid glass is available, which is not a
  bottom-tab navigator at all. The module covers all three cases.
- `shared/api/errorMessage.ts` — maps a failed write to user-facing copy.
  4xx bodies already carry server-side Principle III copy and are shown
  verbatim; 5xx and network faults get the neutral retry line, because their
  detail is for logs.
- `artifacts/api-server/src/lib/preflight.ts` — logs one loud line at boot
  when `auth.users` is absent, naming `DATABASE_URL`. Runs *after* `listen`
  so `/api/healthz` still answers, per § 7.

**Notes**

- The timer banner moved from two screens into a dock in the tab layout,
  rendered `pointerEvents="box-none"` above the bar. Frozen-timer rule 2 is
  intact: only `TimerSecondsText` subscribes to `remainingSeconds`, so the
  dock does not re-render per tick.
- `useDeleteList` and `useRestoreList` still have no `onError`. They are
  outside AC-2's enumerated scope but carry the identical defect, and should
  be folded into the next change that touches this file.
- AC-1 remains the reason lists and tasks do not save. Nothing implemented
  here fixes it — AC-2 only makes the failure legible, and the preflight
  check makes the cause visible in the API logs. Run § 5.
