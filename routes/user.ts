import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db";
import { users as usersTable } from "../schemas/users";
import { refreshTokens as refreshTokensTable } from "../schemas/refreshTokens";
import { scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { enforceRateLimit } from "./rateLimit";
import {
  REFRESH_COOKIE,
  clearRefreshCookie,
  hashRefreshToken,
  issueRefreshToken,
  revokeAllUserSessions,
  signAccessToken,
} from "./session";

const scryptAsync = promisify(scrypt);

function toSafeUser(user: typeof usersTable.$inferSelect) {
  const { password, ...safeUser } = user;
  return safeUser;
}

export async function verifyPassword(hash: string, password: string) {
  const parts = hash.split(":");
  if (parts.length !== 2) throw new Error("Invalid hash format");
  const [salt, keyHex] = parts as [string, string];
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  const storedKey = Buffer.from(keyHex, "hex");
  if (derivedKey.length !== storedKey.length) return false;
  return timingSafeEqual(derivedKey, storedKey);
}

const loginSchema = z.object({
  email: z.string(),
  password: z.string().max(128),
});

const REUSE_GRACE_MS = 10_000;

export const userRouter = new Hono()
  .post("/login", zValidator("json", loginSchema), async (c) => {
    try {
      enforceRateLimit(c, "login", 10, 60_000);
      const loginInfo = c.req.valid("json");
      const queryResult = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, loginInfo.email));
      const user = queryResult[0];
      if (!user) return c.json({ result: { user: null, token: null } });
      if (user.status !== "active")
        return c.json({ result: { user: null, token: null } });
      const isPasswordValid = await verifyPassword(
        user.password,
        loginInfo.password,
      );
      if (!isPasswordValid) {
        return c.json({ result: { user: null, token: null } });
      }
      const token = signAccessToken(user.userId);
      await issueRefreshToken(c, user.userId);
      return c.json({ result: { user: toSafeUser(user), token } });
    } catch (error) {
      if (error instanceof HTTPException) throw error;
      console.error(error);
      c.status(500);
      return c.json({ message: "Internal Server Error" });
    }
  })
  .post("/refresh", async (c) => {
    try {
      enforceRateLimit(c, "refresh", 30, 60_000);
      const token = getCookie(c, REFRESH_COOKIE);
      if (!token) {
        c.status(401);
        return c.json({ message: "No refresh token" });
      }
      const tokenHash = hashRefreshToken(token);
      const [row] = await db
        .select()
        .from(refreshTokensTable)
        .where(eq(refreshTokensTable.tokenHash, tokenHash));
      if (!row) {
        clearRefreshCookie(c);
        c.status(401);
        return c.json({ message: "Unauthorized" });
      }
      if (row.revokedAt) {
        // Already-rotated token presented again. Outside the grace window
        // (which covers two tabs refreshing at once) treat it as theft and
        // kill the whole family.
        if (Date.now() - row.revokedAt.getTime() > REUSE_GRACE_MS) {
          await db
            .delete(refreshTokensTable)
            .where(eq(refreshTokensTable.familyId, row.familyId));
          clearRefreshCookie(c);
        }
        c.status(401);
        return c.json({ message: "Unauthorized" });
      }
      if (row.expiresAt < new Date()) {
        await db
          .delete(refreshTokensTable)
          .where(eq(refreshTokensTable.refreshTokenId, row.refreshTokenId));
        clearRefreshCookie(c);
        c.status(401);
        return c.json({ message: "Unauthorized" });
      }
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.userId, row.userId));
      if (!user || user.status !== "active") {
        await revokeAllUserSessions(row.userId);
        clearRefreshCookie(c);
        c.status(401);
        return c.json({ message: "Unauthorized" });
      }
      // Atomic rotation: only one concurrent request can flip revokedAt.
      const rotated = await db
        .update(refreshTokensTable)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(refreshTokensTable.refreshTokenId, row.refreshTokenId),
            isNull(refreshTokensTable.revokedAt),
          ),
        )
        .returning();
      if (rotated.length === 0) {
        c.status(401);
        return c.json({ message: "Unauthorized" });
      }
      await issueRefreshToken(c, user.userId, row.familyId);
      return c.json({
        result: {
          user: toSafeUser(user),
          token: signAccessToken(user.userId),
        },
      });
    } catch (error) {
      if (error instanceof HTTPException) throw error;
      console.error(error);
      c.status(500);
      return c.json({ message: "Internal Server Error" });
    }
  })
  .post("/logout", async (c) => {
    try {
      const token = getCookie(c, REFRESH_COOKIE);
      if (token) {
        await db
          .delete(refreshTokensTable)
          .where(eq(refreshTokensTable.tokenHash, hashRefreshToken(token)));
      }
    } catch (error) {
      console.error(error);
    }
    clearRefreshCookie(c);
    return c.json({ success: true });
  });
