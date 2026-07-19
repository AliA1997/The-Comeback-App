# Spec: Daily Task List

**Status**: Implemented — `artifacts/career-tracker/domains/daily-tasks/`
**Created**: 2026-07-18
**Principles served**: I (Daily Consistency First), II (Routine Over Overwhelm), III (Supportive, Never Punitive), IV (Momentum Made Visible), V (Simplicity and Speed)

## Purpose

Generate the daily task list — the app's core loop. Each day the user gets a
small, pre-structured set of job-search tasks (applications, coding practice,
networking, learning) with streak tracking. This is the foundation the rest of
the app builds on: every session starts here, and completing today's tasks is
what advances the streak.

## Interface

```ts
type TaskCategory = "applications" | "practice" | "networking" | "learning";

interface Task {
  id: string;
  title: string;          // ≤ 80 chars
  category: TaskCategory;
  completed: boolean;
  date: string;           // ISO date (YYYY-MM-DD), local time
}

interface CreateDailyTasksInput {
  date?: string;          // defaults to today (local time)
  routineTemplateId?: string; // defaults to the user's active template,
                              // or the built-in default template
}

interface DailyTasksResult {
  tasks: Task[];          // today's tasks, max 5
  streak: number;         // current consecutive-day streak
}

interface CompleteTaskResult {
  task: Task;             // the completed task
  streak: number;         // streak after this completion
}

function createDailyTasks(input: CreateDailyTasksInput): DailyTasksResult;
function completeTask(taskId: string): CompleteTaskResult;
```

## Behavior

### Task generation — `createDailyTasks`

1. If tasks already exist for the requested date, return them unchanged
   (idempotent — calling twice never duplicates or regenerates tasks).
2. Otherwise, generate the day's tasks from the user's routine template.
   If the user has no template (first day), use the built-in default template.
3. Tasks are pre-structured and ordered by the template — the user is never
   presented with an open-ended to-do list (Principle II).
4. The response always includes the current streak so the UI can show
   momentum immediately (Principle IV).

### Task completion — `completeTask`

1. Completing a task is a single tap: the call takes only the task ID and
   requires no extra input (Principle V).
2. Marks the task `completed: true` and returns the updated task plus the
   current streak.
3. Completing at least one task on a given day extends the streak for that
   day; the streak counts consecutive days with activity, not per-task.
4. Completion is immediate and final for the happy path — no confirmation
   dialogs, no required notes.

### Streak rules

- The streak is the number of consecutive calendar days (local time) with at
  least one completed task, ending today.
- Missing a day resets the streak to 0. The next generation/completion after
  a missed day starts a fresh streak at 1.
- A reset is always accompanied by an encouraging "restart your streak"
  message — never guilt or shame (Principle III). Example copy:
  > "Welcome back! Today is day 1 of your comeback — your tasks are ready."
  Copy must be reviewed against Principle III before release.

### Day rollover

- The day boundary is midnight **local time**.
- After rollover, the previous day's tasks are frozen (no further
  completions) and `createDailyTasks` generates a fresh set for the new day.
- Streak evaluation for the previous day happens at rollover: if no task was
  completed, the streak resets per the rules above.

## Constraints

| Constraint | Rule | Principle |
|---|---|---|
| Task count | Max **5 tasks per day** | II — reduce overwhelm |
| Title length | ≤ **80 characters** | — |
| Category | One of `applications`, `practice`, `networking`, `learning` | — |
| Completion input | Task ID only — no extra input allowed | V — one tap |

## Edge Cases

1. **First day, no routine template**: use the built-in default template
   (a balanced mix across the four categories) so the user always has a plan
   out of the box.
2. **All tasks already completed**: `createDailyTasks` returns the completed
   list as-is; the UI shows a "done for today" state. No new tasks are
   generated until the next day.
3. **Day rollover at midnight local time**: see Behavior › Day rollover.
   A session that spans midnight must not complete yesterday's tasks as
   today's.
4. **User returns after missing multiple days**: streak has reset to 0;
   generate today's tasks normally and surface the encouraging restart
   message. Re-entry must be one call — no penalty flow, no backlog of
   missed tasks carried forward (Principle III).

## Error Conditions

| Condition | Error | Notes |
|---|---|---|
| Invalid category in template/task | `InvalidCategoryError` | Category not one of the four allowed values |
| Title exceeds 80 chars | `TitleTooLongError` | Rejected at generation time |
| Completing an already-completed task | `TaskAlreadyCompletedError` | No-op on state; streak unchanged |
| Completing a nonexistent task ID | `TaskNotFoundError` | Includes the unknown ID |

Error messages shown to the user must follow Principle III — factual and
helpful, never blaming.

## Examples

### Completing a task

```
Input:  completeTask("t1")
Output: {
  "task": {
    "id": "t1",
    "title": "Apply to 2 jobs",
    "category": "applications",
    "completed": true,
    "date": "2026-07-18"
  },
  "streak": 4
}
```

### Generating today's tasks (first day, default template)

```
Input:  createDailyTasks({})
Output: {
  "tasks": [
    { "id": "t1", "title": "Apply to 2 jobs",            "category": "applications", "completed": false, "date": "2026-07-18" },
    { "id": "t2", "title": "Solve 1 coding problem",     "category": "practice",     "completed": false, "date": "2026-07-18" },
    { "id": "t3", "title": "Message 1 person in your network", "category": "networking", "completed": false, "date": "2026-07-18" },
    { "id": "t4", "title": "Read 1 article or watch 1 talk",   "category": "learning",  "completed": false, "date": "2026-07-18" }
  ],
  "streak": 0
}
```

### Returning after a missed day

```
Input:  createDailyTasks({})
Output: { "tasks": [ ...fresh tasks... ], "streak": 0 }
UI:     "Welcome back! Today is day 1 of your comeback — your tasks are ready."
```

### Error: completing an unknown task

```
Input:  completeTask("does-not-exist")
Error:  TaskNotFoundError("does-not-exist")
```
