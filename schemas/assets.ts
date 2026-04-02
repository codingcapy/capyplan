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

export const assets = pgTable("assets", {
  assetId: serial("asset_id").primaryKey(),
  planId: integer("plan_id")
    .references(() => plans.planId, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull().default(""),
  value: bigint("value", { mode: "number" }).notNull().default(0), // Stored as cents to avoid floating point issues
  roi: integer("roi").notNull().default(0),
  status: varchar("status", { length: 50 }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Asset = InferSelectModel<typeof assets>;
