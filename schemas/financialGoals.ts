import {
  pgTable,
  varchar,
  timestamp,
  serial,
  integer,
} from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";

export const financialGoals = pgTable("financial_goals", {
  financialGoalId: serial("financial_goal_id").primaryKey(),
  planId: integer("plan_id").notNull(),
  name: varchar("name").notNull().default(""),
  amount: integer("amount").notNull().default(0), // Stored as cents to avoid floating point issues
  targetDate: timestamp("target_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type FinancialGoal = InferSelectModel<typeof financialGoals>;
