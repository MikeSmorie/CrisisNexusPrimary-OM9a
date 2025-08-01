CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text,
	"role" text DEFAULT 'user',
	"created_at" timestamp DEFAULT now(),
	"last_login" timestamp,
	"verification_token" text,
	"is_verified" boolean DEFAULT false,
	"two_factor_enabled" boolean DEFAULT false,
	"two_factor_secret" text,
	"subscription_plan" text DEFAULT 'free',
	"wallet_address" text,
	"referral_code" text,
	"referred_by" text,
	"status" text DEFAULT 'active',
	"notes" text,
	"skip_email_verification" boolean DEFAULT false,
	"token_version" integer DEFAULT 0,
	"token_balance" integer DEFAULT 0,
	"total_tokens_used" integer DEFAULT 0,
	"trial_active" boolean DEFAULT false,
	"trial_start_date" timestamp,
	"trial_expires_at" timestamp,
	"trial_ends_at" timestamp,
	"bonus_trial_claimed" boolean DEFAULT false,
	"is_test_account" boolean DEFAULT false,
	"achievements" jsonb DEFAULT '[]'::jsonb,
	"certification_level" text DEFAULT 'UNCLASSIFIED',
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "disaster_activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"incident_id" integer,
	"action" text NOT NULL,
	"timestamp" timestamp DEFAULT now(),
	"details" text,
	"location" text,
	"resource_involved" integer
);
--> statement-breakpoint
CREATE TABLE "disaster_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"alert_type" text NOT NULL,
	"severity" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"issued_by" integer,
	"target_zones" text,
	"active_until" timestamp,
	"created_at" timestamp DEFAULT now(),
	"acknowledged_by" text,
	"broadcast_channels" text,
	"is_mock" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disaster_communications" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_user" integer,
	"to_user" integer,
	"incident_id" integer,
	"message_type" text NOT NULL,
	"content" text NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"acknowledged_at" timestamp,
	"channel" text,
	"translated_content" text,
	"original_language" text DEFAULT 'en',
	"is_mock" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disaster_error_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT now(),
	"level" text NOT NULL,
	"message" text NOT NULL,
	"source" text NOT NULL,
	"stack_trace" text,
	"resolved" boolean DEFAULT false,
	"resolved_at" timestamp,
	"resolved_by" integer,
	"incident_related" integer
);
--> statement-breakpoint
CREATE TABLE "disaster_fallback_routes" (
	"id" serial PRIMARY KEY NOT NULL,
	"primary_channel" text NOT NULL,
	"backup_channel_1" text,
	"backup_channel_2" text,
	"trigger_conditions" text,
	"user_id" integer,
	"created_at" timestamp DEFAULT now(),
	"last_tested" timestamp,
	"status" text DEFAULT 'active'
);
--> statement-breakpoint
CREATE TABLE "disaster_incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"incident_code" text NOT NULL,
	"type" text NOT NULL,
	"severity" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"location" text NOT NULL,
	"coordinates" text,
	"description" text NOT NULL,
	"reported_by" integer,
	"assigned_commander" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"estimated_resolution" timestamp,
	"actual_resolution" timestamp,
	"resources_needed" text,
	"casualties_count" integer DEFAULT 0,
	"evacuations_count" integer DEFAULT 0,
	"is_mock" boolean DEFAULT false NOT NULL,
	CONSTRAINT "disaster_incidents_incident_code_unique" UNIQUE("incident_code")
);
--> statement-breakpoint
CREATE TABLE "disaster_resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"resource_type" text NOT NULL,
	"name" text NOT NULL,
	"identifier" text NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"location" text,
	"assigned_incident" integer,
	"operator_id" integer,
	"capabilities" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"is_mock" boolean DEFAULT false NOT NULL,
	CONSTRAINT "disaster_resources_identifier_unique" UNIQUE("identifier")
);
--> statement-breakpoint
CREATE TABLE "disaster_translations" (
	"id" serial PRIMARY KEY NOT NULL,
	"original_text" text NOT NULL,
	"detected_language" text,
	"translated_text" text NOT NULL,
	"target_language" text DEFAULT 'en',
	"confidence_score" numeric(3, 2),
	"ai_provider" text,
	"created_at" timestamp DEFAULT now(),
	"incident_id" integer
);
--> statement-breakpoint
CREATE TABLE "disaster_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'responder' NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"last_login" timestamp,
	"subscription_plan" text DEFAULT 'emergency',
	"department" text,
	"certification_level" text,
	"location_zone" text,
	"emergency_contact" text,
	"two_factor_enabled" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'active',
	"notes" text,
	"is_test_account" boolean DEFAULT false,
	"tokens" integer DEFAULT 0 NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verification_token" text,
	"token_version" integer DEFAULT 0 NOT NULL,
	"is_mock" boolean DEFAULT false NOT NULL,
	CONSTRAINT "disaster_users_username_unique" UNIQUE("username"),
	CONSTRAINT "disaster_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "communication_channels" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel_type" text NOT NULL,
	"channel_name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"priority" integer NOT NULL,
	"latency" integer DEFAULT 0,
	"bandwidth" integer DEFAULT 0,
	"reliability" numeric(5, 2) DEFAULT '100.00',
	"last_health_check" timestamp DEFAULT now(),
	"configuration" jsonb,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "emergency_broadcasts" (
	"id" serial PRIMARY KEY NOT NULL,
	"broadcast_id" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"issued_by" integer,
	"target_zones" text,
	"target_roles" text,
	"channels" text,
	"priority" text DEFAULT 'high' NOT NULL,
	"message_format" text DEFAULT 'text' NOT NULL,
	"active_until" timestamp,
	"acknowledged_by" text,
	"delivery_stats" jsonb,
	"created_at" timestamp DEFAULT now(),
	"cancelled_at" timestamp,
	"cancelled_by" integer,
	CONSTRAINT "emergency_broadcasts_broadcast_id_unique" UNIQUE("broadcast_id")
);
--> statement-breakpoint
CREATE TABLE "failover_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_channel" integer,
	"to_channel" integer,
	"reason" text NOT NULL,
	"triggered_by" integer,
	"incident_id" integer,
	"latency_before" integer,
	"latency_after" integer,
	"messages_pending" integer DEFAULT 0,
	"timestamp" timestamp DEFAULT now(),
	"resolved" boolean DEFAULT false,
	"resolved_at" timestamp,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "multi_channel_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"from_user" integer,
	"to_user" integer,
	"incident_id" integer,
	"content" text NOT NULL,
	"message_format" text DEFAULT 'text' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"primary_channel" integer,
	"actual_channel" integer,
	"fallback_attempts" integer DEFAULT 0,
	"delivery_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"delivered_at" timestamp,
	"acknowledged_at" timestamp,
	"voice_recording" text,
	"offline_queue" boolean DEFAULT false,
	"metadata" jsonb,
	CONSTRAINT "multi_channel_messages_message_id_unique" UNIQUE("message_id")
);
--> statement-breakpoint
CREATE TABLE "voice_text_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"original_audio" text,
	"transcribed_text" text,
	"confidence" numeric(3, 2),
	"language" text DEFAULT 'en',
	"timestamp" timestamp DEFAULT now(),
	"processed_at" timestamp,
	"sent_at" timestamp,
	"incident_id" integer,
	"is_offline" boolean DEFAULT false,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "disaster_access_control" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"clearance_level" integer NOT NULL,
	"compartments" jsonb DEFAULT '[]'::jsonb,
	"granted_by" integer,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"active" boolean DEFAULT true,
	"justification" text,
	"temporary_access" boolean DEFAULT false,
	"override_reason" text,
	"override_granted_by" integer
);
--> statement-breakpoint
CREATE TABLE "disaster_ai_clearance" (
	"id" serial PRIMARY KEY NOT NULL,
	"ai_model_name" varchar(50) NOT NULL,
	"max_clearance_level" integer NOT NULL,
	"allowed_compartments" jsonb DEFAULT '[]'::jsonb,
	"redaction_rules" jsonb DEFAULT '[]'::jsonb,
	"output_sanitization" boolean DEFAULT true,
	"training_data_access" boolean DEFAULT false,
	"active" boolean DEFAULT true,
	"configured_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disaster_clearance_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"action" varchar(50) NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"resource_id" varchar(100) NOT NULL,
	"classification_accessed" integer NOT NULL,
	"user_clearance_level" integer NOT NULL,
	"compartment_accessed" varchar(50),
	"access_granted" boolean NOT NULL,
	"reason" text,
	"ip_address" varchar(45),
	"user_agent" text,
	"session_id" varchar(64),
	"risk_score" integer DEFAULT 0,
	"anomaly_flags" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disaster_clearance_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"tag_name" varchar(20) NOT NULL,
	"clearance_level" integer NOT NULL,
	"description" text,
	"color_code" varchar(7),
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "disaster_clearance_tags_tag_name_unique" UNIQUE("tag_name")
);
--> statement-breakpoint
CREATE TABLE "disaster_compartments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"compartment_type" varchar(20) NOT NULL,
	"parent_compartment" integer,
	"required_clearance" integer NOT NULL,
	"auto_expiry" boolean DEFAULT false,
	"expiry_days" integer,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "disaster_compartments_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "disaster_emergency_overrides" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"original_clearance" integer NOT NULL,
	"override_clearance" integer NOT NULL,
	"override_reason" text NOT NULL,
	"incident_id" integer,
	"authorized_by" integer NOT NULL,
	"authorization_code" varchar(20),
	"valid_from" timestamp DEFAULT now() NOT NULL,
	"valid_until" timestamp NOT NULL,
	"auto_revoke" boolean DEFAULT true,
	"status" varchar(20) DEFAULT 'active',
	"revoked_by" integer,
	"revoked_at" timestamp,
	"revoke_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disaster_redaction_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule_name" varchar(50) NOT NULL,
	"target_field" varchar(50) NOT NULL,
	"classification_threshold" integer NOT NULL,
	"redaction_pattern" text NOT NULL,
	"replacement_text" text NOT NULL,
	"rule_type" varchar(20) NOT NULL,
	"active" boolean DEFAULT true,
	"priority" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "disaster_redaction_rules_rule_name_unique" UNIQUE("rule_name")
);
--> statement-breakpoint
CREATE TABLE "disaster_security_incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"incident_type" varchar(50) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"user_id" integer,
	"description" text NOT NULL,
	"affected_resources" jsonb DEFAULT '[]'::jsonb,
	"classification_level" integer,
	"compartments_involved" jsonb DEFAULT '[]'::jsonb,
	"investigated_by" integer,
	"investigation_status" varchar(20) DEFAULT 'open',
	"resolution" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"reported_to_authorities" boolean DEFAULT false,
	"regulatory_notification" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "disaster_blockchain_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" varchar(66) NOT NULL,
	"merkle_root" varchar(66) NOT NULL,
	"transaction_hash" varchar(66),
	"block_number" bigint,
	"log_count" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp,
	"gas_used" bigint,
	"status" varchar(20) DEFAULT 'pending',
	"gas_price_wei" bigint,
	"total_cost_wei" bigint,
	"retry_count" integer DEFAULT 0,
	"last_retry_at" timestamp,
	"error_message" text,
	CONSTRAINT "disaster_blockchain_batches_batch_id_unique" UNIQUE("batch_id")
);
--> statement-breakpoint
CREATE TABLE "disaster_encryption_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"key_version" integer NOT NULL,
	"key_fingerprint" varchar(64) NOT NULL,
	"algorithm" varchar(20) DEFAULT 'AES-256-GCM',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"activated_at" timestamp,
	"deprecated_at" timestamp,
	"derivation_method" varchar(50) DEFAULT 'PBKDF2',
	"salt_hash" varchar(64),
	"iterations" integer DEFAULT 100000,
	"authorized_roles" jsonb DEFAULT '[]'::jsonb,
	"usage_count" integer DEFAULT 0,
	"max_usage" integer,
	"compliance_standard" varchar(50),
	"audit_trail" jsonb DEFAULT '[]'::jsonb,
	CONSTRAINT "disaster_encryption_keys_key_version_unique" UNIQUE("key_version")
);
--> statement-breakpoint
CREATE TABLE "disaster_forensic_access_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"forensic_log_id" integer NOT NULL,
	"accessed_by" integer NOT NULL,
	"access_type" varchar(20) NOT NULL,
	"accessed_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"session_id" varchar(64),
	"geo_location" jsonb DEFAULT '{}'::jsonb,
	"timezone" varchar(50),
	"data_fields_accessed" jsonb DEFAULT '[]'::jsonb,
	"export_format" varchar(20),
	"success" boolean DEFAULT true,
	"error_message" text,
	"justification" text,
	"authorized_by" integer,
	"compliance_flags" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "disaster_forensic_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(36) NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"user_id" integer,
	"user_role_hash" varchar(64) NOT NULL,
	"event_data" jsonb NOT NULL,
	"location_hash" varchar(64),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"blockchain_hash" varchar(66),
	"blockchain_confirmed" boolean DEFAULT false,
	"block_number" bigint,
	"transaction_hash" varchar(66),
	"ipfs_hash" varchar(64),
	"signature" varchar(128) NOT NULL,
	"encrypted_payload" text,
	"key_version" integer DEFAULT 1,
	"access_log" jsonb DEFAULT '[]'::jsonb,
	"integrity_verified" boolean DEFAULT true,
	"last_verified" timestamp DEFAULT now(),
	"batch_id" varchar(66),
	"batch_sequence" integer,
	CONSTRAINT "disaster_forensic_logs_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "disaster_integrity_verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"forensic_log_id" integer NOT NULL,
	"verification_type" varchar(30) NOT NULL,
	"verification_result" boolean NOT NULL,
	"verified_at" timestamp DEFAULT now() NOT NULL,
	"verified_by" integer,
	"expected_value" text,
	"actual_value" text,
	"algorithm_used" varchar(50),
	"blockchain_network" varchar(20),
	"contract_address" varchar(42),
	"error_details" jsonb DEFAULT '{}'::jsonb,
	"verification_duration" integer,
	"previous_verification_id" integer,
	"trust_score" integer DEFAULT 100
);
--> statement-breakpoint
CREATE TABLE "disaster_ipfs_contents" (
	"id" serial PRIMARY KEY NOT NULL,
	"ipfs_hash" varchar(64) NOT NULL,
	"content_type" varchar(100) NOT NULL,
	"original_filename" varchar(255),
	"file_size" bigint,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"uploaded_by" integer,
	"sha256_hash" varchar(64) NOT NULL,
	"md5_hash" varchar(32) NOT NULL,
	"media_metadata" jsonb DEFAULT '{}'::jsonb,
	"access_level" varchar(20) DEFAULT 'restricted',
	"encryption_enabled" boolean DEFAULT false,
	"pinned" boolean DEFAULT true,
	"replication_status" varchar(20) DEFAULT 'active',
	CONSTRAINT "disaster_ipfs_contents_ipfs_hash_unique" UNIQUE("ipfs_hash")
);
--> statement-breakpoint
ALTER TABLE "disaster_activity_logs" ADD CONSTRAINT "disaster_activity_logs_user_id_disaster_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_activity_logs" ADD CONSTRAINT "disaster_activity_logs_incident_id_disaster_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."disaster_incidents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_activity_logs" ADD CONSTRAINT "disaster_activity_logs_resource_involved_disaster_resources_id_fk" FOREIGN KEY ("resource_involved") REFERENCES "public"."disaster_resources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_alerts" ADD CONSTRAINT "disaster_alerts_issued_by_disaster_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_communications" ADD CONSTRAINT "disaster_communications_from_user_disaster_users_id_fk" FOREIGN KEY ("from_user") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_communications" ADD CONSTRAINT "disaster_communications_to_user_disaster_users_id_fk" FOREIGN KEY ("to_user") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_communications" ADD CONSTRAINT "disaster_communications_incident_id_disaster_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."disaster_incidents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_error_logs" ADD CONSTRAINT "disaster_error_logs_resolved_by_disaster_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_error_logs" ADD CONSTRAINT "disaster_error_logs_incident_related_disaster_incidents_id_fk" FOREIGN KEY ("incident_related") REFERENCES "public"."disaster_incidents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_fallback_routes" ADD CONSTRAINT "disaster_fallback_routes_user_id_disaster_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_incidents" ADD CONSTRAINT "disaster_incidents_reported_by_disaster_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_incidents" ADD CONSTRAINT "disaster_incidents_assigned_commander_disaster_users_id_fk" FOREIGN KEY ("assigned_commander") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_resources" ADD CONSTRAINT "disaster_resources_assigned_incident_disaster_incidents_id_fk" FOREIGN KEY ("assigned_incident") REFERENCES "public"."disaster_incidents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_resources" ADD CONSTRAINT "disaster_resources_operator_id_disaster_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_translations" ADD CONSTRAINT "disaster_translations_incident_id_disaster_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."disaster_incidents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_broadcasts" ADD CONSTRAINT "emergency_broadcasts_issued_by_disaster_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_broadcasts" ADD CONSTRAINT "emergency_broadcasts_cancelled_by_disaster_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "failover_logs" ADD CONSTRAINT "failover_logs_from_channel_communication_channels_id_fk" FOREIGN KEY ("from_channel") REFERENCES "public"."communication_channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "failover_logs" ADD CONSTRAINT "failover_logs_to_channel_communication_channels_id_fk" FOREIGN KEY ("to_channel") REFERENCES "public"."communication_channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "failover_logs" ADD CONSTRAINT "failover_logs_triggered_by_disaster_users_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "failover_logs" ADD CONSTRAINT "failover_logs_incident_id_disaster_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."disaster_incidents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "multi_channel_messages" ADD CONSTRAINT "multi_channel_messages_from_user_disaster_users_id_fk" FOREIGN KEY ("from_user") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "multi_channel_messages" ADD CONSTRAINT "multi_channel_messages_to_user_disaster_users_id_fk" FOREIGN KEY ("to_user") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "multi_channel_messages" ADD CONSTRAINT "multi_channel_messages_incident_id_disaster_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."disaster_incidents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "multi_channel_messages" ADD CONSTRAINT "multi_channel_messages_primary_channel_communication_channels_id_fk" FOREIGN KEY ("primary_channel") REFERENCES "public"."communication_channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "multi_channel_messages" ADD CONSTRAINT "multi_channel_messages_actual_channel_communication_channels_id_fk" FOREIGN KEY ("actual_channel") REFERENCES "public"."communication_channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_text_cache" ADD CONSTRAINT "voice_text_cache_user_id_disaster_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_text_cache" ADD CONSTRAINT "voice_text_cache_incident_id_disaster_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."disaster_incidents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_access_control" ADD CONSTRAINT "disaster_access_control_user_id_disaster_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_access_control" ADD CONSTRAINT "disaster_access_control_granted_by_disaster_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_access_control" ADD CONSTRAINT "disaster_access_control_override_granted_by_disaster_users_id_fk" FOREIGN KEY ("override_granted_by") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_ai_clearance" ADD CONSTRAINT "disaster_ai_clearance_configured_by_disaster_users_id_fk" FOREIGN KEY ("configured_by") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_clearance_audit" ADD CONSTRAINT "disaster_clearance_audit_user_id_disaster_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_compartments" ADD CONSTRAINT "disaster_compartments_parent_compartment_disaster_compartments_id_fk" FOREIGN KEY ("parent_compartment") REFERENCES "public"."disaster_compartments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_emergency_overrides" ADD CONSTRAINT "disaster_emergency_overrides_user_id_disaster_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_emergency_overrides" ADD CONSTRAINT "disaster_emergency_overrides_incident_id_disaster_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."disaster_incidents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_emergency_overrides" ADD CONSTRAINT "disaster_emergency_overrides_authorized_by_disaster_users_id_fk" FOREIGN KEY ("authorized_by") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_emergency_overrides" ADD CONSTRAINT "disaster_emergency_overrides_revoked_by_disaster_users_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_security_incidents" ADD CONSTRAINT "disaster_security_incidents_user_id_disaster_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_security_incidents" ADD CONSTRAINT "disaster_security_incidents_investigated_by_disaster_users_id_fk" FOREIGN KEY ("investigated_by") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_forensic_access_logs" ADD CONSTRAINT "disaster_forensic_access_logs_forensic_log_id_disaster_forensic_logs_id_fk" FOREIGN KEY ("forensic_log_id") REFERENCES "public"."disaster_forensic_logs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_forensic_access_logs" ADD CONSTRAINT "disaster_forensic_access_logs_accessed_by_disaster_users_id_fk" FOREIGN KEY ("accessed_by") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_forensic_access_logs" ADD CONSTRAINT "disaster_forensic_access_logs_authorized_by_disaster_users_id_fk" FOREIGN KEY ("authorized_by") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_forensic_logs" ADD CONSTRAINT "disaster_forensic_logs_user_id_disaster_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_integrity_verifications" ADD CONSTRAINT "disaster_integrity_verifications_forensic_log_id_disaster_forensic_logs_id_fk" FOREIGN KEY ("forensic_log_id") REFERENCES "public"."disaster_forensic_logs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_integrity_verifications" ADD CONSTRAINT "disaster_integrity_verifications_verified_by_disaster_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_integrity_verifications" ADD CONSTRAINT "disaster_integrity_verifications_previous_verification_id_disaster_integrity_verifications_id_fk" FOREIGN KEY ("previous_verification_id") REFERENCES "public"."disaster_integrity_verifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disaster_ipfs_contents" ADD CONSTRAINT "disaster_ipfs_contents_uploaded_by_disaster_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."disaster_users"("id") ON DELETE no action ON UPDATE no action;