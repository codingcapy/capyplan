import {
  pgTable,
  varchar,
  timestamp,
  serial,
  integer,
} from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";
import { plans } from "./plans";

export const generations = pgTable("generations", {
  generationId: serial("generation_id").primaryKey(),
  planId: integer("plan_id")
    .references(() => plans.planId, { onDelete: "cascade" })
    .notNull(),
  content: varchar("content").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Generation = InferSelectModel<typeof generations>;
