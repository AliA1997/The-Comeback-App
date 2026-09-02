/**
 * Lists Domain — types.
 *
 * Owns: the container that holds tasks, its ordering, and archiving.
 * The shape comes from the generated schemas and is never hand-copied.
 */
export type { CreateListRequest, List, UpdateListRequest } from '@workspace/api-client-react';

export const LIST_NAME_MAX_LENGTH = 60;

/**
 * The list every device-local task lands in on first sync (spec § 9, phase 6).
 * Matched by name because the migration runs before any list exists.
 */
export const MIGRATION_LIST_NAME = 'My Tasks';
