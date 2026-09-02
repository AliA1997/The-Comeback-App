/**
 * Typed API errors.
 *
 * Every error the client can provoke has a machine-readable `code` and copy
 * that is safe to render verbatim. Per Principle III (Supportive, Never
 * Punitive) no message assigns blame or implies the user did something wrong.
 *
 * Spec: refactor-comeback-app.md § 13.
 */
import type { NextFunction, Request, Response } from "express";
import type { Problem, ProblemCode } from "@workspace/api-zod";
import { logger } from "./logger";

export class ApiProblem extends Error {
  readonly status: number;
  readonly code: ProblemCode;
  readonly detail: string | undefined;
  readonly fieldErrors: Record<string, string> | undefined;

  constructor(
    status: number,
    code: ProblemCode,
    title: string,
    options: { detail?: string; fieldErrors?: Record<string, string> } = {},
  ) {
    super(title);
    this.name = "ApiProblem";
    this.status = status;
    this.code = code;
    this.detail = options.detail;
    this.fieldErrors = options.fieldErrors;
  }

  toProblem(): Problem {
    return {
      code: this.code,
      title: this.message,
      ...(this.detail === undefined ? {} : { detail: this.detail }),
      ...(this.fieldErrors === undefined ? {} : { fieldErrors: this.fieldErrors }),
    };
  }
}

export const unauthorized = (detail?: string): ApiProblem =>
  new ApiProblem(401, "Unauthorized", "Please sign in to continue.", { detail });

export const notFound = (detail?: string): ApiProblem =>
  new ApiProblem(404, "NotFound", "We couldn't find that.", { detail });

export const duplicateListName = (): ApiProblem =>
  new ApiProblem(409, "DuplicateListName", "You already have a list with that name.", {
    fieldErrors: { name: "You already have a list with that name." },
  });

export const invalidTaskTransition = (detail: string): ApiProblem =>
  new ApiProblem(409, "InvalidTaskTransition", "That task isn't running right now.", {
    detail,
  });

export const taskAlreadyCompleted = (): ApiProblem =>
  new ApiProblem(409, "TaskAlreadyCompleted", "This one's already done — nice work.", {
    detail: "A completed task's score is kept as a record of what you finished.",
  });

export const unknownTaskType = (): ApiProblem =>
  new ApiProblem(422, "UnknownTaskType", "Pick a task type to continue.", {
    fieldErrors: { taskTypeId: "Pick a task type to continue." },
  });

export const validationError = (fieldErrors: Record<string, string>): ApiProblem =>
  new ApiProblem(422, "ValidationError", "A couple of fields need another look.", {
    fieldErrors,
  });

/** Postgres unique-violation code, raised by the partial index on list names. */
const PG_UNIQUE_VIOLATION = "23505";

export function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: unknown }).code === PG_UNIQUE_VIOLATION
  );
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof ApiProblem) {
    res.status(err.status).json(err.toProblem());
    return;
  }

  logger.error({ err }, "Unhandled error");

  const problem: Problem = {
    code: "InternalError",
    title: "Something went wrong on our end.",
    detail: "Nothing you did caused this. Try again in a moment.",
  };
  res.status(500).json(problem);
}
