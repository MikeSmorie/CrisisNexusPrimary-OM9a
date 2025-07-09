# DisasterMng-1-OM9 API Endpoints Blueprint

## System ID: DisasterMng-1-OM9 v0.2
**Emergency Operations Center API Documentation**

---

## Core Emergency Management APIs

### 🚨 Incident Management
```http
POST   /api/disaster/incident/report        # Submit new emergency incident
GET    /api/disaster/incident/:id           # Get specific incident details
PUT    /api/disaster/incident/:id           # Update incident status
GET    /api/disaster/incidents              # List all incidents (role-based)
DELETE /api/disaster/incident/:id           # Close/resolve incident
```

### 📊 Dashboard & Statistics
```http
GET    /api/disaster/stats                  # Emergency operations center metrics
GET    /api/disaster/dashboard/overview     # Dashboard overview data
GET    /api/disaster/dashboard/:role        # Role-specific dashboard view
```

### 🚁 Resource Management
```http
GET    /api/disaster/resources              # Available emergency resources
GET    /api/disaster/resources/available    # Resources available for deployment
POST   /api/disaster/resources/deploy       # Deploy resource to incident
PUT    /api/disaster/resources/:id          # Update resource status
GET    /api/disaster/resources/:id          # Get resource details
```

### 🚨 Alert System
```http
POST   /api/disaster/alert/send             # Broadcast emergency alert
GET    /api/disaster/alert/:id              # Get alert details
PUT    /api/disaster/alert/:id/ack          # Acknowledge alert receipt
GET    /api/disaster/alerts                 # List all alerts
```

### 💬 Emergency Communications
```http
POST   /api/disaster/communication/log      # Log emergency communication
GET    /api/disaster/communication/:id      # Get communication thread
GET    /api/disaster/communications         # List communications
PUT    /api/disaster/communication/:id/ack  # Acknowledge communication
```

### 📝 Audit & Logging
```http
GET    /api/disaster/logs/activity          # Activity audit logs
GET    /api/disaster/logs/error             # System error logs
GET    /api/disaster/logs/communications    # Communication logs
```

---

## 🤖 AI Processing Hub APIs

### AI Translation Services
```http
POST   /api/disaster/ai/translate           # Emergency translation service
GET    /api/disaster/ai/translations        # Translation history
POST   /api/disaster/ai/detect-language     # Language detection
```

### AI Assessment & Analysis
```http
POST   /api/disaster/ai/assess              # AI incident assessment
POST   /api/disaster/ai/classify            # Incident classification
POST   /api/disaster/ai/risk-analysis       # Risk assessment
POST   /api/disaster/ai/resource-recommend  # Resource allocation recommendations
```

### AI Provider Management
```http
GET    /api/disaster/ai/providers           # AI provider status
POST   /api/disaster/ai/providers/test      # Test AI provider
GET    /api/disaster/ai/health              # AI system health check
```

---

## 🏗️ Emergency Response Modules

### Module 1: Incident Intake
```http
POST   /api/disaster/modules/incident/report     # Submit incident via multiple channels
POST   /api/disaster/modules/incident/voice      # Voice-to-text incident reporting
GET    /api/disaster/modules/incident/templates  # Incident report templates
```

### Module 2: AI Processing Hub
```http
GET    /api/disaster/modules/ai/status           # AI processing status
POST   /api/disaster/modules/ai/process          # Process incident through AI
GET    /api/disaster/modules/ai/queue            # AI processing queue
```

### Module 3: Alert Dispatch
```http
POST   /api/disaster/modules/alert/send          # Multi-channel alert dispatch
GET    /api/disaster/modules/alert/channels      # Available alert channels
POST   /api/disaster/modules/alert/broadcast     # Emergency broadcast
GET    /api/disaster/modules/alert/delivery      # Alert delivery status
```

### Module 4: Response Assignment
```http
POST   /api/disaster/modules/response/assign     # Assign resources to incident
GET    /api/disaster/modules/response/optimal    # Optimal resource allocation
PUT    /api/disaster/modules/response/update     # Update response assignments
GET    /api/disaster/modules/response/status     # Response status tracking
```

### Module 5: Audit & Replay Logs
```http
GET    /api/disaster/modules/logs/audit          # Comprehensive audit logs
GET    /api/disaster/modules/logs/replay         # Incident replay capability
POST   /api/disaster/modules/logs/export         # Export audit data
GET    /api/disaster/modules/logs/timeline       # Incident timeline reconstruction
```

### Module 6: Multilingual Command Bridge
```http
POST   /api/disaster/modules/communication/translate  # Real-time translation
GET    /api/disaster/modules/communication/languages  # Supported languages
POST   /api/disaster/modules/communication/bridge     # Communication bridge setup
GET    /api/disaster/modules/communication/history    # Translation history
```

### Module 7: Dashboard Console
```http
GET    /api/disaster/modules/dashboard/metrics        # Real-time metrics
GET    /api/disaster/modules/dashboard/map            # Incident map data
GET    /api/disaster/modules/dashboard/alerts         # Alert management interface
GET    /api/disaster/modules/dashboard/resources      # Resource management interface
```

---

## 🔐 Authentication & Authorization

### Session Management
```http
POST   /api/login                           # Emergency personnel login
POST   /api/logout                          # Secure logout
GET    /api/user                            # Current user profile
PUT    /api/user/profile                    # Update user profile
POST   /api/auth/change-password            # Change password
```

### Role-Based Access Control
```http
GET    /api/auth/permissions                # User permissions
GET    /api/auth/roles                      # Available roles
POST   /api/auth/validate-access            # Validate access to resource
```

---

## 📋 Request/Response Examples

### Submit Emergency Incident
```bash
curl -X POST http://localhost:5000/api/disaster/incident/report \
  -H "Content-Type: application/json" \
  -d '{
    "type": "flood",
    "severity": "major", 
    "location": "Khayelitsha Residential Area",
    "description": "Flash flood affecting multiple homes",
    "coordinates": "-34.0522,18.6854",
    "reportingMethod": "voice_to_text"
  }'
```

### AI Translation
```bash
curl -X POST http://localhost:5000/api/disaster/ai/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Amanzi ayanda kakhulu eKhayelitsha",
    "sourceLanguage": "xh",
    "targetLanguage": "en",
    "incidentId": 1
  }'
```

### Dashboard Metrics
```bash
curl -X GET http://localhost:5000/api/disaster/stats \
  -H "Content-Type: application/json"
```

**Response Example:**
```json
{
  "activeIncidents": 3,
  "availableResources": 12,
  "criticalAlerts": 1,
  "totalEvacuations": 0,
  "totalCasualties": 0,
  "systemStatus": "operational"
}
```

---

## 🎯 Role-Based Access Matrix

| Endpoint Category | Responder | Coordinator | Commander | Admin |
|-------------------|-----------|-------------|-----------|-------|
| View Incidents | Assigned | Zone-based | All Active | All |
| Create Incidents | ✓ | ✓ | ✓ | ✓ |
| Assign Resources | ✗ | Limited | ✓ | ✓ |
| Send Alerts | ✗ | Zone-based | ✓ | ✓ |
| AI Services | ✓ | ✓ | ✓ | ✓ |
| Audit Logs | Own Actions | Zone-based | Department | All |
| System Config | ✗ | ✗ | ✗ | ✓ |

---

## 🚨 Emergency Protocols

### High-Priority Incident Flow
1. **Report** → `/api/disaster/incident/report`
2. **Classify** → `/api/disaster/ai/assess`
3. **Alert** → `/api/disaster/modules/alert/send`
4. **Assign** → `/api/disaster/modules/response/assign`
5. **Monitor** → `/api/disaster/dashboard/metrics`

### Communication Redundancy
- **Primary**: App-based API calls
- **Backup 1**: Radio communication logging
- **Backup 2**: SMS/Voice integration
- **Emergency**: Satellite communication fallback

---

## 📊 API Status & Health

### System Health Check
```http
GET    /api/disaster/health                 # Overall system health
GET    /api/disaster/ai/health              # AI system health
GET    /api/disaster/modules/health         # Module health status
```

### Performance Metrics
```http
GET    /api/disaster/metrics/performance    # API performance metrics
GET    /api/disaster/metrics/usage          # Usage statistics
GET    /api/disaster/metrics/reliability    # Reliability metrics
```

---

**Status**: ✅ API Blueprint Complete - v0.2  
**Total Endpoints**: 50+ emergency response endpoints  
**Security**: Role-based access control enforced  
**Emergency Ready**: All critical pathways operational