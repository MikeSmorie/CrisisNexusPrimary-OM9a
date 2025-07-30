import { pgTable, text, integer, timestamp, boolean, jsonb, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Original Omega-V9 Users Schema (restored for compatibility)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  email: text("email"),
  role: text("role").default("user"),
  created_at: timestamp("created_at").defaultNow(),
  last_login: timestamp("last_login"),
  verification_token: text("verification_token"),
  is_verified: boolean("is_verified").default(false),
  two_factor_enabled: boolean("two_factor_enabled").default(false),
  two_factor_secret: text("two_factor_secret"),
  subscription_plan: text("subscription_plan").default("free"),
  wallet_address: text("wallet_address"),
  referral_code: text("referral_code"),
  referred_by: text("referred_by"),
  status: text("status").default("active"),
  notes: text("notes"),
  skip_email_verification: boolean("skip_email_verification").default(false),
  token_version: integer("token_version").default(0),
  token_balance: integer("token_balance").default(0),
  total_tokens_used: integer("total_tokens_used").default(0),
  trial_active: boolean("trial_active").default(false),
  trial_start_date: timestamp("trial_start_date"),
  trial_expires_at: timestamp("trial_expires_at"),
  trial_ends_at: timestamp("trial_ends_at"),
  bonus_trial_claimed: boolean("bonus_trial_claimed").default(false),
  is_test_account: boolean("is_test_account").default(false),
  achievements: jsonb("achievements").default([]),
  certification_level: text("certification_level").default("UNCLASSIFIED")
});

export type SelectUser = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Emergency management tables (keep existing disaster schema)
export * from "./disaster-schema";
export * from "./communication-schema";
export * from "./clearance-schema";
export * from "./forensic-schema";