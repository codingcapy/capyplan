import {
  pgTable,
  varchar,
  timestamp,
  serial,
  integer,
  index,
} from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";
import { plans } from "./plans";

export const generations = pgTable(
  "generations",
  {
    generationId: serial("generation_id").primaryKey(),
    planId: integer("plan_id")
      .references(() => plans.planId, { onDelete: "cascade" })
      .notNull(),
    content: varchar("content").notNull().default(""),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("generations_plan_id_idx").on(table.planId)],
);

export type Generation = InferSelectModel<typeof generations>;
