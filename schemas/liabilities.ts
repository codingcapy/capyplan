import {
  pgTable,
  varchar,
  timestamp,
  serial,
  integer,
  bigint,
  index,
} from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";
import { plans } from "./plans";

export const liabilities = pgTable(
  "liabilities",
  {
    liabilityId: serial("liability_id").primaryKey(),
    planId: integer("plan_id")
      .references(() => plans.planId, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 255 }).notNull().default(""),
    amount: bigint("amount", { mode: "number" }).notNull().default(0), // Stored as cents to avoid floating point issues
    interest: integer("interest").notNull().default(0),
    status: varchar("status", { length: 50 }).default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("liabilities_plan_id_idx").on(table.planId)],
);

export type Liability = InferSelectModel<typeof liabilities>;
