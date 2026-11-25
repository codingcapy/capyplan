import type { Context } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { createHash, randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import { and, eq, lt } from "drizzle-orm";
import { db } from "../db";
import { refreshTokens as refreshTokensTable } from "../schemas/refreshTokens";

export const REFRESH_COOKIE = "refresh_token";
export const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const COOKIE_PATH = "/api/v0/user";
const isProd = process.env.NODE_ENV === "production";

export function hashRefreshToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function signAccessToken(userId: string) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
    expiresIn: "15m",
  });
}

export async function issueRefreshToken(
  c: Context,
  userId: string,
  familyId: string = randomBytes(16).toString("hex"),
) {
  const token = randomBytes(48).toString("hex");
  await db
    .delete(refreshTokensTable)
    .where(
      and(
        eq(refreshTokensTable.userId, userId),
        lt(refreshTokensTable.expiresAt, new Date()),
      ),
    );
  await db.insert(refreshTokensTable).values({
    userId,
    tokenHash: hashRefreshToken(token),
    familyId,
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });
  setCookie(c, REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "Lax",
    path: COOKIE_PATH,
    maxAge: REFRESH_TTL_MS / 1000,
  });
}

export function clearRefreshCookie(c: Context) {
  deleteCookie(c, REFRESH_COOKIE, { path: COOKIE_PATH, secure: isProd });
}

export async function revokeAllUserSessions(userId: string) {
  await db
    .delete(refreshTokensTable)
    .where(eq(refreshTokensTable.userId, userId));
}
