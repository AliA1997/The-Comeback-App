# Comeback App Constitution

## Overview

A comeback app for laid-off software engineers struggling in the job market. The app helps users build routine and consistency, making sure tasks are done on a daily basis.

In product terms it is a todoist-style app with personalization: create, read, update, and delete tasks and lists, with a score attached to every task to make progress visible. Feature-level behavior is specified in [`specs/`](specs/) — see [Specifications](#specifications).

## Core Principles

### I. Daily Consistency First
Every feature must reinforce the daily habit loop. Users complete a small set of tasks each day (applications, coding practice, networking, learning). Streaks, check-ins, and progress tracking are core — not add-ons. No feature ships if it distracts from the daily routine.

### II. Routine Over Overwhelm
Laid-off engineers are stressed and often burned out. The app must reduce decision fatigue: present a clear, pre-structured daily plan rather than an open-ended to-do list. Default routines are provided out of the box and customizable later.

### III. Supportive, Never Punitive
Tone matters. Missed days trigger encouragement and easy re-entry ("restart your streak"), never guilt or shame. All copy, notifications, and empty states must be reviewed against this principle.

### IV. Momentum Made Visible
Progress must always be visible: streaks, completed-task counts, applications sent, skills practiced. Users should be able to see in under 5 seconds that they are moving forward.

### V. Simplicity and Speed
Logging a completed task takes one tap. Daily check-in takes under 2 minutes. Any flow requiring more than 3 steps must be justified. Ship small, iterate fast.

### VI. Privacy by Default
Job-search data is sensitive (employer names, rejection notes, personal goals). Data stays private to the user; nothing is shared or public without explicit opt-in.

## Constraints
- The theme is already defined: comeback/job-search recovery for laid-off software engineers. Do not pivot the product theme.
- Core loop is daily task completion — routine and consistency are the non-negotiable foundation.
- MVP scope: daily task list, routine templates, streak/consistency tracking, reminders.
- The color scheme in `artifacts/career-tracker/shared/theme/colors.ts` is frozen. No new colors, no token renames.
- The countdown timer is frozen. See [Frozen: the countdown timer](#frozen-the-countdown-timer).

## Specifications

This file and the documents in [`specs/`](specs/) are the only project documentation. Nothing else — no `replit.md`, no README, no wiki — is authoritative. If behavior isn't captured in one of these two places, it isn't specified.

| Spec | Covers |
|---|---|
| [`specs/daily-task-list.md`](specs/daily-task-list.md) | Daily task generation, one-tap completion, streak rules, day rollover |
| [`specs/refactor-comeback-app.md`](specs/refactor-comeback-app.md) | Lists, task types and scoring, priority levels, task lifecycle, Supabase auth, the `comebackapp` schema, and the frontend standard |
| [`specs/backend-write-failures-and-ui-placement.md`](specs/backend-write-failures-and-ui-placement.md) | Backend write failures (lists, tasks, profiles), OAuth account switching, tab-bar layout, timer visibility |

Each spec states which core principles it serves, and carries its own acceptance criteria, edge cases, and error conditions. Product changes are made by amending a spec, not by editing code first.

## Tech Stack

**App** — React Native · Expo (SDK 54) · Expo Router 6 · React Query (server state) · Zustand v5 (client-only state, persisted to AsyncStorage) · react-hook-form + `@hookform/resolvers/zod` for forms · supabase-js for identity

**Backend** — Express 5 · Drizzle ORM · PostgreSQL, application tables in the `comebackapp` schema · Supabase Auth (OAuth) for identity, verified in the API with `jose`

**Shared** — TypeScript 5.9 · Zod · Orval for API codegen from the OpenAPI spec · esbuild for the server bundle · `node --test` via `tsx` for unit tests

**Tooling** — pnpm workspaces · Node.js 24

## Repository Layout

```
artifacts/api-server        Express API — routes, JWT middleware, scoring, lifecycle
artifacts/career-tracker    The Expo app
artifacts/mockup-sandbox    Vite component preview server
lib/api-spec                OpenAPI spec + Orval config (source of truth for the API)
lib/api-client-react        Generated React Query hooks + custom fetch
lib/api-zod                 Generated Zod schemas
lib/db                      Drizzle schema, client, RLS/trigger DDL, task-type seeds
specs/                      Feature specifications
```

App domains: `auth`, `lists`, `task-planning`, `time-focus`, `progress`,
`learning`, `notifications`, `daily-tasks`, `user-profile`.

## Key Commands

```
pnpm run typecheck                                     Typecheck every package
pnpm run test                                          Run unit tests in every package
pnpm run build                                         Typecheck + build all packages
pnpm --filter @workspace/api-spec run codegen          Regenerate API hooks and Zod schemas
pnpm --filter @workspace/db run push                   Push DB schema changes (dev only)
pnpm --filter @workspace/db run seed                   Apply RLS/trigger DDL + seed task types
pnpm --filter @workspace/api-server run dev            Run the API server locally
pnpm --filter @workspace/career-tracker run dev        Run the Expo app
```

### Environment

| Variable | Used by | Purpose |
|---|---|---|
| `DATABASE_URL` | `lib/db`, API | Postgres connection |
| `SUPABASE_URL` | API | Issuer for JWT verification |
| `SUPABASE_JWT_SECRET` | API | Fallback for legacy HS256 projects |
| `PORT` | API | Listen port |
| `EXPO_PUBLIC_API_URL` | App | Base URL of the API server |
| `EXPO_PUBLIC_SUPABASE_URL` | App | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | App | Supabase anon key |

Without the two `EXPO_PUBLIC_SUPABASE_*` values the sign-in screen renders a
configuration notice instead of failing an auth attempt.

`DATABASE_URL` **must** point at the Supabase project's own Postgres. The
schema foreign-keys `user_profiles.id`, `lists.user_id` and `tasks.user_id` to
`auth.users(id)`, and the profile trigger fires on `auth.users` — none of which
exist in a separate database.

`SUPABASE_JWT_SECRET` is not optional for projects whose
`/auth/v1/.well-known/jwks.json` returns `{"keys":[]}`. Those still sign user
tokens with the shared HS256 secret, and `requireAuth` dispatches on the
token's `alg`, so the JWKS path can never verify them.

### Deploying the API

`artifacts/api-server/Dockerfile` builds from the **repo root**, not from the
artifact directory:

```
docker build -f artifacts/api-server/Dockerfile -t comeback-api .
```

It exists because platform auto-detection (Nixpacks and similar) mis-handles
this workspace's pnpm catalog and `minimumReleaseAge` policy. esbuild bundles
every dependency, so the runtime stage ships `dist/` and nothing else.

Set `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_JWT_SECRET` and `NODE_ENV=production`;
the host injects `PORT`. Point health checks at `/api/healthz` — the only route
that answers without a token.

After the first deploy, run `push` then `seed` against the same database, or
task creation has no task types to reference.

### Building the app

`eas build -p android --profile preview` produces the installable APK;
`--profile production` produces the Play Store AAB.

Both profiles pin `"node": "22.23.1"`. EAS images default to Node 20, and the
repo's `packageManager: "pnpm@11.9.0"` needs Node >= 22.13 for `node:sqlite` —
without the pin the install phase fails with `ERR_UNKNOWN_BUILTIN_MODULE`
before any app code is reached. A new build profile must copy that key.

The two `EXPO_PUBLIC_SUPABASE_*` values live as EAS environment variables, not
in `eas.json`. Note that an `env` entry in `eas.json` OVERRIDES the EAS-hosted
variable of the same name, so an empty string there silently wins.

## Standards

The frontend follows the Qamar Labs Frontend Implementation Guide, mapped onto this repo in [`specs/refactor-comeback-app.md` § 8](specs/refactor-comeback-app.md). The rules below are the ones worth knowing before touching any file; § 8 has the full version.

- **Domains own their code.** `domains/<domain>/` holds `features/` (screen bodies), `components/`, `hooks/`, `api/`, `services/`, `store.ts`, `selectors.ts`, `types.ts`. Route files in `app/` carry no business logic — each renders exactly one feature.
- **Domains never import each other's internals.** Cross-domain access goes through the public barrel (`domains/<d>/index.ts`) or `shared/`. Anything two domains need moves to `shared/`.
- **If the server can send it, React Query owns it.** Lists, tasks, task types and the profile are React Query. Zustand holds only client-only state that is shared or must survive unmount — the active timer, the onboarding flag, the auth session mirror, day records, learning progress. Everything else is `useState`.
- **Services that run off a React tick read the cache, not a copy.** `shared/api/taskCache.ts` and `shared/api/profileCache.ts` exist so the achievement evaluator, nudge scheduler and idle-ad timer never keep a parallel truth.
- **Cross-domain side effects live in `services/`.** Store slices are pure data mutators and never reach across domains; orchestration calls `useAppStore.getState()` from a service.
- **Read colors through `useColors()`, never literals.** The palette is frozen (see Constraints).
- **Memoize only where a measurement justifies it.** The four optimizations below are the template, not a license to add more.
- **Copy is reviewed against Principle III** before it ships — including error messages, empty states, and notifications.

### Frozen: the countdown timer

The timer ticks once per second, mutating `activeTimer.remainingSeconds`. Naive `useAppStore()` consumers re-render every tick — that was the original bottleneck. These five rules are what keep it fast, and changing any of them is a breaking change to a frozen subsystem:

1. **Never destructure from `useAppStore()` without a selector.** Use the granular hooks in `domains/*/selectors.ts` (`useTasks`, `useActiveTaskId`, `useIsTimerPaused`, `useActiveTask`).
2. **Per-second updates are isolated to a single leaf.** `domains/time-focus/components/TimerSecondsText.tsx` is the only component subscribed to `remainingSeconds`. Banners and screens containing it do not re-render every tick.
3. **Pure derivations live outside the store**, in `domains/progress/services/` (`StatsEngine`, `StreakEngine`) — wrap calls in `useMemo`.
4. **List items are memoized.** `TaskCard` uses `React.memo` with the comparator `(prev, next) => prev.task === next.task`. It intentionally ignores `onEdit` identity because dashboards pass inline arrows; Zustand's immutable updates guarantee `task` references change only when that task changes.
5. **The interval is a singleton.** `domains/time-focus/components/TimerProvider.tsx` mounts once at the root and owns the only `setInterval`. It reads `useAppStore.getState()` inside the callback so the interval never causes re-renders.

Two known limitations are accepted deliberately:

- The `setInterval(1000)` decrement model drifts under 1% for typical session lengths. A wall-clock derivation from `startedAt + totalPausedMs` would be more robust across long backgrounding, but migrating would also need `onRehydrateStorage` to auto-pause or recompute `startedAt`. Left as future work.
- The persist middleware writes to AsyncStorage on every tick. Each write is ~1KB and AsyncStorage handles this fine in practice; a throttled storage wrapper or a `partialize` excluding `activeTimer` would eliminate it if battery profiling ever shows a hotspot.

## Development Workflow
- Every feature proposal must state which core principle it serves.
- UX copy is reviewed against Principle III before release.
- Prefer shipping a smaller daily-loop improvement over a larger feature outside the loop.
- Behavior changes start with a spec in `specs/`, then the code.

## Governance

This constitution supersedes other product decisions. Amendments require documenting the change, its rationale, and its impact on the daily-consistency core loop.

### Amendment log

**1.1.0 — 2026-08-30**

- **Change**: Removed `replit.md` and made this file plus `specs/` the only project documentation. Absorbed the stack, commands, repository layout, and frozen-timer rules from `replit.md`, correcting the file paths that went stale in the domain refactor (`2fa0143`). Added Specifications and Standards sections. Moved the product overview into `## Overview` and relocated the loose acceptance criteria — previously sitting between Principles V and VI — into `specs/refactor-comeback-app.md`. Added the frozen color scheme and frozen timer to Constraints.
- **Rationale**: Documentation had drifted into three places with no clear authority, and `replit.md` described a file layout that no longer existed. The loose acceptance criteria split the numbered principles in half.
- **Impact on the core loop**: None. Every principle keeps its wording and ordering; only surrounding structure changed.

**Version**: 1.1.0 | **Ratified**: 2026-07-18 | **Last Amended**: 2026-08-30
