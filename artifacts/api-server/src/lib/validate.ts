/**
 * Request validation against the generated Zod schemas.
 *
 * Client and server validate the same contract because both sides import from
 * `@workspace/api-zod`, which is generated from `openapi.yaml` (spec § 8.6).
 * Zod issues are mapped onto field names so the app can render them inline
 * beneath the offending input.
 */
import type { ZodError, ZodType } from "zod";
import { validationError } from "./errors";

function toFieldErrors(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_";
    // First issue per field wins — showing one clear message beats stacking.
    fields[key] ??= issue.message;
  }
  return fields;
}

/** Parses `value`, throwing `422 ValidationError` with field-level detail. */
export function parseOrThrow<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw validationError(toFieldErrors(result.error));
  }
  return result.data;
}
