import {
  pgTable,
  varchar,
  timestamp,
  serial,
  index,
} from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";
import { users } from "./users";

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    passwordResetTokenId: serial("password_reset_token_id").primaryKey(),
    userId: varchar("user_id")
      .references(() => users.userId, { onDelete: "cascade" })
      .notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("password_reset_tokens_user_id_idx").on(table.userId),
    index("password_reset_tokens_token_hash_idx").on(table.tokenHash),
  ],
);

export type PasswordResetToken = InferSelectModel<typeof passwordResetTokens>;
