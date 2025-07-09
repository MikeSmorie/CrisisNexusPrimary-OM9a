# DisasterMng-1-OM9 Schema & Architecture Blueprint v0.2

## System Overview
**System ID:** DisasterMng-1-OM9  
**Version:** 0.2 Schema Locked  
**Database:** PostgreSQL with Drizzle ORM  
**Architecture:** Full-stack emergency response platform with AI integration  
**Security:** Role-based access control with emergency hierarchy  

## 1. Database Schema (PostgreSQL)

### Core Tables

#### `disaster_users` (Authentication & Personnel)
```sql
- id: serial PRIMARY KEY
- username: varchar(50) UNIQUE NOT NULL
- password: text NOT NULL (bcrypt hashed)
- email: varchar(255) UNIQUE NOT NULL
- role: enum('responder', 'commander', 'admin', 'coordinator')
- department: varchar(100)
- certification_level: varchar(50)
- location_zone: varchar(100)
- emergency_contact: varchar(255)
- language: varchar(10) DEFAULT 'en'
- status: enum('active', 'inactive', 'deployed') DEFAULT 'active'
- two_factor_enabled: boolean DEFAULT true
- created_at: timestamp DEFAULT NOW()
- last_login: timestamp
- subscription_plan: varchar(50) DEFAULT 'emergency'
- is_verified: boolean DEFAULT false
- token_version: integer DEFAULT 0
```

#### `disaster_incidents` (Core Incident Management)
```sql
- id: serial PRIMARY KEY
- incident_code: varchar(50) UNIQUE NOT NULL
- type: enum('fire', 'flood', 'earthquake', 'medical', 'hazmat', 'tornado', 'hurricane', 'terrorism', 'accident', 'search_rescue')
- severity: enum('minor', 'major', 'critical', 'catastrophic')
- status: enum('active', 'contained', 'resolved', 'investigating')
- location: text NOT NULL
- coordinates: text (lat,lng format)
- description: text NOT NULL
- reported_by: integer REFERENCES disaster_users(id)
- assigned_commander: integer REFERENCES disaster_users(id)
- created_at: timestamp DEFAULT NOW()
- updated_at: timestamp DEFAULT NOW()
- estimated_resolution: timestamp
- actual_resolution: timestamp
- resources_needed: text
- casualties_count: integer DEFAULT 0
- evacuations_count: integer DEFAULT 0
```

#### `disaster_resources` (Resource Management)
```sql
- id: serial PRIMARY KEY
- resource_code: varchar(50) UNIQUE NOT NULL
- type: enum('personnel', 'vehicle', 'equipment', 'supplies', 'medical')
- name: varchar(255) NOT NULL
- description: text
- status: enum('available', 'deployed', 'maintenance', 'out_of_service')
- location: text
- assigned_incident: integer REFERENCES disaster_incidents(id)
- operator_id: integer REFERENCES disaster_users(id)
- created_at: timestamp DEFAULT NOW()
- updated_at: timestamp DEFAULT NOW()
```

#### `disaster_alerts` (Alert System)
```sql
- id: serial PRIMARY KEY
- incident_id: integer REFERENCES disaster_incidents(id)
- type: enum('weather', 'evacuation', 'all_clear', 'public_warning', 'internal')
- severity: enum('watch', 'warning', 'emergency')
- title: varchar(255) NOT NULL
- message: text NOT NULL
- target_audience: text
- channels: text (JSON array of delivery channels)
- issued_by: integer REFERENCES disaster_users(id)
- issued_at: timestamp DEFAULT NOW()
- expires_at: timestamp
- acknowledged_count: integer DEFAULT 0
```

#### `disaster_communications` (Message System)
```sql
- id: serial PRIMARY KEY
- from_user: integer REFERENCES disaster_users(id)
- to_user: integer REFERENCES disaster_users(id)
- incident_id: integer REFERENCES disaster_incidents(id)
- message_type: enum('radio', 'urgent', 'status_update', 'resource_request', 'report')
- content: text NOT NULL
- priority: enum('low', 'normal', 'high', 'critical') DEFAULT 'normal'
- channel: text (radio, email, sms, app)
- created_at: timestamp DEFAULT NOW()
- acknowledged_at: timestamp
- translated_content: text
- original_language: varchar(10)
```

#### `disaster_activity_logs` (Audit Trail)
```sql
- id: serial PRIMARY KEY
- user_id: integer REFERENCES disaster_users(id)
- incident_id: integer REFERENCES disaster_incidents(id)
- action: varchar(255) NOT NULL
- timestamp: timestamp DEFAULT NOW()
- details: text (JSON metadata)
- location: text
- resource_involved: integer REFERENCES disaster_resources(id)
```

#### `disaster_translations` (AI Translation Cache)
```sql
- id: serial PRIMARY KEY
- original_text: text NOT NULL
- detected_language: varchar(10)
- translated_text: text NOT NULL
- target_language: varchar(10) DEFAULT 'en'
- confidence_score: decimal(3,2)
- ai_provider: varchar(50)
- created_at: timestamp DEFAULT NOW()
- incident_id: integer REFERENCES disaster_incidents(id)
```

#### `disaster_fallback_routes` (Communication Redundancy)
```sql
- id: serial PRIMARY KEY
- primary_channel: varchar(50) NOT NULL
- backup_channel_1: varchar(50)
- backup_channel_2: varchar(50)
- trigger_conditions: text (JSON)
- user_id: integer REFERENCES disaster_users(id)
- created_at: timestamp DEFAULT NOW()
- last_tested: timestamp
- status: enum('active', 'inactive') DEFAULT 'active'
```

## 2. API Endpoints (RESTful Architecture)

### Core Emergency Operations
```
POST   /api/disaster/incident/report     - Submit new incident
GET    /api/disaster/incident/:id        - Get incident details
PUT    /api/disaster/incident/:id        - Update incident
DELETE /api/disaster/incident/:id        - Close/resolve incident

POST   /api/disaster/alert/send          - Broadcast emergency alert
GET    /api/disaster/alert/:id           - Get alert details
PUT    /api/disaster/alert/:id/ack       - Acknowledge alert

GET    /api/disaster/dashboard/overview  - Dashboard stats
GET    /api/disaster/dashboard/:role     - Role-specific dashboard

POST   /api/disaster/communication/log   - Log communication
GET    /api/disaster/communication/:id   - Get communication thread

GET    /api/disaster/logs/activity       - Activity audit logs
GET    /api/disaster/logs/error          - Error logs

POST   /api/disaster/ai/translate        - AI translation service
POST   /api/disaster/ai/assess           - AI incident assessment

GET    /api/disaster/resources/available - Available resources
POST   /api/disaster/resources/deploy    - Deploy resource to incident
PUT    /api/disaster/resources/:id       - Update resource status
```

### Authentication & User Management
```
POST   /api/auth/login                   - Emergency personnel login
POST   /api/auth/logout                  - Secure logout
GET    /api/auth/me                      - Current user profile
PUT    /api/auth/profile                 - Update user profile
POST   /api/auth/change-password         - Change password
```

## 3. AI Routing & Decision Node (OmegaAIR Integration)

### AI Processing Hub
```javascript
// Core AI Router Function
async function sendAIRequest(context, type) {
  const providers = ['openai', 'claude', 'mistral'];
  
  for (const provider of providers) {
    try {
      const response = await processWithProvider(provider, context, type);
      logAIUsage(provider, type, response);
      return response;
    } catch (error) {
      logAIError(provider, error);
      continue; // Fallback to next provider
    }
  }
  
  throw new Error('All AI providers failed');
}

// AI Decision Types
- INCIDENT_CLASSIFICATION: Analyze severity, type, urgency
- TRANSLATION: Multi-language support (isiXhosa, Afrikaans, English)
- RESOURCE_ALLOCATION: Recommend optimal resource deployment
- RISK_ASSESSMENT: Predict incident escalation
- COMMUNICATION_ROUTING: Determine notification priorities
```

### AI Integration Points
1. **Incident Intake**: Auto-classify incident type and severity
2. **Translation Bridge**: Real-time language translation
3. **Resource Optimization**: AI-recommended resource allocation
4. **Predictive Analysis**: Early warning system integration
5. **Communication Intelligence**: Priority routing decisions

## 4. Authentication & Role Security

### Role Hierarchy
```
admin > commander > coordinator > responder
```

### Permission Matrix
| Feature | Responder | Coordinator | Commander | Admin |
|---------|-----------|-------------|-----------|-------|
| View Incidents | Assigned Only | Zone-based | All Active | All |
| Create Incidents | ✓ | ✓ | ✓ | ✓ |
| Assign Resources | ✗ | Limited | ✓ | ✓ |
| Send Alerts | ✗ | Zone-based | ✓ | ✓ |
| Access Logs | Own Actions | Zone-based | Department | All |
| Manage Users | ✗ | ✗ | Limited | ✓ |
| System Config | ✗ | ✗ | ✗ | ✓ |

### Security Features
- Two-factor authentication enabled by default
- Session-based authentication with secure cookies
- Role-based route protection
- Emergency access protocols
- Audit trail for all actions

## 5. Module Architecture (Emergency Operations)

### Module 1: Incident Intake
- **Purpose**: Rapid incident reporting and classification
- **Components**: Voice-to-text, form validation, auto-classification
- **AI Integration**: Incident type detection, severity assessment

### Module 2: AI Processing Hub
- **Purpose**: Central AI coordination for all emergency operations
- **Components**: Provider management, fallback routing, usage tracking
- **Features**: Translation, assessment, prediction, optimization

### Module 3: Alert Dispatch
- **Purpose**: Multi-channel emergency notifications
- **Components**: Channel selection, audience targeting, delivery tracking
- **Channels**: Radio, SMS, Email, App notifications, Public address

### Module 4: Response Assignment
- **Purpose**: Resource allocation and personnel deployment
- **Components**: Resource tracking, assignment logic, availability monitoring
- **Features**: Real-time status, GPS tracking, capability matching

### Module 5: Audit & Replay Logs
- **Purpose**: Complete audit trail and incident reconstruction
- **Components**: Activity logging, search/filter, export capabilities
- **Features**: Timeline reconstruction, performance analysis

### Module 6: Multilingual Command Bridge
- **Purpose**: Language barrier elimination in emergency response
- **Components**: Real-time translation, language detection, communication logging
- **Languages**: English, Afrikaans, isiXhosa, isiZulu (extensible)

### Module 7: Dashboard Console
- **Purpose**: Real-time emergency operations center interface
- **Components**: Role-based views, real-time updates, status monitoring
- **Features**: Incident map, resource status, alert management

## 6. Technical Architecture

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for emergency navigation
- **State**: TanStack Query for real-time data
- **UI**: shadcn/ui with emergency theme
- **Forms**: React Hook Form with Zod validation

### Backend Stack
- **Server**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with sessions
- **AI Integration**: OmegaAIR multiplexer system
- **Real-time**: WebSocket for live updates

### Deployment & Infrastructure
- **Platform**: Replit with cloud deployment
- **Database**: PostgreSQL with connection pooling
- **Session Store**: Memory store with persistence
- **Environment**: Multi-stage (dev/staging/prod)

## 7. Emergency Protocols

### Incident Response Workflow
1. **Report**: Incident submitted via voice/form
2. **Classify**: AI assessment of type/severity
3. **Alert**: Automated notifications to relevant personnel
4. **Assign**: Resource allocation and commander assignment
5. **Coordinate**: Real-time communication and updates
6. **Resolve**: Incident closure and post-incident analysis

### Communication Redundancy
- Primary: Digital app-based communication
- Backup 1: Radio communication
- Backup 2: SMS/Voice calls
- Emergency: Satellite communication

### Data Integrity
- Real-time database replication
- Automated backups every 15 minutes
- Transaction logging for all critical operations
- Disaster recovery protocols

---

**Status**: ✅ Schema Locked for v0.2  
**Next Phase**: Implementation of enhanced AI routing and real-time features  
**Emergency Contact**: System maintains 99.9% uptime SLA for critical operations