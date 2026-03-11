import {
  pgTable,
  varchar,
  timestamp,
  serial,
  integer,
} from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";

export const assets = pgTable("assets", {
  assetId: serial("asset_id").primaryKey(),
  planId: integer("plan_id").notNull(),
  name: varchar("name").notNull().default(""),
  value: integer("value").notNull().default(0), // Stored as cents to avoid floating point issues
  roi: integer("roi").notNull().default(0),
  status: varchar("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Asset = InferSelectModel<typeof assets>;
