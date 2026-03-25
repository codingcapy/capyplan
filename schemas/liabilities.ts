import {
  pgTable,
  varchar,
  timestamp,
  serial,
  integer,
} from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";
import { plans } from "./plans";

export const liabilities = pgTable("liabilities", {
  liabilityId: serial("liability_id").primaryKey(),
  planId: integer("plan_id")
    .references(() => plans.planId, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name").notNull().default(""),
  amount: integer("amount").notNull().default(0), // Stored as cents to avoid floating point issues
  interest: integer("interest").notNull().default(0),
  status: varchar("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Liability = InferSelectModel<typeof liabilities>;
