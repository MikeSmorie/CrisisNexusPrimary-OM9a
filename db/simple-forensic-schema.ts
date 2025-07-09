import { pgTable, serial, varchar, text, jsonb, timestamp, boolean, integer } from "drizzle-orm/pg-core";

// Simple forensic logs table for testing
export const forensicLogs = pgTable("forensic_logs", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 36 }).notNull().unique(),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  userId: integer("user_id").notNull(),
  eventData: jsonb("event_data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  integrityVerified: boolean("integrity_verified").default(true),
  signature: varchar("signature", { length: 128 }).notNull(),
});

// Export types
export type ForensicLog = typeof forensicLogs.$inferSelect;
export type InsertForensicLog = typeof forensicLogs.$inferInsert;