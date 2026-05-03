# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

- `artifacts/api-server` — Express API
- `artifacts/career-tracker` — Expo app: Career Comeback Time Tracker
- `artifacts/mockup-sandbox` — Vite-based component preview server

## Career Tracker (artifacts/career-tracker)

Expo Router 6 + React Native + Zustand v5 (persist + AsyncStorage). 6-category task system with countdown timer, history/analytics, and rule-based career suggestions.

### Performance architecture (important)

The countdown timer ticks once per second, mutating `activeTimer.remainingSeconds`. Naive `useAppStore()` consumers re-render every tick — that was the original bottleneck. The codebase now follows strict subscription rules:

1. **Never destructure from `useAppStore()` without a selector.** Use the granular hooks in `store/selectors.ts` (e.g. `useTasks`, `useDayRecords`, `useActiveTaskId`, `useIsTimerPaused`, `useActiveTask`).
2. **Per-second updates are isolated to a single leaf.** `components/TimerSecondsText.tsx` is the only component subscribed to `remainingSeconds`. Banners and screens that contain it do not re-render every tick.
3. **Pure derivations live outside the store.** `lib/computations.ts` (`computeStreak`, `computeTodayStats`, `computeWeeklyData`) — wrap calls in `useMemo`.
4. **List items are memoized.** `TaskCard` uses `React.memo` with a custom comparator `(prev, next) => prev.task === next.task`. The comparator intentionally ignores `onEdit` identity because dashboards pass inline arrows like `onEdit={() => handleEdit(task.id)}` — Zustand's immutable updates guarantee `task` references only change when that task actually changes.
5. **The interval is a singleton.** `components/TimerProvider.tsx` mounts once at the root and owns the only `setInterval`. It uses `useAppStore.getState()` inside the callback so the interval itself never causes re-renders.

### Known limitations

- `setInterval(1000)` decrement model. Drift is negligible (<1%) for typical session lengths but a wall-clock derivation (compute remaining from `startedAt + totalPausedMs`) would be more robust if the app is ever backgrounded for long stretches. Migration would also need to update `onRehydrateStorage` to either auto-pause on restore or recompute startedAt — non-trivial; left as future work.
- Persist middleware writes to AsyncStorage on every tick. Each write is small (~1KB) and AsyncStorage on RN handles this fine in practice. A throttled storage wrapper or `partialize` excluding `activeTimer` would eliminate it entirely if battery profiling ever shows it as a hotspot.
