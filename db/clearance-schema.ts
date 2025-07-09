import { pgTable, serial, varchar, text, jsonb, timestamp, boolean, integer, inet } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Clearance levels enum
export const clearanceLevelEnum = z.enum([
  "unclassified",
  "restricted", 
  "secret",
  "top_secret",
  "forensic_only"
]);

export type ClearanceLevel = z.infer<typeof clearanceLevelEnum>;

// Classification tags table
export const disasterClearanceTags = pgTable("disaster_clearance_tags", {
  id: serial("id").primaryKey(),
  tagName: varchar("tag_name", { length: 20 }).notNull().unique(),
  clearanceLevel: integer("clearance_level").notNull(),
  description: text("description"),
  colorCode: varchar("color_code", { length: 7 }), // Hex color for UI
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User access control matrix
export const disasterAccessControl = pgTable("disaster_access_control", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => require("./disaster-schema").disasterUsers.id).notNull(),
  clearanceLevel: integer("clearance_level").notNull(),
  compartments: jsonb("compartments").default([]), // Geographic/functional compartments
  grantedBy: integer("granted_by").references(() => require("./disaster-schema").disasterUsers.id),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  active: boolean("active").default(true),
  justification: text("justification"),
  
  // Override permissions for emergencies
  temporaryAccess: boolean("temporary_access").default(false),
  overrideReason: text("override_reason"),
  overrideGrantedBy: integer("override_granted_by").references(() => require("./disaster-schema").disasterUsers.id),
});

// Compartment definitions
export const disasterCompartments = pgTable("disaster_compartments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  compartmentType: varchar("compartment_type", { length: 20 }).notNull(), // geographic, functional, temporal
  parentCompartment: integer("parent_compartment").references(() => disasterCompartments.id),
  requiredClearance: integer("required_clearance").notNull(),
  autoExpiry: boolean("auto_expiry").default(false),
  expiryDays: integer("expiry_days"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Clearance audit trail
export const disasterClearanceAudit = pgTable("disaster_clearance_audit", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => require("./disaster-schema").disasterUsers.id).notNull(),
  action: varchar("action", { length: 50 }).notNull(), // view, edit, delete, export
  resourceType: varchar("resource_type", { length: 50 }).notNull(), // incident, resource, communication
  resourceId: varchar("resource_id", { length: 100 }).notNull(),
  classificationAccessed: integer("classification_accessed").notNull(),
  userClearanceLevel: integer("user_clearance_level").notNull(),
  compartmentAccessed: varchar("compartment_accessed", { length: 50 }),
  accessGranted: boolean("access_granted").notNull(),
  reason: text("reason"),
  
  // Technical details
  ipAddress: varchar("ip_address", { length: 45 }), // IPv6 compatible
  userAgent: text("user_agent"),
  sessionId: varchar("session_id", { length: 64 }),
  
  // Risk assessment
  riskScore: integer("risk_score").default(0), // 0-100
  anomalyFlags: jsonb("anomaly_flags").default([]),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Security incidents/violations
export const disasterSecurityIncidents = pgTable("disaster_security_incidents", {
  id: serial("id").primaryKey(),
  incidentType: varchar("incident_type", { length: 50 }).notNull(), // unauthorized_access, clearance_violation, data_breach
  severity: varchar("severity", { length: 20 }).notNull(), // low, medium, high, critical
  userId: integer("user_id").references(() => require("./disaster-schema").disasterUsers.id),
  description: text("description").notNull(),
  
  // Incident details
  affectedResources: jsonb("affected_resources").default([]),
  classificationLevel: integer("classification_level"),
  compartmentsInvolved: jsonb("compartments_involved").default([]),
  
  // Investigation
  investigatedBy: integer("investigated_by").references(() => require("./disaster-schema").disasterUsers.id),
  investigationStatus: varchar("investigation_status", { length: 20 }).default("open"), // open, in_progress, closed
  resolution: text("resolution"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  
  // Compliance
  reportedToAuthorities: boolean("reported_to_authorities").default(false),
  regulatoryNotification: jsonb("regulatory_notification").default({}),
});

// Data redaction rules
export const disasterRedactionRules = pgTable("disaster_redaction_rules", {
  id: serial("id").primaryKey(),
  ruleName: varchar("rule_name", { length: 50 }).notNull().unique(),
  targetField: varchar("target_field", { length: 50 }).notNull(),
  classificationThreshold: integer("classification_threshold").notNull(),
  redactionPattern: text("redaction_pattern").notNull(), // Regex pattern
  replacementText: text("replacement_text").notNull(),
  ruleType: varchar("rule_type", { length: 20 }).notNull(), // regex, function, blacklist
  active: boolean("active").default(true),
  priority: integer("priority").default(0), // Higher priority rules applied first
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AI clearance configurations
export const disasterAiClearance = pgTable("disaster_ai_clearance", {
  id: serial("id").primaryKey(),
  aiModelName: varchar("ai_model_name", { length: 50 }).notNull(),
  maxClearanceLevel: integer("max_clearance_level").notNull(),
  allowedCompartments: jsonb("allowed_compartments").default([]),
  redactionRules: jsonb("redaction_rules").default([]),
  outputSanitization: boolean("output_sanitization").default(true),
  trainingDataAccess: boolean("training_data_access").default(false),
  active: boolean("active").default(true),
  configuredBy: integer("configured_by").references(() => require("./disaster-schema").disasterUsers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Emergency clearance overrides
export const disasterEmergencyOverrides = pgTable("disaster_emergency_overrides", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => require("./disaster-schema").disasterUsers.id).notNull(),
  originalClearance: integer("original_clearance").notNull(),
  overrideClearance: integer("override_clearance").notNull(),
  overrideReason: text("override_reason").notNull(),
  incidentId: integer("incident_id").references(() => require("./disaster-schema").disasterIncidents.id),
  
  // Authorization
  authorizedBy: integer("authorized_by").references(() => require("./disaster-schema").disasterUsers.id).notNull(),
  authorizationCode: varchar("authorization_code", { length: 20 }),
  
  // Time limits
  validFrom: timestamp("valid_from").defaultNow().notNull(),
  validUntil: timestamp("valid_until").notNull(),
  autoRevoke: boolean("auto_revoke").default(true),
  
  // Status
  status: varchar("status", { length: 20 }).default("active"), // active, expired, revoked
  revokedBy: integer("revoked_by").references(() => require("./disaster-schema").disasterUsers.id),
  revokedAt: timestamp("revoked_at"),
  revokeReason: text("revoke_reason"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas for validation
export const insertClearanceTagSchema = createInsertSchema(disasterClearanceTags, {
  tagName: z.string().min(1).max(20),
  clearanceLevel: z.number().min(1).max(5),
  colorCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional()
});

export const selectClearanceTagSchema = createSelectSchema(disasterClearanceTags);

export const insertAccessControlSchema = createInsertSchema(disasterAccessControl, {
  clearanceLevel: z.number().min(1).max(5),
  compartments: z.array(z.string()).default([]),
  justification: z.string().min(10).optional()
});

export const selectAccessControlSchema = createSelectSchema(disasterAccessControl);

export const insertCompartmentSchema = createInsertSchema(disasterCompartments, {
  name: z.string().min(1).max(50),
  compartmentType: z.enum(["geographic", "functional", "temporal"]),
  requiredClearance: z.number().min(1).max(5)
});

export const selectCompartmentSchema = createSelectSchema(disasterCompartments);

export const insertClearanceAuditSchema = createInsertSchema(disasterClearanceAudit, {
  action: z.enum(["view", "edit", "delete", "export", "search", "download"]),
  resourceType: z.enum(["incident", "resource", "communication", "alert", "user", "report"]),
  accessGranted: z.boolean(),
  riskScore: z.number().min(0).max(100).default(0)
});

export const selectClearanceAuditSchema = createSelectSchema(disasterClearanceAudit);

export const insertSecurityIncidentSchema = createInsertSchema(disasterSecurityIncidents, {
  incidentType: z.enum(["unauthorized_access", "clearance_violation", "data_breach", "system_compromise", "policy_violation"]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  description: z.string().min(10)
});

export const selectSecurityIncidentSchema = createSelectSchema(disasterSecurityIncidents);

export const insertRedactionRuleSchema = createInsertSchema(disasterRedactionRules, {
  ruleName: z.string().min(1).max(50),
  targetField: z.string().min(1).max(50),
  classificationThreshold: z.number().min(1).max(5),
  redactionPattern: z.string().min(1),
  replacementText: z.string().min(1),
  ruleType: z.enum(["regex", "function", "blacklist", "whitelist"])
});

export const selectRedactionRuleSchema = createSelectSchema(disasterRedactionRules);

export const insertEmergencyOverrideSchema = createInsertSchema(disasterEmergencyOverrides, {
  originalClearance: z.number().min(1).max(5),
  overrideClearance: z.number().min(1).max(5),
  overrideReason: z.string().min(10),
  validUntil: z.date().refine(date => date > new Date(), "Valid until must be in the future")
});

export const selectEmergencyOverrideSchema = createSelectSchema(disasterEmergencyOverrides);

// Type exports
export type InsertClearanceTag = typeof disasterClearanceTags.$inferInsert;
export type SelectClearanceTag = typeof disasterClearanceTags.$inferSelect;
export type InsertAccessControl = typeof disasterAccessControl.$inferInsert;
export type SelectAccessControl = typeof disasterAccessControl.$inferSelect;
export type InsertCompartment = typeof disasterCompartments.$inferInsert;
export type SelectCompartment = typeof disasterCompartments.$inferSelect;
export type InsertClearanceAudit = typeof disasterClearanceAudit.$inferInsert;
export type SelectClearanceAudit = typeof disasterClearanceAudit.$inferSelect;
export type InsertSecurityIncident = typeof disasterSecurityIncidents.$inferInsert;
export type SelectSecurityIncident = typeof disasterSecurityIncidents.$inferSelect;
export type InsertRedactionRule = typeof disasterRedactionRules.$inferInsert;
export type SelectRedactionRule = typeof disasterRedactionRules.$inferSelect;
export type InsertEmergencyOverride = typeof disasterEmergencyOverrides.$inferInsert;
export type SelectEmergencyOverride = typeof disasterEmergencyOverrides.$inferSelect;