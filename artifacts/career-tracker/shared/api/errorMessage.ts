/**
 * Turns a failed mutation into something worth showing a person.
 *
 * Create and update used to register only `onSuccess`, so when the server
 * rejected a write the form simply closed and the item was absent — no toast,
 * no explanation, nothing to distinguish a server fault from the user's own
 * mistake. That is the experience Principle III exists to prevent, and it is
 * why a database misconfiguration read as "the app does not create tasks".
 *
 * Spec: backend-write-failures-and-ui-placement.md § AC-2, C6.
 */
import { ApiError } from '@workspace/api-client-react';

/** States what happened, offers the next step, blames no one. */
export const RETRY_MESSAGE = "That didn't save. Tap to try again.";

/**
 * `ApiProblem` bodies (`{ code, title }`) already carry copy reviewed against
 * Principle III on the server, so a 4xx speaks for itself — "A list with that
 * name already exists" is far more useful than a generic retry line.
 *
 * A 5xx or a network failure does not: its detail describes a server fault the
 * user cannot act on and should not have to read. Those get the neutral line.
 */
export function writeErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status < 500) {
    const title = (error.data as { title?: unknown } | null)?.title;
    if (typeof title === 'string' && title.trim()) return title.trim();
  }
  return RETRY_MESSAGE;
}
