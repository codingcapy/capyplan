import {
  pgTable,
  varchar,
  timestamp,
  serial,
  integer,
} from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";

export const expenditures = pgTable("expenditures", {
  expenditureId: serial("expenditure_id").primaryKey(),
  planId: integer("plan_id").notNull(),
  name: varchar("name").notNull().default(""),
  amount: integer("amount").notNull().default(0), // Stored as cents to avoid floating point issues
  status: varchar("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Expenditure = InferSelectModel<typeof expenditures>;
