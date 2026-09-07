/**
 * Supabase JWT verification.
 *
 * Supabase provides identity only — it issues the token, we verify it and
 * scope every Drizzle query to the resulting user id (spec § 7.3.4). A
 * missing or invalid token is a 401; no route renders user data without one.
 */
import type { NextFunction, Request, RequestHandler, Response } from "express";
import {
  createRemoteJWKSet,
  decodeProtectedHeader,
  jwtVerify,
  type JWTPayload,
} from "jose";
import { unauthorized } from "./errors";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** The authenticated Supabase user id. Set by `requireAuth`. */
      userId?: string;
      /**
       * The `email` claim from the access token, when the provider supplied
       * one. Optional by nature: not every identity carries a verified email,
       * so no route may require it.
       */
      userEmail?: string;
    }
  }
}

const SUPABASE_URL = process.env["SUPABASE_URL"];

if (!SUPABASE_URL) {
  throw new Error(
    "SUPABASE_URL must be set so the API can verify Supabase access tokens.",
  );
}

const issuer = `${SUPABASE_URL.replace(/\/+$/, "")}/auth/v1`;

// Asymmetric (RS256/ES256) projects publish a JWKS; jose caches and rotates it.
const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

// Legacy projects sign with the shared HS256 secret instead.
const legacySecret = process.env["SUPABASE_JWT_SECRET"];
const legacyKey = legacySecret
  ? new TextEncoder().encode(legacySecret)
  : null;

function bearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (!token || scheme?.toLowerCase() !== "bearer") return null;
  return token.trim() || null;
}

async function verify(token: string): Promise<JWTPayload> {
  const options = { issuer, audience: "authenticated" };

  // Dispatch on the token's own algorithm rather than trying the JWKS first
  // and falling back: an HS256 project would otherwise pay a failed network
  // round trip on every request before reaching the key it actually needs.
  const { alg } = decodeProtectedHeader(token);

  if (alg?.startsWith("HS")) {
    if (!legacyKey) {
      throw new Error(
        "Token is HS-signed but SUPABASE_JWT_SECRET is not configured.",
      );
    }
    const { payload } = await jwtVerify(token, legacyKey, options);
    return payload;
  }

  const { payload } = await jwtVerify(token, jwks, options);
  return payload;
}

/**
 * Verifies the bearer token and sets `req.userId`.
 *
 * Token expiry mid-session is a 401 rather than a refresh attempt — the
 * client refreshes via Supabase and retries once (spec § 12.5).
 */
export const requireAuth: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const token = bearerToken(req);
  if (!token) {
    next(unauthorized("No bearer token was supplied."));
    return;
  }

  verify(token)
    .then((payload) => {
      if (!payload.sub) {
        next(unauthorized("The token carries no subject claim."));
        return;
      }
      req.userId = payload.sub;
      // Supabase puts the verified address in the `email` claim. Anything
      // else in that slot is not an email and is ignored rather than stored.
      if (typeof payload["email"] === "string" && payload["email"].trim()) {
        req.userEmail = payload["email"].trim();
      }
      next();
    })
    .catch((err: unknown) => {
      next(unauthorized(err instanceof Error ? err.message : "Token verification failed."));
    });
};

/**
 * Narrows `req.userId` for handlers mounted behind `requireAuth`. Throws
 * rather than returning null so a mis-wired route fails loudly in dev.
 */
export function userIdOf(req: Request): string {
  if (!req.userId) {
    throw unauthorized("Route is missing the requireAuth middleware.");
  }
  return req.userId;
}
