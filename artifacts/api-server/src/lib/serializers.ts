/**
 * Drizzle row -> API shape.
 *
 * Kept in one place so the wire contract cannot drift column by column: if a
 * field is not mapped here it does not leave the server.
 */
import type { List, Profile, Task, TaskType, UserPreferences } from "@workspace/api-zod";
import {
  DEFAULT_USER_PREFERENCES,
  type ListRow,
  type TaskRow,
  type TaskTypeRow,
  type UserProfileRow,
} from "@workspace/db";

export function toTaskType(row: TaskTypeRow): TaskType {
  return {
    id: row.id,
    type: row.type,
    label: row.label,
    score: row.score,
    isSystem: row.isSystem,
  };
}

export function toList(row: ListRow, taskCount: number): List {
  return {
    id: row.id,
    name: row.name,
    position: row.position,
    isArchived: row.isArchived,
    taskCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toTask(row: TaskRow, taskType: TaskTypeRow): Task {
  return {
    id: row.id,
    listId: row.listId,
    taskTypeId: row.taskTypeId,
    taskType: toTaskType(taskType),
    title: row.title,
    description: row.description,
    priority: row.priority,
    score: row.score,
    status: row.status,
    estimatedDurationMinutes: row.estimatedDurationMinutes,
    actualDurationMinutes: row.actualDurationMinutes,
    savedRemainingSeconds: row.savedRemainingSeconds,
    totalPausedMs: row.totalPausedMs,
    startedAt: row.startedAt,
    pausedAt: row.pausedAt,
    completedAt: row.completedAt,
    deletedAt: row.deletedAt,
    dueDate: row.dueDate,
    position: row.position,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toProfile(row: UserProfileRow): Profile {
  // A row written before a preference was introduced deserializes to `{}`;
  // filling the gaps here keeps the client from special-casing older accounts.
  const preferences: UserPreferences = {
    ...DEFAULT_USER_PREFERENCES,
    ...(row.preferences ?? {}),
  };

  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    careerTrack: row.careerTrack,
    seniority: row.seniority,
    targetRole: row.targetRole,
    dailyMinutesTarget: row.dailyMinutesTarget,
    weeklyTasksTarget: row.weeklyTasksTarget,
    preferences,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
