import { pgTable, serial, varchar, text, jsonb, timestamp, boolean, integer, bytea, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Forensic event types
export const forensicEventTypeEnum = z.enum([
  "incident_created",
  "decision_approved", 
  "resource_allocated",
  "resolution_submitted",
  "system_alert",
  "user_action",
  "ai_classification",
  "communication_sent",
  "authentication_attempt",
  "data_access",
  "system_configuration",
  "backup_created"
]);

export type ForensicEventType = z.infer<typeof forensicEventTypeEnum>;

// Main forensic logs table
export const disasterForensicLogs = pgTable("disaster_forensic_logs", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 36 }).notNull().unique(), // UUID
  eventType: varchar("event_type", { length: 50 }).notNull(),
  userId: integer("user_id").references(() => require("./disaster-schema").disasterUsers.id),
  userRoleHash: varchar("user_role_hash", { length: 64 }).notNull(),
  eventData: jsonb("event_data").notNull(),
  locationHash: varchar("location_hash", { length: 64 }),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  // Blockchain integration
  blockchainHash: varchar("blockchain_hash", { length: 66 }), // 0x + 64 hex chars
  blockchainConfirmed: boolean("blockchain_confirmed").default(false),
  blockNumber: bigint("block_number", { mode: "number" }),
  transactionHash: varchar("transaction_hash", { length: 66 }),
  
  // IPFS integration
  ipfsHash: varchar("ipfs_hash", { length: 64 }),
  
  // Cryptographic integrity
  signature: varchar("signature", { length: 128 }).notNull(),
  
  // Encryption fields
  encryptedPayload: bytea("encrypted_payload"),
  keyVersion: integer("key_version").default(1),
  
  // Audit fields
  accessLog: jsonb("access_log").default([]),
  integrityVerified: boolean("integrity_verified").default(true),
  lastVerified: timestamp("last_verified").defaultNow(),
  
  // Batch processing
  batchId: varchar("batch_id", { length: 66 }),
  batchSequence: integer("batch_sequence")
});

// Blockchain batch operations tracking
export const disasterBlockchainBatches = pgTable("disaster_blockchain_batches", {
  id: serial("id").primaryKey(),
  batchId: varchar("batch_id", { length: 66 }).notNull().unique(),
  merkleRoot: varchar("merkle_root", { length: 66 }).notNull(),
  transactionHash: varchar("transaction_hash", { length: 66 }),
  blockNumber: bigint("block_number", { mode: "number" }),
  logCount: integer("log_count").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at"),
  gasUsed: bigint("gas_used", { mode: "number" }),
  status: varchar("status", { length: 20 }).default("pending"), // pending, confirmed, failed
  
  // Cost tracking
  gasPriceWei: bigint("gas_price_wei", { mode: "number" }),
  totalCostWei: bigint("total_cost_wei", { mode: "number" }),
  
  // Retry mechanism
  retryCount: integer("retry_count").default(0),
  lastRetryAt: timestamp("last_retry_at"),
  errorMessage: text("error_message")
});

// IPFS content tracking
export const disasterIpfsContents = pgTable("disaster_ipfs_contents", {
  id: serial("id").primaryKey(),
  ipfsHash: varchar("ipfs_hash", { length: 64 }).notNull().unique(),
  contentType: varchar("content_type", { length: 100 }).notNull(),
  originalFilename: varchar("original_filename", { length: 255 }),
  fileSize: bigint("file_size", { mode: "number" }),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  uploadedBy: integer("uploaded_by").references(() => require("./disaster-schema").disasterUsers.id),
  
  // Content fingerprinting
  sha256Hash: varchar("sha256_hash", { length: 64 }).notNull(),
  md5Hash: varchar("md5_hash", { length: 32 }).notNull(),
  
  // Media-specific metadata
  mediaMetadata: jsonb("media_metadata").default({}), // For image/video/audio files
  
  // Access control
  accessLevel: varchar("access_level", { length: 20 }).default("restricted"), // public, restricted, confidential
  encryptionEnabled: boolean("encryption_enabled").default(false),
  
  // Backup and redundancy
  pinned: boolean("pinned").default(true),
  replicationStatus: varchar("replication_status", { length: 20 }).default("active") // active, archived, deleted
});

// Forensic access logs for audit trail
export const disasterForensicAccessLogs = pgTable("disaster_forensic_access_logs", {
  id: serial("id").primaryKey(),
  forensicLogId: integer("forensic_log_id").references(() => disasterForensicLogs.id).notNull(),
  accessedBy: integer("accessed_by").references(() => require("./disaster-schema").disasterUsers.id).notNull(),
  accessType: varchar("access_type", { length: 20 }).notNull(), // view, download, verify, export
  accessedAt: timestamp("accessed_at").defaultNow().notNull(),
  
  // Access context
  ipAddress: varchar("ip_address", { length: 45 }), // IPv6 compatible
  userAgent: text("user_agent"),
  sessionId: varchar("session_id", { length: 64 }),
  
  // Geographic context
  geoLocation: jsonb("geo_location").default({}),
  timezone: varchar("timezone", { length: 50 }),
  
  // Access details
  dataFieldsAccessed: jsonb("data_fields_accessed").default([]),
  exportFormat: varchar("export_format", { length: 20 }), // json, pdf, csv, etc.
  success: boolean("success").default(true),
  errorMessage: text("error_message"),
  
  // Compliance
  justification: text("justification"),
  authorizedBy: integer("authorized_by").references(() => require("./disaster-schema").disasterUsers.id),
  complianceFlags: jsonb("compliance_flags").default({})
});

// Encryption key management
export const disasterEncryptionKeys = pgTable("disaster_encryption_keys", {
  id: serial("id").primaryKey(),
  keyVersion: integer("key_version").notNull().unique(),
  keyFingerprint: varchar("key_fingerprint", { length: 64 }).notNull(),
  algorithm: varchar("algorithm", { length: 20 }).default("AES-256-GCM"),
  
  // Key lifecycle
  createdAt: timestamp("created_at").defaultNow().notNull(),
  activatedAt: timestamp("activated_at"),
  deprecatedAt: timestamp("deprecated_at"),
  
  // Key derivation info
  derivationMethod: varchar("derivation_method", { length: 50 }).default("PBKDF2"),
  saltHash: varchar("salt_hash", { length: 64 }),
  iterations: integer("iterations").default(100000),
  
  // Access control
  authorizedRoles: jsonb("authorized_roles").default([]),
  usageCount: integer("usage_count").default(0),
  maxUsage: integer("max_usage"), // Optional usage limit
  
  // Compliance
  complianceStandard: varchar("compliance_standard", { length: 50 }), // FIPS-140, Common Criteria, etc.
  auditTrail: jsonb("audit_trail").default([])
});

// Integrity verification results
export const disasterIntegrityVerifications = pgTable("disaster_integrity_verifications", {
  id: serial("id").primaryKey(),
  forensicLogId: integer("forensic_log_id").references(() => disasterForensicLogs.id).notNull(),
  verificationType: varchar("verification_type", { length: 30 }).notNull(), // hash, signature, blockchain, merkle
  verificationResult: boolean("verification_result").notNull(),
  verifiedAt: timestamp("verified_at").defaultNow().notNull(),
  verifiedBy: integer("verified_by").references(() => require("./disaster-schema").disasterUsers.id),
  
  // Verification details
  expectedValue: text("expected_value"),
  actualValue: text("actual_value"),
  algorithmUsed: varchar("algorithm_used", { length: 50 }),
  
  // Blockchain verification
  blockchainNetwork: varchar("blockchain_network", { length: 20 }), // polygon, ethereum, etc.
  contractAddress: varchar("contract_address", { length: 42 }),
  
  // Error details
  errorDetails: jsonb("error_details").default({}),
  
  // Performance metrics
  verificationDuration: integer("verification_duration"), // milliseconds
  
  // Chain of trust
  previousVerificationId: integer("previous_verification_id").references(() => disasterIntegrityVerifications.id),
  trustScore: integer("trust_score").default(100) // 0-100
});

// Zod schemas for validation
export const insertForensicLogSchema = createInsertSchema(disasterForensicLogs, {
  eventId: z.string().uuid(),
  eventType: forensicEventTypeEnum,
  eventData: z.object({}).passthrough(),
  metadata: z.object({}).passthrough().optional(),
  userRoleHash: z.string().length(64),
  locationHash: z.string().length(64).optional(),
  signature: z.string().length(128)
});

export const selectForensicLogSchema = createSelectSchema(disasterForensicLogs);

export const insertBlockchainBatchSchema = createInsertSchema(disasterBlockchainBatches, {
  batchId: z.string().length(66),
  merkleRoot: z.string().length(66),
  logCount: z.number().positive(),
  status: z.enum(["pending", "confirmed", "failed"]).default("pending")
});

export const selectBlockchainBatchSchema = createSelectSchema(disasterBlockchainBatches);

export const insertIpfsContentSchema = createInsertSchema(disasterIpfsContents, {
  ipfsHash: z.string().length(64),
  contentType: z.string().min(1),
  sha256Hash: z.string().length(64),
  md5Hash: z.string().length(32),
  accessLevel: z.enum(["public", "restricted", "confidential"]).default("restricted")
});

export const selectIpfsContentSchema = createSelectSchema(disasterIpfsContents);

export const insertForensicAccessLogSchema = createInsertSchema(disasterForensicAccessLogs, {
  accessType: z.enum(["view", "download", "verify", "export"]),
  ipAddress: z.string().ip().optional(),
  success: z.boolean().default(true)
});

export const selectForensicAccessLogSchema = createSelectSchema(disasterForensicAccessLogs);

// Type exports
export type InsertForensicLog = typeof disasterForensicLogs.$inferInsert;
export type SelectForensicLog = typeof disasterForensicLogs.$inferSelect;
export type InsertBlockchainBatch = typeof disasterBlockchainBatches.$inferInsert;
export type SelectBlockchainBatch = typeof disasterBlockchainBatches.$inferSelect;
export type InsertIpfsContent = typeof disasterIpfsContents.$inferInsert;
export type SelectIpfsContent = typeof disasterIpfsContents.$inferSelect;
export type InsertForensicAccessLog = typeof disasterForensicAccessLogs.$inferInsert;
export type SelectForensicAccessLog = typeof disasterForensicAccessLogs.$inferSelect;