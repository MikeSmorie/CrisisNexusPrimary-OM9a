import { pgTable, text, serial, timestamp, integer, boolean, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { disasterUsers, disasterIncidents } from "./disaster-schema";

// Communication Channel Types
export const channelTypeEnum = z.enum(["satellite", "internet", "gsm", "mesh_helium", "offline_cache"]);
export type ChannelType = z.infer<typeof channelTypeEnum>;

export const channelStatusEnum = z.enum(["active", "degraded", "failed", "testing"]);
export type ChannelStatus = z.infer<typeof channelStatusEnum>;

export const messageFormatEnum = z.enum(["text", "audio", "video", "image", "emergency_broadcast"]);
export type MessageFormat = z.infer<typeof messageFormatEnum>;

export const failoverReasonEnum = z.enum(["timeout", "connection_lost", "bandwidth_insufficient", "channel_failed", "manual_switch"]);
export type FailoverReason = z.infer<typeof failoverReasonEnum>;

// Communication Channels Table
export const communicationChannels = pgTable("communication_channels", {
  id: serial("id").primaryKey(),
  channelType: text("channel_type").notNull(),
  channelName: text("channel_name").notNull(),
  status: text("status").notNull().default("active"),
  priority: integer("priority").notNull(), // 1 = highest priority (satellite), 5 = lowest (offline)
  latency: integer("latency").default(0), // in milliseconds
  bandwidth: integer("bandwidth").default(0), // in kbps
  reliability: decimal("reliability", { precision: 5, scale: 2 }).default("100.00"), // percentage
  lastHealthCheck: timestamp("last_health_check").defaultNow(),
  configuration: jsonb("configuration"), // Channel-specific settings
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Failover Logs Table
export const failoverLogs = pgTable("failover_logs", {
  id: serial("id").primaryKey(),
  fromChannel: integer("from_channel").references(() => communicationChannels.id),
  toChannel: integer("to_channel").references(() => communicationChannels.id),
  reason: text("reason").notNull(),
  triggeredBy: integer("triggered_by").references(() => disasterUsers.id),
  incidentId: integer("incident_id").references(() => disasterIncidents.id),
  latencyBefore: integer("latency_before"), // ms
  latencyAfter: integer("latency_after"), // ms
  messagesPending: integer("messages_pending").default(0),
  timestamp: timestamp("timestamp").defaultNow(),
  resolved: boolean("resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  metadata: jsonb("metadata") // Additional context
});

// Multi-Channel Messages Table
export const multiChannelMessages = pgTable("multi_channel_messages", {
  id: serial("id").primaryKey(),
  messageId: text("message_id").unique().notNull(), // UUID for tracking across channels
  fromUser: integer("from_user").references(() => disasterUsers.id),
  toUser: integer("to_user").references(() => disasterUsers.id),
  incidentId: integer("incident_id").references(() => disasterIncidents.id),
  content: text("content").notNull(),
  messageFormat: text("message_format").notNull().default("text"),
  priority: text("priority").notNull().default("normal"),
  primaryChannel: integer("primary_channel").references(() => communicationChannels.id),
  actualChannel: integer("actual_channel").references(() => communicationChannels.id),
  fallbackAttempts: integer("fallback_attempts").default(0),
  deliveryStatus: text("delivery_status").notNull().default("pending"), // pending, delivered, failed
  createdAt: timestamp("created_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),
  acknowledgedAt: timestamp("acknowledged_at"),
  voiceRecording: text("voice_recording"), // Base64 or file path
  offlineQueue: boolean("offline_queue").default(false),
  metadata: jsonb("metadata") // Bandwidth info, retry counts, etc.
});

// Voice to Text Cache Table
export const voiceTextCache = pgTable("voice_text_cache", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => disasterUsers.id),
  originalAudio: text("original_audio"), // Base64 encoded audio
  transcribedText: text("transcribed_text"),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  language: text("language").default("en"),
  timestamp: timestamp("timestamp").defaultNow(),
  processedAt: timestamp("processed_at"),
  sentAt: timestamp("sent_at"),
  incidentId: integer("incident_id").references(() => disasterIncidents.id),
  isOffline: boolean("is_offline").default(false),
  metadata: jsonb("metadata") // Device info, location, etc.
});

// Emergency Broadcast System
export const emergencyBroadcasts = pgTable("emergency_broadcasts", {
  id: serial("id").primaryKey(),
  broadcastId: text("broadcast_id").unique().notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  issuedBy: integer("issued_by").references(() => disasterUsers.id),
  targetZones: text("target_zones"), // JSON array of zones
  targetRoles: text("target_roles"), // JSON array of roles
  channels: text("channels"), // JSON array of channel IDs
  priority: text("priority").notNull().default("high"),
  messageFormat: text("message_format").notNull().default("text"),
  activeUntil: timestamp("active_until"),
  acknowledgedBy: text("acknowledged_by"), // JSON array of user IDs
  deliveryStats: jsonb("delivery_stats"), // Success/failure counts per channel
  createdAt: timestamp("created_at").defaultNow(),
  cancelledAt: timestamp("cancelled_at"),
  cancelledBy: integer("cancelled_by").references(() => disasterUsers.id)
});

// Relations
export const communicationChannelsRelations = relations(communicationChannels, ({ many }) => ({
  failoverLogsFrom: many(failoverLogs, { relationName: "fromChannel" }),
  failoverLogsTo: many(failoverLogs, { relationName: "toChannel" }),
  primaryMessages: many(multiChannelMessages, { relationName: "primaryChannel" }),
  actualMessages: many(multiChannelMessages, { relationName: "actualChannel" })
}));

export const failoverLogsRelations = relations(failoverLogs, ({ one }) => ({
  fromChannel: one(communicationChannels, {
    fields: [failoverLogs.fromChannel],
    references: [communicationChannels.id],
    relationName: "fromChannel"
  }),
  toChannel: one(communicationChannels, {
    fields: [failoverLogs.toChannel],
    references: [communicationChannels.id],
    relationName: "toChannel"
  }),
  triggeredBy: one(disasterUsers, {
    fields: [failoverLogs.triggeredBy],
    references: [disasterUsers.id]
  }),
  incident: one(disasterIncidents, {
    fields: [failoverLogs.incidentId],
    references: [disasterIncidents.id]
  })
}));

export const multiChannelMessagesRelations = relations(multiChannelMessages, ({ one }) => ({
  fromUser: one(disasterUsers, {
    fields: [multiChannelMessages.fromUser],
    references: [disasterUsers.id]
  }),
  toUser: one(disasterUsers, {
    fields: [multiChannelMessages.toUser],
    references: [disasterUsers.id]
  }),
  incident: one(disasterIncidents, {
    fields: [multiChannelMessages.incidentId],
    references: [disasterIncidents.id]
  }),
  primaryChannel: one(communicationChannels, {
    fields: [multiChannelMessages.primaryChannel],
    references: [communicationChannels.id],
    relationName: "primaryChannel"
  }),
  actualChannel: one(communicationChannels, {
    fields: [multiChannelMessages.actualChannel],
    references: [communicationChannels.id],
    relationName: "actualChannel"
  })
}));

export const voiceTextCacheRelations = relations(voiceTextCache, ({ one }) => ({
  user: one(disasterUsers, {
    fields: [voiceTextCache.userId],
    references: [disasterUsers.id]
  }),
  incident: one(disasterIncidents, {
    fields: [voiceTextCache.incidentId],
    references: [disasterIncidents.id]
  })
}));

export const emergencyBroadcastsRelations = relations(emergencyBroadcasts, ({ one }) => ({
  issuedBy: one(disasterUsers, {
    fields: [emergencyBroadcasts.issuedBy],
    references: [disasterUsers.id]
  }),
  cancelledBy: one(disasterUsers, {
    fields: [emergencyBroadcasts.cancelledBy],
    references: [disasterUsers.id]
  })
}));

// Zod schemas for validation
export const insertCommunicationChannelSchema = createInsertSchema(communicationChannels);
export const selectCommunicationChannelSchema = createSelectSchema(communicationChannels);

export const insertFailoverLogSchema = createInsertSchema(failoverLogs);
export const selectFailoverLogSchema = createSelectSchema(failoverLogs);

export const insertMultiChannelMessageSchema = createInsertSchema(multiChannelMessages);
export const selectMultiChannelMessageSchema = createSelectSchema(multiChannelMessages);

export const insertVoiceTextCacheSchema = createInsertSchema(voiceTextCache);
export const selectVoiceTextCacheSchema = createSelectSchema(voiceTextCache);

export const insertEmergencyBroadcastSchema = createInsertSchema(emergencyBroadcasts);
export const selectEmergencyBroadcastSchema = createSelectSchema(emergencyBroadcasts);

// Type exports
export type InsertCommunicationChannel = typeof communicationChannels.$inferInsert;
export type SelectCommunicationChannel = typeof communicationChannels.$inferSelect;
export type InsertFailoverLog = typeof failoverLogs.$inferInsert;
export type SelectFailoverLog = typeof failoverLogs.$inferSelect;
export type InsertMultiChannelMessage = typeof multiChannelMessages.$inferInsert;
export type SelectMultiChannelMessage = typeof multiChannelMessages.$inferSelect;
export type InsertVoiceTextCache = typeof voiceTextCache.$inferInsert;
export type SelectVoiceTextCache = typeof voiceTextCache.$inferSelect;
export type InsertEmergencyBroadcast = typeof emergencyBroadcasts.$inferInsert;
export type SelectEmergencyBroadcast = typeof emergencyBroadcasts.$inferSelect;