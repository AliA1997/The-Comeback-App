# Spec: Comeback App Refactor — Lists, Scoring, and Server-Backed Data

**Status**: Implemented
**Created**: 2026-08-30
**Supersedes**: `replit.md` — removed; its still-current content now lives in `CLAUDE.md` (see § 11)
**Principles served**: I (Daily Consistency First), II (Routine Over Overwhelm), IV (Momentum Made Visible), V (Simplicity and Speed), VI (Privacy by Default)

---

## 1. Overview

The Comeback App is a todoist-style app for engineers rebuilding momentum
after a layoff — and, through the same mechanics, for students working through
assignments. It personalises the plan, supports full CRUD on **lists** and
**tasks**, and gamifies completion by attaching a **score** to every task.

Today the app is entirely local: one Zustand store persisted to AsyncStorage,
no accounts, no server. This refactor introduces four things:

1. **Lists** — a first-class container for tasks (today tasks are a flat pool).
2. **Priority + scoring** — every task carries a `priority` (`low`/`medium`/
   `high`/`urgent`) and a `score` derived from its task type, doubled when the
   priority is `urgent`.
3. **A real backend** — Supabase OAuth for identity, an Express + Drizzle API
   over a dedicated `comebackapp` Postgres schema, consumed through generated
   React Query hooks.
4. **A single frontend standard** — the Qamar Labs Frontend Implementation
   Guide replaces the ad-hoc conventions previously scattered across
   `replit.md` and file docblocks.

An explicit task lifecycle (start → pause → resume → stop → complete, plus
soft delete) is specified so timer state and task state can no longer drift.

---

## 2. Scope

### In scope

| Area | Change |
|---|---|
| Data model | `comebackapp` schema: `user_profiles`, `lists`, `task_types`, `tasks`, `priority_level` + `task_status` enums |
| Auth | Supabase OAuth in the Expo app; JWT verification in the Express API |
| API | CRUD for lists/tasks/task-types/profile + task-lifecycle endpoints |
| App data layer | React Query owns all server data; Zustand keeps client-only state |
| App structure | All seven domains realigned to the Qamar Labs guide |
| Scoring | Task-type base score, urgent multiplier, earned-score rollup |
| Docs | `replit.md` removed; `CLAUDE.md` and `specs/` are the only documentation |

### Out of scope

- Migrating `daily-tasks`, `progress`, `learning`, and `notifications` **data**
  to the server — those domains get the structural realignment only and keep
  their local Zustand slices for now.
- Offline write support. Writes require a connection (see § 7.4).
- Any change to the colour scheme (`shared/theme/colors.ts` is frozen).
- Any change to timer tick mechanics, the interval singleton, or the
  saved-progress behaviour shipped in `6b405ec` (see § 6.4).

---

## 3. User Stories

### Story 1 — Laid-off engineer (primary persona)

> As a laid-off software engineer, I want my job-search work broken into lists
> of scored tasks, so that finishing them feels like progress instead of an
> endless backlog.

- Organises existing work into lists ("Applications — Week of Sep 1",
  "System Design Prep").
- Completes tasks and watches the score climb.
- Gamification keeps them opening the app on the days motivation is lowest.

**Success metric**: 5,000 users download the app and are still active at day 30.

### Story 2 — College student (secondary persona)

> As a college student, I want to start a timer on an assignment and pause it
> when I take a break, so that my recorded study time reflects real focused
> work.

- Creates a list per course, tasks per assignment.
- Starts a task, pauses for a break, resumes, completes.
- Paused time is excluded from recorded focus time.

**Success metric**: 1,000 students install the app, each creating ≥10 tasks,
with pause/resume used in ≥50% of focus sessions.

---

## 4. Acceptance Criteria

### AC-1 — First run and sign-in

```
Given  a new user has downloaded the app
When   they open it for the first time
Then   they are shown the sign-in screen and authenticate via Supabase OAuth,
And    a `comebackapp.user_profiles` row is created for their auth user,
And    they land on the dashboard with an encouraging empty state.
```

### AC-2 — Create a list

```
Given  an authenticated user with no lists
When   they create a list named "Applications"
Then   a `comebackapp.lists` row is created scoped to their user id,
And    the list appears in the lists view without a manual refresh,
And    a duplicate name for the same user is rejected with a field-level error.
```

### AC-3 — Create a task with a task type and receive a score

```
Given  an authenticated user viewing a list
When   they create a task with task_type "System Design" and priority "medium"
Then   the task is persisted with `score` equal to that task type's base score,
And    the score is visible on the task card immediately after creation.
```

### AC-4 — Urgent priority doubles the score

```
Given  a task type "System Design" with base score 15
When   a task of that type is created with priority "urgent"
Then   the task's stored score is 30,
And    changing that task's priority to "high" recomputes the score to 15.
```

### AC-5 — Start a task

```
Given  a task with status "pending"
When   the user starts it
Then   its status becomes "in_progress",
And    `started_at` is recorded,
And    the countdown timer begins and timer stats are visible.
```

### AC-6 — Pause a task

```
Given  a task with status "in_progress" and a running timer
When   the user pauses it
Then   its status becomes "paused",
And    the timer stops and `paused_at` plus the remaining seconds are recorded,
And    resuming later continues from the recorded remaining seconds.
```

### AC-7 — Leaving the timer screen

```
Given  a task with a running or paused timer
When   the timer screen unmounts
Then   the accumulated paused time and remaining seconds are persisted,
And    reopening the task resumes from exactly where it left off.
```

### AC-8 — Complete a task

```
Given  a task with status "in_progress" or "paused"
When   the user completes it
Then   its status becomes "completed" and `completed_at` is recorded,
And    its score counts toward the user's earned score,
And    the actual focused duration excludes all paused time.
```

### AC-9 — Delete a task

```
Given  any task
When   the user deletes it
Then   its status becomes "deleted" and `deleted_at` is set,
And    it disappears from every default query,
And    the row is retained so the action can be undone.
```

---

## 5. Data Model

All application tables live in a dedicated `comebackapp` schema, separate from
Supabase's `auth` schema.

### 5.1 Enums

```sql
CREATE SCHEMA IF NOT EXISTS comebackapp;

CREATE TYPE comebackapp.priority_level AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TYPE comebackapp.task_status AS ENUM (
  'pending', 'in_progress', 'paused', 'completed', 'deleted'
);
```

`task_status` extends the current client-side union
(`pending | in_progress | completed | skipped`) with `paused` and `deleted`.
`skipped` is retained client-side by the `daily-tasks` domain but is **not**
part of the server enum — it is a daily-routine concept, not a task state.

### 5.2 `comebackapp.user_profiles`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | FK → `auth.users(id)` ON DELETE CASCADE |
| `email` | `text` | mirrored from the access token; see below |
| `display_name` | `text` | |
| `career_track` | `text` | matches the `CareerTrack` union |
| `seniority` | `text` | matches the `Seniority` union |
| `target_role` | `text` | |
| `daily_minutes_target` | `integer` NOT NULL DEFAULT 90 | |
| `weekly_tasks_target` | `integer` NOT NULL DEFAULT 12 | |
| `preferences` | `jsonb` NOT NULL DEFAULT `'{}'` | notifications, nudges, ads |
| `created_at` / `updated_at` | `timestamptz` NOT NULL DEFAULT `now()` | |

A row is created by an `AFTER INSERT` trigger on `auth.users`, with the API
falling back to an upsert on the first authenticated request so a missed
trigger never blocks sign-in.

**Profile on sign-in.** `GET /api/me/profile` is the login hook: the client
issues it as soon as a session exists (`useEnsureProfile`, mounted once in
`SignedInEffects`), and the handler reads the row, creating it if absent. The
result lands in the React Query cache, which is where the profile lives
app-wide — no Zustand mirror, per § 8.3.

`email` is taken from the access token's `email` claim, never from a request
body: a client cannot claim to be an address it did not authenticate as. It is
set on insert and refreshed on read whenever the token's value differs, which
backfills rows written before the column existed and follows an address the
user changed with their provider. A normal read stays a single `SELECT`.
`auth.users` remains the source of truth; this copy exists so profile reads
never cross into Supabase's auth schema. The claim is optional — not every
identity carries a verified email — so no route may require it.

Because the column holds personal data, the owner RLS policies of § 5.7 are a
precondition for storing it, not an optional hardening step (Principle VI).

### 5.3 `comebackapp.lists`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK DEFAULT `gen_random_uuid()` | |
| `user_id` | `uuid` NOT NULL | FK → `auth.users(id)` ON DELETE CASCADE |
| `name` | `text` NOT NULL | 1–60 chars |
| `position` | `integer` NOT NULL DEFAULT 0 | manual ordering |
| `is_archived` | `boolean` NOT NULL DEFAULT false | |
| `created_at` / `updated_at` | `timestamptz` | |

`UNIQUE (user_id, lower(name)) WHERE is_archived = false` — list names are
unique per user among active lists.

### 5.4 `comebackapp.task_types`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `type` | `text` NOT NULL UNIQUE | stable slug, e.g. `system_design` |
| `label` | `text` NOT NULL | display name |
| `score` | `integer` NOT NULL | `CHECK (score > 0)` — the base score |
| `is_system` | `boolean` NOT NULL DEFAULT true | seeded rows |
| `created_at` | `timestamptz` | |

Seeded from the six categories already in `shared/types/skills.ts`:

| `type` | `label` | `score` |
|---|---|---|
| `applications` | Applications | 5 |
| `networking` | Networking | 5 |
| `learning` | Learning | 8 |
| `leetcode` | LeetCode | 10 |
| `system_design` | System Design | 15 |
| `projects` | Projects | 20 |

Scores are weighted by typical effort and are tunable — they are seed data,
not constants in code.

### 5.5 `comebackapp.tasks`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `user_id` | `uuid` NOT NULL | FK → `auth.users(id)` ON DELETE CASCADE |
| `list_id` | `uuid` NOT NULL | FK → `lists(id)` ON DELETE CASCADE |
| `task_type_id` | `uuid` NOT NULL | FK → `task_types(id)` ON DELETE RESTRICT |
| `title` | `text` NOT NULL | 1–100 chars (matches the current form limit) |
| `description` | `text` NOT NULL DEFAULT `''` | |
| `priority` | `comebackapp.priority_level` NOT NULL DEFAULT `'medium'` | |
| `score` | `integer` NOT NULL | **snapshot** — see § 5.6 |
| `status` | `comebackapp.task_status` NOT NULL DEFAULT `'pending'` | |
| `estimated_duration_minutes` | `integer` NOT NULL DEFAULT 25 | |
| `actual_duration_minutes` | `integer` | set on completion |
| `saved_remaining_seconds` | `integer` | resume point |
| `total_paused_ms` | `bigint` NOT NULL DEFAULT 0 | accumulated pause time |
| `started_at` / `paused_at` / `completed_at` / `deleted_at` | `timestamptz` | |
| `due_date` | `date` | |
| `position` | `integer` NOT NULL DEFAULT 0 | |
| `created_at` / `updated_at` | `timestamptz` | |

Indexes: `(user_id, status)`, `(list_id, position)`, and a partial index on
`(user_id) WHERE status <> 'deleted'` for the default task feed.

### 5.6 Scoring rules

```
task.score = task_type.score × multiplier(task.priority)

multiplier:  low → 1    medium → 1    high → 1    urgent → 2
```

1. The score is **computed server-side** on create, and on any update that
   changes `task_type_id` or `priority`. Clients never send a score; a score
   supplied in a request body is ignored.
2. The score is a **snapshot**. Editing a task type's base score later does
   not retroactively rewrite existing tasks — a completed task's score is a
   historical fact.
3. Only `urgent` alters the score today. The multiplier lives in one table in
   the scoring service, so a future weighting change is a one-line edit rather
   than a migration.
4. **Earned score** = the sum of `score` across tasks with status `completed`.
   Tasks in any other status, `deleted` included, contribute 0. Completing a
   task adds its score; un-completing removes it.

### 5.7 Privacy (Principle VI)

- Every table carries `user_id`, and every API query filters by the
  authenticated user. There is no cross-user read path.
- Row Level Security is enabled on all four tables with
  `USING (user_id = auth.uid())` policies as defence in depth, even though the
  API is the only client.
- `task_types` is world-readable (seed data) and write-restricted.

---

## 6. Task Lifecycle

### 6.1 State machine

```
                 ┌───────────── resume ─────────────┐
                 ▼                                  │
  [pending] ──start──▶ [in_progress] ──pause──▶ [paused]
      ▲                   │      │                  │
      └──── stop ─────────┘      └─── complete ───┐ │
                                                  ▼ ▼
                                             [completed]

  any state ──delete──▶ [deleted] ──restore──▶ [pending]
```

| Transition | Effect |
|---|---|
| `start` | `status = in_progress`, `started_at = now()`; timer starts from `saved_remaining_seconds` when set, else `estimated_duration_minutes × 60` |
| `pause` | `status = paused`, `paused_at = now()`, `saved_remaining_seconds` written |
| `resume` | `status = in_progress`, `total_paused_ms += now() − paused_at`, `paused_at = null` |
| `stop` | `status = pending`, `saved_remaining_seconds` written, timer cleared |
| `complete` | `status = completed`, `completed_at = now()`, `actual_duration_minutes` computed, `saved_remaining_seconds` cleared, score earned |
| `delete` | `status = deleted`, `deleted_at = now()`, row retained |
| `restore` | `status = pending`, `deleted_at = null`, score recomputed |

Invalid transitions (e.g. `pause` on a `pending` task) return
`409 InvalidTaskTransition` and leave state untouched.

### 6.2 Focused duration

```
actual_duration_minutes = round((completed_at − started_at − total_paused_ms) / 60000)
```

floored at 1 minute. This is the AC-6 / AC-8 guarantee that break time is not
counted as study time — the student persona's core requirement.

### 6.3 Unmount behaviour

When the timer screen unmounts with a live session, the client persists
`saved_remaining_seconds` and `total_paused_ms` before teardown:

- **Running** at unmount → treated as a pause (status `paused`). The user's
  intent was to step away, so returning should resume rather than restart.
- **Already paused** at unmount → the pause is flushed to the server; status
  is unchanged.

The write is fire-and-forget with a retry on next app foreground. A failed
sync never blocks navigation, and local state remains the source of truth for
the resume point until the sync lands.

### 6.4 Timer constraint (explicit)

The timer implementation is **frozen** apart from the two additive changes
below. Specifically unchanged:

- the one-second `setInterval` decrement model,
- `TimerProvider` as the sole interval owner,
- `savedRemainingSeconds` persistence (the fix in `6b405ec`),
- `TimerSecondsText` as the only per-tick subscriber,
- the `TaskCard` memo comparator.

The two permitted changes to
[SessionLifecycle.ts](artifacts/career-tracker/domains/time-focus/services/SessionLifecycle.ts):

1. `pauseSession()` and `stopSession()` write the new `paused` status where a
   pause previously left the task `pending`. Mechanics unchanged.
2. Each lifecycle function fires the matching server mutation after its local
   state update. The local update stays synchronous and first, so the timer's
   perceived behaviour is identical.

If either change proves unwelcome, the alternative is a parallel
`serverStatus` field — more state to reconcile, and not recommended.

---

## 7. API and Data Access

### 7.1 Architecture

```
Expo app
  ├─ supabase-js ───────────────▶ Supabase Auth (OAuth)
  │                                     │ JWT
  ├─ React Query (Orval hooks) ──▶ Express API ──▶ Drizzle ──▶ comebackapp.*
  └─ Zustand (client-only state)
```

Supabase provides identity only. All application reads and writes go through
the Express API, which owns validation, scoring, and transition rules. This
reuses `artifacts/api-server`, `lib/db`, `lib/api-spec`, and
`lib/api-client-react` rather than replacing them.

### 7.2 Endpoints

Added to [openapi.yaml](lib/api-spec/openapi.yaml); hooks generated by
`pnpm --filter @workspace/api-spec run codegen`.

| Operation ID | Method | Path |
|---|---|---|
| `listLists` | GET | `/api/lists` |
| `createList` | POST | `/api/lists` |
| `updateList` | PATCH | `/api/lists/{listId}` |
| `deleteList` | DELETE | `/api/lists/{listId}` |
| `listTasks` | GET | `/api/tasks?listId=&status=&priority=` |
| `createTask` | POST | `/api/tasks` |
| `updateTask` | PATCH | `/api/tasks/{taskId}` |
| `startTask` | POST | `/api/tasks/{taskId}/start` |
| `pauseTask` | POST | `/api/tasks/{taskId}/pause` |
| `resumeTask` | POST | `/api/tasks/{taskId}/resume` |
| `stopTask` | POST | `/api/tasks/{taskId}/stop` |
| `completeTask` | POST | `/api/tasks/{taskId}/complete` |
| `deleteTask` | DELETE | `/api/tasks/{taskId}` |
| `restoreTask` | POST | `/api/tasks/{taskId}/restore` |
| `listTaskTypes` | GET | `/api/task-types` |
| `getProfile` | GET | `/api/me/profile` |
| `updateProfile` | PATCH | `/api/me/profile` |

Lifecycle transitions are dedicated endpoints rather than `PATCH status`
because the server owns timestamp arithmetic and transition validation — a
client that could set `status` directly could also skip `total_paused_ms`.

### 7.3 Auth wiring

1. `supabase-js` in the Expo app with an AsyncStorage session store; OAuth via
   `expo-web-browser` + `expo-linking` (both already dependencies).
2. `setAuthTokenGetter(...)` in
   [custom-fetch.ts](lib/api-client-react/src/custom-fetch.ts) returns the
   Supabase access token. The hook already exists and needs no changes.
3. `setBaseUrl(process.env.EXPO_PUBLIC_API_URL)` at app start.
4. Express middleware verifies the Supabase JWT and sets `req.userId`. Every
   Drizzle query is scoped to it. A missing or invalid token returns `401`.

### 7.4 Query keys and caching

| Key | Invalidated by |
|---|---|
| `['task-types']` | never — static, `staleTime: Infinity` |
| `['profile']` | `updateProfile` |
| `['lists']` | `createList`, `updateList`, `deleteList` |
| `['tasks', filters]` | every task mutation |
| `['tasks', taskId]` | mutations on that task |

- **Optimistic updates** on `startTask`, `pauseTask`, `resumeTask`,
  `completeTask`, and `deleteTask`. These are the one-tap actions; Principle V
  means the UI must not wait on a round trip. Roll back on error with a
  supportive retry message.
- **Non-optimistic** on create and update — the server computes the score, so
  the client waits for the authoritative value rather than guessing.
- Writes require a connection. A failed mutation rolls back, surfaces a retry
  affordance, and never silently drops the user's work.

---

## 8. Frontend Architecture

Per the Qamar Labs Frontend Implementation Guide, which § 11 makes this
project's standard.

### 8.1 Domains and routes

| Domain | Routes |
|---|---|
| `auth` *(new)* | `/(auth)/sign-in`, `/(auth)/callback` |
| `lists` *(new)* | `/(tabs)/lists`, `/list/[listId]`, `/list-form` |
| `task-planning` | `/(tabs)/tasks`, `/task-form` |
| `time-focus` | `/timer` |
| `progress` | `/(tabs)/insights`, `/history`, `/achievements` |
| `learning` | `/(tabs)/learn`, `/lesson` |
| `notifications` | `/notifications` |
| `user-profile` | `/(tabs)/profile`, `/privacy` |

### 8.2 Folder layout

```
app/                          # expo-router routes — thin; each renders one feature
domains/<domain>/
  features/                   # screen-level compositions (page bodies)
  components/                 # pieces used only inside this domain
  hooks/                      # domain hooks (useTasks, useCreateTask)
  api/                        # query keys + wrappers over generated hooks
  services/                   # cross-domain orchestration
  store.ts  selectors.ts  types.ts  index.ts
shared/
  ui/  hooks/  lib/  theme/  types/  api/
```

Rules:

- A route file contains no business logic — it renders exactly one feature.
- **Domains never import each other's internals.** Cross-domain access goes
  through the public barrel (`domains/<d>/index.ts`) or `shared/`. Anything two
  domains need moves to `shared/`.
- The ~3,400 lines currently in `app/*.tsx` move into `domains/*/features/`,
  leaving route files at a handful of lines each.

### 8.3 State ownership

| Kind | Owner | Examples |
|---|---|---|
| Server data | React Query | lists, tasks, task types, profile |
| Client-only, shared or surviving unmount | Zustand slices | active timer, onboarding flag, filter selections |
| Everything else | `useState` — the default | form fields, sheet open/closed |

One rule to remember: **if the server can send it, React Query owns it.** The
existing Zustand subscription discipline — always use a selector, never
destructure `useAppStore()` — is preserved for what remains.

### 8.4 Reusable hooks

Extract on the third repetition, not the first. Data hooks live in
`domains/<d>/hooks/` and wrap the generated hooks, so screens never import
`@workspace/api-client-react` directly. That indirection is what keeps the
generated layer replaceable.

### 8.5 Loading, empty, and error states

| State | Treatment |
|---|---|
| Loading | Skeleton rows matching the final layout — never a full-screen spinner over existing content |
| Empty | `shared/ui/EmptyState` with an encouraging, actionable message (Principle III) |
| Query error | `shared/ui/ErrorFallback` inline, with retry |
| Mutation error | Toast plus optimistic rollback |
| Render crash | `shared/ui/ErrorBoundary` per route |

All four shared components already exist and are reused as-is.

### 8.6 Forms and validation

- `react-hook-form` with `@hookform/resolvers/zod` for every form.
- Schemas come from the generated `@workspace/api-zod` package, so client and
  server validate against the same contract.
- Field-level errors render inline beneath the field; server `422` responses
  map onto the matching fields by name.
- Copy stays factual and never blaming (Principle III): "Pick a task type to
  continue," not "You forgot to select a task type."

### 8.7 Documented exceptions

| Case | Exception | Why |
|---|---|---|
| Countdown timer | A single module-level `setInterval` in `TimerProvider`, with direct `getState()` access | Per-second ticks through normal subscriptions re-render the tree |
| Task lists over 50 items | `FlatList` virtualisation instead of `ScrollView` | Long lists on low-end Android |
| Ad banner | Imperative SDK lifecycle outside React | Third-party constraint |

Each exception carries a comment explaining itself at the site.

### 8.8 Permissions

Two distinct checks:

1. **Route level** — unauthenticated users are redirected to
   `/(auth)/sign-in` by the root layout guard. No route renders without a
   session.
2. **Element level** — not needed for the MVP; the app is single-user with no
   roles. Ownership is enforced server-side, not by hiding UI.

### 8.9 Performance

Memoise only where a measurement justifies it. The existing four optimisations
stay and are the template: the `TaskCard` comparator, `TimerSecondsText`
isolation, `useMemo` around pure derivations, and the interval singleton. No
new `memo` / `useMemo` / `useCallback` without a profile showing the problem.

### 8.10 Styling and theming

`shared/theme/colors.ts` is **unchanged** — same dark palette, same tokens.
Components read colours through `useColors()`, never literals. Styles use
`StyleSheet.create`; only colour and layout values computed at runtime go
inline. Spacing follows a 4pt scale; radius comes from `colors.radius`.

### 8.11 Naming and shared types

- Components `PascalCase.tsx`; hooks `useThing.ts`; directories `kebab-case`.
- Domain types live in `domains/<d>/types.ts`; types crossing two or more
  domains live in `shared/types/`, as `TaskCategory` already does.
- Server-derived types are imported from the generated schemas, never
  hand-copied.

### 8.12 Testing

Unit tests are required for pure logic where a silent bug is expensive:

- score computation (base × priority multiplier),
- the task state machine, valid and invalid transitions,
- focused-duration arithmetic including pauses,
- streak computation.

Tests live beside their subject as `*.test.ts`. UI tests are optional.

### 8.13 Accessibility

Every pressable carries an `accessibilityLabel` and a ≥44pt touch target; the
timer announces state changes via `accessibilityLiveRegion`; text meets 4.5:1
contrast against its background — verified against the existing palette, not
by changing it.

---

## 9. Migration Plan

| Phase | Work | Status |
|---|---|---|
| 0 | `CLAUDE.md` rewrite; `replit.md` removed — see § 11 | done |
| 1 | `comebackapp` schema, Drizzle models, task-type seeds | done |
| 2 | OpenAPI additions, Express routes, JWT middleware, scoring service | done |
| 3 | Codegen; Supabase auth in the app; sign-in route and guard | done |
| 4 | Domain restructure to the guide's layout — no behaviour change | done |
| 5 | Lists, priority, and score UI; React Query replaces the task slice | done |
| 6 | One-time upload of existing AsyncStorage tasks into a "My Tasks" list | done |

Deviations worth recording:

- **Phase 4 was not a pure move.** Screens changed in the same pass because
  Phase 5 replaced the task slice underneath them; splitting the two would have
  meant landing a file move that did not compile.
- **The dashboard route was unassigned** in § 8.1. It lives in `daily-tasks`,
  the domain whose habit loop it exists to serve (Principle I).
- **`user_profiles` was migrated too.** § 2 lists `daily-tasks`, `progress`,
  `learning` and `notifications` as keeping local slices; `user-profile` is
  absent from that list and § 5.2 defines the table, so the profile is now
  server-backed. `onboardingComplete` stays local — it is a device fact.
- **RLS policies and the `auth.users` trigger** live in
  [`lib/db/src/policies.sql`](lib/db/src/policies.sql), applied by
  `pnpm --filter @workspace/db run seed`, because `drizzle-kit push` reconciles
  tables but not policies, triggers or functions.

Phase 4 is a pure move — no logic changes — so it can be reviewed as a
rename-only diff. Phase 6 runs once per device on first authenticated launch
and is idempotent, guarded by a local `migratedAt` flag.

---

## 10. Constraints

| Constraint | Rule |
|---|---|
| Colour scheme | `shared/theme/colors.ts` is frozen — no new colours, no token renames |
| Timer | No changes to tick, interval ownership, or saved-progress behaviour (§ 6.4) |
| Product theme | Comeback / job-search recovery — unchanged, per CLAUDE.md Constraints |
| Title length | 1–100 chars, matching the current form |
| List name | 1–60 chars, unique per user among active lists |
| Score authority | Server-computed; client-supplied scores ignored |
| Privacy | Every query user-scoped; RLS on every table |

---

## 11. Documentation — Applied (Phase 0)

**Status: done.** `CLAUDE.md` and `specs/` are now the only project
documentation. `replit.md` has been deleted.

### 11.1 What `replit.md` carried, and where it went

| Content | Disposition |
|---|---|
| Workspace overview, Node/TS versions, stack list | → `CLAUDE.md` § Tech Stack |
| Key commands | → `CLAUDE.md` § Key Commands |
| Artifact list | → `CLAUDE.md` § Repository Layout, extended with `lib/*` |
| Five timer subscription rules | → `CLAUDE.md` § Standards › Frozen: the countdown timer, **verbatim in substance, with corrected paths** |
| Two known timer limitations | → same section, kept as accepted trade-offs |
| Everything else | dropped |

The timer rules could not simply be deleted: the frozen-timer constraint in
§ 6.4 depends on them, and they are the only record of *why* the subscription
discipline exists.

### 11.2 Stale paths corrected in the move

`replit.md` pointed at `store/selectors.ts`, `lib/computations.ts`, and
`components/TimerProvider.tsx` — none of which have existed since the domain
refactor in `2fa0143`. The versions now in `CLAUDE.md` point at
`domains/*/selectors.ts`, `domains/progress/services/`, and
`domains/time-focus/components/TimerProvider.tsx`.

The one code reference to the deleted file — the docblock in
[root.ts](artifacts/career-tracker/shared/store/root.ts) — now points at
`CLAUDE.md`.

### 11.3 Other CLAUDE.md changes in the same pass

- The loose "Overview / User Stories / Acceptance Criteria" block that sat
  between Principles V and VI, splitting them in half, was removed. Its
  overview merged into `## Overview`; its acceptance criteria are superseded
  by § 4 of this spec.
- Principles I–VI are contiguous again.
- New `## Specifications` section names `CLAUDE.md` + `specs/` as the only
  authoritative documentation, and indexes the two specs.
- New `## Standards` section: the seven frontend rules that matter before
  touching a file, pointing at § 8 here for the full version.
- Constraints gained the frozen colour scheme and the frozen timer.
- Typos fixed: "todoilst" → "todoist-style", "taask" → "task".

### 11.4 Governance record

Logged in `CLAUDE.md` under Amendment log, per the Governance requirement to
document each amendment's change, rationale, and core-loop impact:

> **Change**: Removed `replit.md` and made `CLAUDE.md` plus `specs/` the only
> project documentation; absorbed the stack, commands, layout, and
> frozen-timer rules; added Specifications and Standards sections; relocated
> the loose acceptance criteria into this spec.
>
> **Rationale**: Documentation had drifted into three places with no clear
> authority, and `replit.md` described a file layout that no longer existed.
>
> **Impact on the core loop**: None. Every principle keeps its wording and
> ordering; only the surrounding structure changed.

`CLAUDE.md` is now at **Version 1.1.0**, **Last Amended: 2026-08-30**.

---

## 12. Edge Cases

1. **Deleting a list with tasks** — cascades all its tasks to `deleted`. The
   confirmation states the task count. Restoring the list restores the tasks
   deleted by that cascade, matched on `deleted_at`.
2. **Task type deleted while tasks reference it** — prevented by
   `ON DELETE RESTRICT`. System types cannot be deleted at all.
3. **Priority changed on a completed task** — the score is frozen at
   completion, so the edit is rejected with `409 TaskAlreadyCompleted`.
4. **Two devices, one account** — last write wins per field. The active timer
   is device-local; starting a task on device B while it runs on device A
   pauses A's session on next foreground.
5. **Token expiry mid-session** — `custom-fetch` refreshes via Supabase and
   retries once. A hard failure routes to sign-in with local state intact.
6. **App killed with a running timer** — `saved_remaining_seconds` was
   persisted at the last pause or unmount, so the task reopens at that point.
   Wall-clock time while the app was dead is not counted.
7. **Empty list** — the empty state offers task creation directly, not just a
   message (Principle V: fewer steps).
8. **Score of a restored task** — recomputed from its current task type and
   priority at restore, since the type's base score may have changed.

---

## 13. Error Conditions

| Condition | HTTP | Error | User-facing copy (Principle III) |
|---|---|---|---|
| Missing or invalid JWT | 401 | `Unauthorized` | "Please sign in to continue." |
| Task or list belongs to another user | 404 | `NotFound` | "We couldn't find that." |
| Duplicate list name | 409 | `DuplicateListName` | "You already have a list with that name." |
| Invalid status transition | 409 | `InvalidTaskTransition` | "That task isn't running right now." |
| Scoring edit on a completed task | 409 | `TaskAlreadyCompleted` | "This one's already done — nice work." |
| Unknown `task_type_id` | 422 | `UnknownTaskType` | "Pick a task type to continue." |
| Title or name length violation | 422 | `ValidationError` | Field-level, states the limit |
| Network failure on a mutation | — | client rollback | "That didn't save. Tap to try again." |

No error message assigns blame or implies failure on the user's part.

---

## 14. Examples

### Creating a task with an urgent priority

```jsonc
// POST /api/tasks
{
  "listId": "b1f0…",
  "title": "Finish the distributed cache design doc",
  "taskTypeId": "sd-uuid",          // system_design, base score 15
  "priority": "urgent",
  "estimatedDurationMinutes": 60
}

// 201 Created
{
  "id": "t_9a3…",
  "listId": "b1f0…",
  "title": "Finish the distributed cache design doc",
  "taskType": { "type": "system_design", "label": "System Design", "score": 15 },
  "priority": "urgent",
  "score": 30,                      // 15 × 2 — urgent doubles
  "status": "pending",
  "estimatedDurationMinutes": 60,
  "totalPausedMs": 0
}
```

### A pause / resume / complete cycle

```jsonc
// POST /api/tasks/t_9a3…/start
{ "status": "in_progress", "startedAt": "2026-08-30T14:00:00Z" }

// POST /api/tasks/t_9a3…/pause      (20 minutes in)
{ "status": "paused", "pausedAt": "2026-08-30T14:20:00Z",
  "savedRemainingSeconds": 2400 }

// POST /api/tasks/t_9a3…/resume     (after a 10-minute break)
{ "status": "in_progress", "pausedAt": null, "totalPausedMs": 600000 }

// POST /api/tasks/t_9a3…/complete   (at 15:10)
{ "status": "completed",
  "completedAt": "2026-08-30T15:10:00Z",
  "actualDurationMinutes": 60,       // 70 elapsed − 10 paused
  "score": 30 }
```

### Soft delete

```jsonc
// DELETE /api/tasks/t_9a3…
{ "id": "t_9a3…", "status": "deleted", "deletedAt": "2026-08-30T15:12:00Z" }
// Row retained; excluded from every default query; POST …/restore undoes it.
```

---

## 15. Open Questions

1. **OAuth providers** — Google and GitHub assumed. GitHub fits the engineer
   persona, Google the student persona. Confirm before configuring Supabase.
2. **Task-type customisation** — the schema supports user-defined types
   (`is_system = false`), but no UI is specified. Post-MVP?
3. **Score visibility** — where does the running total surface: the dashboard
   header, the insights tab, or both? This determines which queries the
   dashboard needs.
4. **`daily-tasks` vs `tasks`** — two task concepts now coexist: the routine
   generator from [daily-task-list.md](specs/daily-task-list.md) and the
   user's own tasks. Should generated daily tasks land in a system-owned
   "Today" list so they share scoring, or stay separate?
