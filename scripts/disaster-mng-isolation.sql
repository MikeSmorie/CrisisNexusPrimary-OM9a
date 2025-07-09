-- DisasterMng-1-OM9 Database Isolation Script
-- Generated: 2025-07-09
-- Purpose: Clean isolation for disaster management application

-- Drop all existing tables (full isolation)
DROP TABLE IF EXISTS announcement_responses CASCADE;
DROP TABLE IF EXISTS announcement_recipients CASCADE;
DROP TABLE IF EXISTS admin_announcements CASCADE;
DROP TABLE IF EXISTS ai_output_logs CASCADE;
DROP TABLE IF EXISTS ai_messages CASCADE;
DROP TABLE IF EXISTS ai_sessions CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS asset_flow_projects CASCADE;
DROP TABLE IF EXISTS asset_flow_data CASCADE;
DROP TABLE IF EXISTS asset_pitch_decks CASCADE;
DROP TABLE IF EXISTS assetflow_access CASCADE;
DROP TABLE IF EXISTS investor_profiles CASCADE;
DROP TABLE IF EXISTS youtube_quota_usage CASCADE;
DROP TABLE IF EXISTS user_trend_preferences CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS user_favorites CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS tokens CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS team_dynamics CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS saved_analyses CASCADE;
DROP TABLE IF EXISTS rewrites CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS referral_redemptions CASCADE;
DROP TABLE IF EXISTS proposal_feedback CASCADE;
DROP TABLE IF EXISTS prospected_channels CASCADE;
DROP TABLE IF EXISTS performance_reviews CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS payment_providers CASCADE;
DROP TABLE IF EXISTS plan_features CASCADE;
DROP TABLE IF EXISTS omegaLogs CASCADE;
DROP TABLE IF EXISTS omega_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS news_items CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS module5_keywords CASCADE;
DROP TABLE IF EXISTS module5_articles CASCADE;
DROP TABLE IF EXISTS module4_keywords CASCADE;
DROP TABLE IF EXISTS module4_articles CASCADE;
DROP TABLE IF EXISTS messaging_assets CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS market_trends CASCADE;
DROP TABLE IF EXISTS legal_profiles CASCADE;
DROP TABLE IF EXISTS legal_documents CASCADE;
DROP TABLE IF EXISTS intake_requests CASCADE;
DROP TABLE IF EXISTS ghostwriter_outputs CASCADE;
DROP TABLE IF EXISTS ghostwriter_inputs CASCADE;
DROP TABLE IF EXISTS georeach_outputs CASCADE;
DROP TABLE IF EXISTS georeach_inputs CASCADE;
DROP TABLE IF EXISTS founder_responses_history CASCADE;
DROP TABLE IF EXISTS founder_profiles CASCADE;
DROP TABLE IF EXISTS founder_field_statuses CASCADE;
DROP TABLE IF EXISTS forecasts CASCADE;
DROP TABLE IF EXISTS financial_notes CASCADE;
DROP TABLE IF EXISTS financial_models CASCADE;
DROP TABLE IF EXISTS features CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS error_logs CASCADE;
DROP TABLE IF EXISTS deployment_settings CASCADE;
DROP TABLE IF EXISTS deployment_flags CASCADE;
DROP TABLE IF EXISTS data_backups CASCADE;
DROP TABLE IF EXISTS competitor_profiles CASCADE;
DROP TABLE IF EXISTS competitor_alerts CASCADE;
DROP TABLE IF EXISTS company_profiles CASCADE;
DROP TABLE IF EXISTS channel_checkups CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS campaign_channels CASCADE;
DROP TABLE IF EXISTS business_contexts CASCADE;
DROP TABLE IF EXISTS brand_voice_tokens CASCADE;
DROP TABLE IF EXISTS brand_profiles CASCADE;
DROP TABLE IF EXISTS audience_feedback CASCADE;
DROP TABLE IF EXISTS agent_performance CASCADE;
DROP TABLE IF EXISTS admin_activity_log CASCADE;
DROP TABLE IF EXISTS ai_versions CASCADE;
DROP TABLE IF EXISTS accepted_optimizations CASCADE;
DROP TABLE IF EXISTS vouchers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS trend_digests CASCADE;
DROP TABLE IF EXISTS revenue_streams CASCADE;
DROP TABLE IF EXISTS qa_status CASCADE;

-- Create disaster management specific tables with disaster_ prefix
CREATE TABLE disaster_users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'responder',
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  subscription_plan TEXT DEFAULT 'emergency',
  department TEXT, -- Fire, Police, Medical, Emergency Management
  certification_level TEXT, -- Basic, Advanced, Expert
  location_zone TEXT, -- Geographic assignment
  emergency_contact TEXT,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT true, -- Default enabled for security
  status TEXT DEFAULT 'active',
  notes TEXT,
  is_test_account BOOLEAN DEFAULT false,
  tokens INTEGER NOT NULL DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verification_token TEXT,
  token_version INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE disaster_incidents (
  id SERIAL PRIMARY KEY,
  incident_code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- fire, flood, earthquake, medical, hazmat, etc.
  severity TEXT NOT NULL, -- minor, major, critical, catastrophic
  status TEXT NOT NULL DEFAULT 'active', -- active, contained, resolved
  location TEXT NOT NULL,
  coordinates TEXT, -- GPS coordinates
  description TEXT NOT NULL,
  reported_by INTEGER REFERENCES disaster_users(id),
  assigned_commander INTEGER REFERENCES disaster_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  estimated_resolution TIMESTAMP,
  actual_resolution TIMESTAMP,
  resources_needed TEXT,
  casualties_count INTEGER DEFAULT 0,
  evacuations_count INTEGER DEFAULT 0
);

CREATE TABLE disaster_resources (
  id SERIAL PRIMARY KEY,
  resource_type TEXT NOT NULL, -- personnel, vehicle, equipment, supplies
  name TEXT NOT NULL,
  identifier TEXT UNIQUE NOT NULL, -- Unit number, equipment ID
  status TEXT NOT NULL DEFAULT 'available', -- available, deployed, maintenance, out_of_service
  location TEXT,
  assigned_incident INTEGER REFERENCES disaster_incidents(id),
  operator_id INTEGER REFERENCES disaster_users(id),
  capabilities TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE disaster_alerts (
  id SERIAL PRIMARY KEY,
  alert_type TEXT NOT NULL, -- weather, evacuation, all_clear, public_warning
  severity TEXT NOT NULL, -- watch, warning, emergency
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  issued_by INTEGER REFERENCES disaster_users(id),
  target_zones TEXT, -- Geographic areas affected
  active_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  acknowledged_by TEXT, -- JSON array of user IDs who acknowledged
  broadcast_channels TEXT -- radio, sms, social, sirens
);

CREATE TABLE disaster_activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES disaster_users(id),
  incident_id INTEGER REFERENCES disaster_incidents(id),
  action TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  details TEXT,
  location TEXT,
  resource_involved INTEGER REFERENCES disaster_resources(id)
);

CREATE TABLE disaster_error_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT NOT NULL,
  stack_trace TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  resolved_by INTEGER REFERENCES disaster_users(id),
  incident_related INTEGER REFERENCES disaster_incidents(id)
);

CREATE TABLE disaster_communications (
  id SERIAL PRIMARY KEY,
  from_user INTEGER REFERENCES disaster_users(id),
  to_user INTEGER REFERENCES disaster_users(id),
  incident_id INTEGER REFERENCES disaster_incidents(id),
  message_type TEXT NOT NULL, -- radio, urgent, status_update, resource_request
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal', -- low, normal, high, critical
  created_at TIMESTAMP DEFAULT NOW(),
  acknowledged_at TIMESTAMP,
  channel TEXT -- radio_channel, direct, broadcast
);

-- Insert disaster management seed data
INSERT INTO disaster_users (username, password, role, email, department, certification_level, location_zone) 
VALUES 
  ('admin', '$2b$10$zHU/D9vDo7zRa0O2.example', 'admin', 'admin@disastermng.emergency', 'Emergency Management', 'Expert', 'Central Command'),
  ('chief_fire', '$2b$10$zHU/D9vDo7zRa0O2.example', 'commander', 'chief@fire.emergency', 'Fire Department', 'Expert', 'Zone 1'),
  ('medic_1', '$2b$10$zHU/D9vDo7zRa0O2.example', 'responder', 'medic1@ems.emergency', 'Emergency Medical', 'Advanced', 'Zone 1');

-- Create indexes for performance
CREATE INDEX idx_disaster_incidents_status ON disaster_incidents(status);
CREATE INDEX idx_disaster_incidents_type ON disaster_incidents(type);
CREATE INDEX idx_disaster_incidents_severity ON disaster_incidents(severity);
CREATE INDEX idx_disaster_resources_status ON disaster_resources(status);
CREATE INDEX idx_disaster_resources_type ON disaster_resources(resource_type);
CREATE INDEX idx_disaster_alerts_active ON disaster_alerts(active_until);
CREATE INDEX idx_disaster_activity_logs_timestamp ON disaster_activity_logs(timestamp);
CREATE INDEX idx_disaster_communications_incident ON disaster_communications(incident_id);
CREATE INDEX idx_disaster_communications_priority ON disaster_communications(priority);

COMMENT ON TABLE disaster_users IS 'Emergency response personnel and administrators';
COMMENT ON TABLE disaster_incidents IS 'Active and historical emergency incidents';
COMMENT ON TABLE disaster_resources IS 'Emergency response resources (personnel, vehicles, equipment)';
COMMENT ON TABLE disaster_alerts IS 'Public and internal emergency alerts';
COMMENT ON TABLE disaster_activity_logs IS 'Audit trail of all emergency response activities';
COMMENT ON TABLE disaster_error_logs IS 'System error tracking for emergency systems';
COMMENT ON TABLE disaster_communications IS 'Emergency communications and coordination messages';