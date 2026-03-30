import {
  pgTable,
  varchar,
  timestamp,
  serial,
  integer,
  bigint,
} from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";
import { plans } from "./plans";

export const expenditures = pgTable("expenditures", {
  expenditureId: serial("expenditure_id").primaryKey(),
  planId: integer("plan_id")
    .references(() => plans.planId, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name").notNull().default(""),
  amount: bigint("amount", { mode: "number" }).notNull().default(0), // Stored as cents to avoid floating point issues
  status: varchar("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Expenditure = InferSelectModel<typeof expenditures>;
