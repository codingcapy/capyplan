import {
  pgTable,
  varchar,
  timestamp,
  serial,
  index,
} from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";
import { users } from "./users";

export const plans = pgTable(
  "plans",
  {
    planId: serial("plan_id").primaryKey(),
    userId: varchar("user")
      .references(() => users.userId, { onDelete: "cascade" })
      .notNull(),
    title: varchar("title", { length: 80 }).notNull(),
    icon: varchar("icon"),
    currency: varchar("currency", { length: 10 }).default("$").notNull(),
    location: varchar("location", { length: 80 }).default("Canada").notNull(),
    yearOfBirth: varchar("year_of_birth", { length: 10 })
      .default("1990")
      .notNull(),
    status: varchar("status", { length: 50 }).default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("plans_user_id_idx").on(table.userId)],
);

export type Plan = InferSelectModel<typeof plans>;
