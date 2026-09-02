/**
 * One-time upload of device-local tasks (spec § 9, phase 6).
 *
 * Before this refactor every task lived in one AsyncStorage-persisted Zustand
 * store. Those tasks are someone's record of the work they have already done,
 * so they are moved into a "My Tasks" list rather than dropped on the floor.
 *
 * Runs once per device on the first authenticated launch, is idempotent, and
 * is guarded by a `migratedAt` flag scoped to the user id — signing in as a
 * different account on the same device re-runs it for that account, and never
 * uploads one person's tasks into another's.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createList,
  createTask,
  listLists,
  listTaskTypes,
  type TaskType,
} from '@workspace/api-client-react';
import { MIGRATION_LIST_NAME } from '@/domains/lists/types';

const LEGACY_STORE_KEY = 'career-tracker-store';
const MIGRATION_FLAG_PREFIX = 'comeback:tasks-migrated:';

/** The pre-refactor task shape, as it sits in AsyncStorage. */
interface LegacyTask {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  estimatedDuration?: number;
  status?: string;
  savedRemainingSeconds?: number;
}

function flagKey(userId: string): string {
  return `${MIGRATION_FLAG_PREFIX}${userId}`;
}

async function readLegacyTasks(): Promise<LegacyTask[]> {
  const raw = await AsyncStorage.getItem(LEGACY_STORE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as { state?: { tasks?: unknown } };
    const tasks = parsed.state?.tasks;
    return Array.isArray(tasks) ? (tasks as LegacyTask[]) : [];
  } catch {
    // A corrupt store is not worth failing a launch over; there is simply
    // nothing to migrate.
    return [];
  }
}

/** Matches a legacy `category` string to a seeded task type by its label. */
function matchTaskType(category: string | undefined, taskTypes: TaskType[]): TaskType | null {
  if (!category) return null;
  const normalized = category.trim().toLowerCase();
  return taskTypes.find((t) => t.label.toLowerCase() === normalized) ?? null;
}

async function findOrCreateMigrationList(): Promise<string> {
  const lists = await listLists({ includeArchived: true });
  const existing = lists.find(
    (list) => list.name.toLowerCase() === MIGRATION_LIST_NAME.toLowerCase(),
  );
  if (existing) return existing.id;

  const created = await createList({ name: MIGRATION_LIST_NAME });
  return created.id;
}

export interface MigrationResult {
  migrated: number;
  skipped: number;
}

/**
 * Uploads local tasks for `userId`. Safe to call on every launch — it returns
 * immediately once the flag is set, and a partial failure leaves the flag
 * unset so the next launch retries the remainder.
 */
export async function runLocalTaskMigration(userId: string): Promise<MigrationResult | null> {
  if (await AsyncStorage.getItem(flagKey(userId))) return null;

  const legacyTasks = await readLegacyTasks();
  if (legacyTasks.length === 0) {
    await AsyncStorage.setItem(flagKey(userId), new Date().toISOString());
    return { migrated: 0, skipped: 0 };
  }

  const taskTypes = await listTaskTypes();
  if (taskTypes.length === 0) {
    // The catalogue has not been seeded; retry on the next launch rather than
    // uploading tasks with a guessed type.
    return null;
  }

  const listId = await findOrCreateMigrationList();
  const fallbackType = taskTypes[0]!;

  let migrated = 0;
  let skipped = 0;

  for (const legacy of legacyTasks) {
    const title = legacy.title?.trim();
    if (!title) {
      skipped += 1;
      continue;
    }

    const taskType = matchTaskType(legacy.category, taskTypes) ?? fallbackType;

    await createTask({
      listId,
      taskTypeId: taskType.id,
      title: title.slice(0, 100),
      description: legacy.description?.trim().slice(0, 500) ?? '',
      priority: 'medium',
      estimatedDurationMinutes: legacy.estimatedDuration ?? 25,
    });

    migrated += 1;
  }

  await AsyncStorage.setItem(flagKey(userId), new Date().toISOString());
  return { migrated, skipped };
}
