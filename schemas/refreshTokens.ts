import {
  pgTable,
  varchar,
  timestamp,
  serial,
  index,
} from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";
import { users } from "./users";

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    refreshTokenId: serial("refresh_token_id").primaryKey(),
    userId: varchar("user_id")
      .references(() => users.userId, { onDelete: "cascade" })
      .notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
    familyId: varchar("family_id", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    revokedAt: timestamp("revoked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("refresh_tokens_user_id_idx").on(table.userId),
    index("refresh_tokens_family_id_idx").on(table.familyId),
  ],
);

export type RefreshToken = InferSelectModel<typeof refreshTokens>;
