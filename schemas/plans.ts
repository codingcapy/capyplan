import { pgTable, varchar, timestamp, serial } from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";
import { users } from "./users";

export const plans = pgTable("plans", {
  planId: serial("plan_id").primaryKey(),
  userId: varchar("user")
    .references(() => users.userId, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title").notNull(),
  icon: varchar("icon"),
  status: varchar("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Plan = InferSelectModel<typeof plans>;
