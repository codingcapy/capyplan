import {
  pgTable,
  varchar,
  timestamp,
  serial,
  integer,
} from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";
import { plans } from "./plans";

export const incomes = pgTable("incomes", {
  incomeId: serial("income_id").primaryKey(),
  planId: integer("plan_id")
    .references(() => plans.planId, { onDelete: "cascade" })
    .notNull(),
  company: varchar("company").notNull().default(""),
  position: varchar("position").notNull().default(""),
  amount: integer("amount").notNull().default(0), // Stored as cents to avoid floating point issues
  tax: integer("tax").notNull().default(0),
  status: varchar("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Income = InferSelectModel<typeof incomes>;
