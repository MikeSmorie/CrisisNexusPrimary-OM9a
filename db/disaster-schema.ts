import { pgTable, text, varchar, serial, timestamp, integer, boolean, decimal, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

// DisasterMng-1-OM9 Specific Enums
export const disasterUserRoleEnum = z.enum(["responder", "commander", "admin", "coordinator"]);
export type DisasterUserRole = z.infer<typeof disasterUserRoleEnum>;

export const incidentTypeEnum = z.enum(["fire", "flood", "earthquake", "medical", "hazmat", "tornado", "hurricane", "terrorism", "accident", "search_rescue"]);
export type IncidentType = z.infer<typeof incidentTypeEnum>;

export const severityEnum = z.enum(["minor", "major", "critical", "catastrophic"]);
export type Severity = z.infer<typeof severityEnum>;

export const incidentStatusEnum = z.enum(["active", "contained", "resolved", "investigating"]);
export type IncidentStatus = z.infer<typeof incidentStatusEnum>;

export const resourceTypeEnum = z.enum(["personnel", "vehicle", "equipment", "supplies", "medical"]);
export type ResourceType = z.infer<typeof resourceTypeEnum>;

export const resourceStatusEnum = z.enum(["available", "deployed", "maintenance", "out_of_service"]);
export type ResourceStatus = z.infer<typeof resourceStatusEnum>;

export const alertTypeEnum = z.enum(["weather", "evacuation", "all_clear", "public_warning", "internal"]);
export type AlertType = z.infer<typeof alertTypeEnum>;

export const alertSeverityEnum = z.enum(["watch", "warning", "emergency"]);
export type AlertSeverity = z.infer<typeof alertSeverityEnum>;

export const messageTypeEnum = z.enum(["radio", "urgent", "status_update", "resource_request", "report"]);
export type MessageType = z.infer<typeof messageTypeEnum>;

export const priorityEnum = z.enum(["low", "normal", "high", "critical"]);
export type Priority = z.infer<typeof priorityEnum>;

// DisasterMng-1-OM9 Core Tables
export const disasterUsers = pgTable("disaster_users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("responder"),
  email: text("email").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
  subscriptionPlan: text("subscription_plan").default("emergency"),
  department: text("department"), // Fire, Police, Medical, Emergency Management
  certificationLevel: text("certification_level"), // Basic, Advanced, Expert
  locationZone: text("location_zone"), // Geographic assignment
  emergencyContact: text("emergency_contact"),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(true),
  status: text("status").default("active"),
  notes: text("notes"),
  isTestAccount: boolean("is_test_account").default(false),
  tokens: integer("tokens").notNull().default(0),
  isVerified: boolean("is_verified").notNull().default(false),
  verificationToken: text("verification_token"),
  tokenVersion: integer("token_version").notNull().default(0)
});

export const disasterIncidents = pgTable("disaster_incidents", {
  id: serial("id").primaryKey(),
  incidentCode: text("incident_code").unique().notNull(),
  type: text("type").notNull(),
  severity: text("severity").notNull(),
  status: text("status").notNull().default("active"),
  location: text("location").notNull(),
  coordinates: text("coordinates"), // GPS coordinates
  description: text("description").notNull(),
  reportedBy: integer("reported_by").references(() => disasterUsers.id),
  assignedCommander: integer("assigned_commander").references(() => disasterUsers.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  estimatedResolution: timestamp("estimated_resolution"),
  actualResolution: timestamp("actual_resolution"),
  resourcesNeeded: text("resources_needed"),
  casualtiesCount: integer("casualties_count").default(0),
  evacuationsCount: integer("evacuations_count").default(0)
});

export const disasterResources = pgTable("disaster_resources", {
  id: serial("id").primaryKey(),
  resourceType: text("resource_type").notNull(),
  name: text("name").notNull(),
  identifier: text("identifier").unique().notNull(),
  status: text("status").notNull().default("available"),
  location: text("location"),
  assignedIncident: integer("assigned_incident").references(() => disasterIncidents.id),
  operatorId: integer("operator_id").references(() => disasterUsers.id),
  capabilities: text("capabilities"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const disasterAlerts = pgTable("disaster_alerts", {
  id: serial("id").primaryKey(),
  alertType: text("alert_type").notNull(),
  severity: text("severity").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  issuedBy: integer("issued_by").references(() => disasterUsers.id),
  targetZones: text("target_zones"),
  activeUntil: timestamp("active_until"),
  createdAt: timestamp("created_at").defaultNow(),
  acknowledgedBy: text("acknowledged_by"), // JSON array of user IDs
  broadcastChannels: text("broadcast_channels")
});

export const disasterActivityLogs = pgTable("disaster_activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => disasterUsers.id),
  incidentId: integer("incident_id").references(() => disasterIncidents.id),
  action: text("action").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  details: text("details"),
  location: text("location"),
  resourceInvolved: integer("resource_involved").references(() => disasterResources.id)
});

export const disasterErrorLogs = pgTable("disaster_error_logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  level: text("level").notNull(),
  message: text("message").notNull(),
  source: text("source").notNull(),
  stackTrace: text("stack_trace"),
  resolved: boolean("resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by").references(() => disasterUsers.id),
  incidentRelated: integer("incident_related").references(() => disasterIncidents.id)
});

export const disasterCommunications = pgTable("disaster_communications", {
  id: serial("id").primaryKey(),
  fromUser: integer("from_user").references(() => disasterUsers.id),
  toUser: integer("to_user").references(() => disasterUsers.id),
  incidentId: integer("incident_id").references(() => disasterIncidents.id),
  messageType: text("message_type").notNull(),
  content: text("content").notNull(),
  priority: text("priority").notNull().default("normal"),
  createdAt: timestamp("created_at").defaultNow(),
  acknowledgedAt: timestamp("acknowledged_at"),
  channel: text("channel")
});

// Relations
export const disasterUsersRelations = relations(disasterUsers, ({ many }) => ({
  activityLogs: many(disasterActivityLogs),
  reportedIncidents: many(disasterIncidents, { relationName: "reporter" }),
  commandedIncidents: many(disasterIncidents, { relationName: "commander" }),
  operatedResources: many(disasterResources),
  issuedAlerts: many(disasterAlerts),
  sentMessages: many(disasterCommunications, { relationName: "sender" }),
  receivedMessages: many(disasterCommunications, { relationName: "receiver" }),
  resolvedErrors: many(disasterErrorLogs)
}));

export const disasterIncidentsRelations = relations(disasterIncidents, ({ one, many }) => ({
  reporter: one(disasterUsers, {
    fields: [disasterIncidents.reportedBy],
    references: [disasterUsers.id],
    relationName: "reporter"
  }),
  commander: one(disasterUsers, {
    fields: [disasterIncidents.assignedCommander],
    references: [disasterUsers.id],
    relationName: "commander"
  }),
  resources: many(disasterResources),
  activityLogs: many(disasterActivityLogs),
  communications: many(disasterCommunications),
  errorLogs: many(disasterErrorLogs)
}));

export const disasterResourcesRelations = relations(disasterResources, ({ one, many }) => ({
  incident: one(disasterIncidents, {
    fields: [disasterResources.assignedIncident],
    references: [disasterIncidents.id]
  }),
  operator: one(disasterUsers, {
    fields: [disasterResources.operatorId],
    references: [disasterUsers.id]
  }),
  activityLogs: many(disasterActivityLogs)
}));

export const disasterAlertsRelations = relations(disasterAlerts, ({ one }) => ({
  issuer: one(disasterUsers, {
    fields: [disasterAlerts.issuedBy],
    references: [disasterUsers.id]
  })
}));

export const disasterActivityLogsRelations = relations(disasterActivityLogs, ({ one }) => ({
  user: one(disasterUsers, {
    fields: [disasterActivityLogs.userId],
    references: [disasterUsers.id]
  }),
  incident: one(disasterIncidents, {
    fields: [disasterActivityLogs.incidentId],
    references: [disasterIncidents.id]
  }),
  resource: one(disasterResources, {
    fields: [disasterActivityLogs.resourceInvolved],
    references: [disasterResources.id]
  })
}));

export const disasterErrorLogsRelations = relations(disasterErrorLogs, ({ one }) => ({
  resolvedByUser: one(disasterUsers, {
    fields: [disasterErrorLogs.resolvedBy],
    references: [disasterUsers.id]
  }),
  incident: one(disasterIncidents, {
    fields: [disasterErrorLogs.incidentRelated],
    references: [disasterIncidents.id]
  })
}));

export const disasterCommunicationsRelations = relations(disasterCommunications, ({ one }) => ({
  sender: one(disasterUsers, {
    fields: [disasterCommunications.fromUser],
    references: [disasterUsers.id],
    relationName: "sender"
  }),
  receiver: one(disasterUsers, {
    fields: [disasterCommunications.toUser],
    references: [disasterUsers.id],
    relationName: "receiver"
  }),
  incident: one(disasterIncidents, {
    fields: [disasterCommunications.incidentId],
    references: [disasterIncidents.id]
  })
}));

// Schemas for validation
export const insertDisasterUserSchema = createInsertSchema(disasterUsers, {
  role: disasterUserRoleEnum.default("responder"),
  email: z.string().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  lastLogin: z.date().optional()
});

export const selectDisasterUserSchema = createSelectSchema(disasterUsers);

export const insertDisasterIncidentSchema = createInsertSchema(disasterIncidents);
export const selectDisasterIncidentSchema = createSelectSchema(disasterIncidents);

export const insertDisasterResourceSchema = createInsertSchema(disasterResources);
export const selectDisasterResourceSchema = createSelectSchema(disasterResources);

export const insertDisasterAlertSchema = createInsertSchema(disasterAlerts);
export const selectDisasterAlertSchema = createSelectSchema(disasterAlerts);

export const insertDisasterActivityLogSchema = createInsertSchema(disasterActivityLogs);
export const selectDisasterActivityLogSchema = createSelectSchema(disasterActivityLogs);

export const insertDisasterErrorLogSchema = createInsertSchema(disasterErrorLogs);
export const selectDisasterErrorLogSchema = createSelectSchema(disasterErrorLogs);

export const insertDisasterCommunicationSchema = createInsertSchema(disasterCommunications);
export const selectDisasterCommunicationSchema = createSelectSchema(disasterCommunications);

// Types
export type InsertDisasterUser = typeof disasterUsers.$inferInsert;
export type SelectDisasterUser = typeof disasterUsers.$inferSelect;
export type InsertDisasterIncident = typeof disasterIncidents.$inferInsert;
export type SelectDisasterIncident = typeof disasterIncidents.$inferSelect;
export type InsertDisasterResource = typeof disasterResources.$inferInsert;
export type SelectDisasterResource = typeof disasterResources.$inferSelect;
export type InsertDisasterAlert = typeof disasterAlerts.$inferInsert;
export type SelectDisasterAlert = typeof disasterAlerts.$inferSelect;
export type InsertDisasterActivityLog = typeof disasterActivityLogs.$inferInsert;
export type SelectDisasterActivityLog = typeof disasterActivityLogs.$inferSelect;
export type InsertDisasterErrorLog = typeof disasterErrorLogs.$inferInsert;
export type SelectDisasterErrorLog = typeof disasterErrorLogs.$inferSelect;
export type InsertDisasterCommunication = typeof disasterCommunications.$inferInsert;
export type SelectDisasterCommunication = typeof disasterCommunications.$inferSelect;