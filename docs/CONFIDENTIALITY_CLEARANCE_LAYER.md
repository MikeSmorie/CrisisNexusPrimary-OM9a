# Confidentiality & Clearance Layer
## DisasterMng-1-OM9 Military-Grade Access Control System

### Overview

A comprehensive confidentiality framework modeled after SCI/SAP (Sensitive Compartmented Information / Special Access Programs) to ensure proper information security, need-to-know hierarchy, and military/crisis standard operating procedures compliance.

### Clearance Levels

#### 1. Security Classifications
- **UNCLASSIFIED**: Public information, general incident data
- **RESTRICTED**: Internal use only, personnel information
- **SECRET**: Sensitive operational data, resource locations
- **TOP_SECRET**: Critical infrastructure, high-value targets
- **FORENSIC_ONLY**: Audit trails, investigation data

#### 2. Role-Based Access Matrix

| Role | Clearance Level | Access Scope | Permissions |
|------|-----------------|--------------|-------------|
| **Responder** | RESTRICTED | Own incidents only | View/Edit assigned incidents |
| **Commander** | SECRET | Zone/Region | View all incidents in zone, assign resources |
| **National Admin** | TOP_SECRET | Full system | Complete access, user management |
| **AI Monitor** | RESTRICTED | Read-only | Training data, suggestion generation |
| **Forensic Analyst** | FORENSIC_ONLY | Redacted logs | Audit trails without sensitive details |

### Compartmentalization Model

#### Geographic Compartments
- **Zone Alpha**: Western Cape (Low Risk)
- **Zone Bravo**: Gauteng/High Unrest Areas 
- **Zone Charlie**: Rural/Remote Areas
- **Zone Delta**: Border/International Areas

#### Severity Compartments
- **Level 1**: Minor incidents (UNCLASSIFIED)
- **Level 2**: Moderate incidents (RESTRICTED)
- **Level 3**: Major incidents (SECRET)
- **Level 4**: Critical incidents (TOP_SECRET)

#### Source Clearance
- **Public Source**: Media reports, social media
- **Official Source**: Government agencies, military
- **Intelligence Source**: Classified intelligence feeds
- **Forensic Source**: Internal investigation data

### AI Output Obfuscation

#### Redaction Rules by Classification

**RESTRICTED Level:**
- Names → "Individual A", "Person B"
- Specific addresses → "Residential area"
- Organization names → "Local organization"

**SECRET Level:**
- Precise coordinates → General area descriptions
- Resource quantities → "Multiple units"
- Personnel details → Role descriptions only

**TOP_SECRET Level:**
- Critical infrastructure → "Government facility"
- High-value targets → "Strategic location"
- Operational details → "Classified operation"

#### Example Transformations
```
Original: "Fire at 123 Main St, Cape Town involving SANDF personnel"
RESTRICTED: "Fire at residential address in coastal city involving military personnel"
SECRET: "Fire incident in urban area involving defense personnel"
TOP_SECRET: "Security incident in classified location"
```

### Database Schema Extensions

#### Clearance Tags Table
```sql
CREATE TABLE disaster_clearance_tags (
    id SERIAL PRIMARY KEY,
    tag_name VARCHAR(20) NOT NULL UNIQUE,
    clearance_level INTEGER NOT NULL,
    description TEXT,
    color_code VARCHAR(7) -- Hex color for UI
);

INSERT INTO disaster_clearance_tags VALUES 
(1, 'unclassified', 1, 'Public information', '#28a745'),
(2, 'restricted', 2, 'Internal use only', '#ffc107'),
(3, 'secret', 3, 'Sensitive operational data', '#fd7e14'),
(4, 'top_secret', 4, 'Critical national security', '#dc3545'),
(5, 'forensic_only', 5, 'Investigation data only', '#6f42c1');
```

#### Access Control Matrix
```sql
CREATE TABLE disaster_access_control (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES disaster_users(id),
    clearance_level INTEGER NOT NULL,
    compartments JSONB DEFAULT '[]', -- Geographic/functional compartments
    granted_by INTEGER REFERENCES disaster_users(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);
```

#### Incident Classification
```sql
ALTER TABLE disaster_incidents ADD COLUMN classification_level INTEGER DEFAULT 1;
ALTER TABLE disaster_incidents ADD COLUMN compartment_tags JSONB DEFAULT '[]';
ALTER TABLE disaster_incidents ADD COLUMN source_clearance INTEGER DEFAULT 1;
ALTER TABLE disaster_incidents ADD COLUMN redaction_level INTEGER DEFAULT 0;
```

### Access Control Implementation

#### Clearance Verification Middleware
```typescript
function requireClearance(level: number, compartment?: string) {
  return (req: any, res: any, next: any) => {
    const userClearance = getUserClearance(req.user.id);
    
    if (!hasClearanceLevel(userClearance, level)) {
      return res.status(403).json({ 
        error: "Insufficient clearance level",
        required: level,
        current: userClearance.level
      });
    }
    
    if (compartment && !hasCompartmentAccess(userClearance, compartment)) {
      return res.status(403).json({
        error: "No compartment access",
        compartment
      });
    }
    
    next();
  };
}
```

#### Data Filtering Service
```typescript
class DataClassificationService {
  static filterByUserClearance(data: any[], userClearance: UserClearance): any[] {
    return data.filter(item => {
      return item.classification_level <= userClearance.level &&
             this.hasCompartmentAccess(userClearance, item.compartment_tags);
    });
  }
  
  static redactSensitiveData(data: any, userClearance: UserClearance): any {
    if (data.classification_level > userClearance.level) {
      return this.applyRedactionRules(data, userClearance.level);
    }
    return data;
  }
}
```

### Alert and Communication Controls

#### Message Classification
```typescript
interface ClassifiedMessage {
  id: string;
  content: string;
  classification: number;
  compartments: string[];
  authorClearance: number;
  redactedVersions: Record<number, string>;
}
```

#### Communication Filtering
```typescript
class CommunicationFilter {
  static filterMessagesByRole(messages: ClassifiedMessage[], userRole: string): ClassifiedMessage[] {
    const userClearance = this.getRoleClearance(userRole);
    
    return messages.map(message => {
      if (message.classification > userClearance) {
        return {
          ...message,
          content: message.redactedVersions[userClearance] || "[REDACTED]"
        };
      }
      return message;
    });
  }
}
```

### Audit Trail Enhancement

#### Clearance Access Logging
```sql
CREATE TABLE disaster_clearance_audit (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES disaster_users(id),
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100) NOT NULL,
    classification_accessed INTEGER NOT NULL,
    user_clearance_level INTEGER NOT NULL,
    compartment_accessed VARCHAR(50),
    access_granted BOOLEAN NOT NULL,
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Anomaly Detection
```typescript
class ClearanceAnomalyDetector {
  static async detectSuspiciousAccess(userId: number): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];
    
    // Check for rapid access to high-classification data
    const recentAccess = await this.getRecentHighClassificationAccess(userId);
    if (recentAccess.length > 10) {
      alerts.push({
        type: 'RAPID_HIGH_CLEARANCE_ACCESS',
        severity: 'HIGH',
        userId,
        details: `${recentAccess.length} high-clearance accesses in last hour`
      });
    }
    
    // Check for access outside normal patterns
    const normalPattern = await this.getUserAccessPattern(userId);
    const currentAccess = await this.getCurrentAccess(userId);
    
    if (this.isOutsideNormalPattern(currentAccess, normalPattern)) {
      alerts.push({
        type: 'UNUSUAL_ACCESS_PATTERN',
        severity: 'MEDIUM',
        userId,
        details: 'Access pattern differs from established baseline'
      });
    }
    
    return alerts;
  }
}
```

### AI Integration with Clearance

#### Clearance-Aware AI Processing
```typescript
class ClearanceAwareAI {
  static async processIncident(incident: any, userClearance: UserClearance): Promise<AIResponse> {
    // Redact input based on AI's clearance level
    const redactedIncident = DataClassificationService.redactSensitiveData(
      incident, 
      { level: 2, compartments: ['ai_training'] } // AI has RESTRICTED clearance
    );
    
    // Process with OmegaAIR
    const aiResponse = await OmegaAIR.process(redactedIncident);
    
    // Ensure AI output doesn't leak classified information
    const sanitizedResponse = this.sanitizeAIOutput(aiResponse, userClearance);
    
    return sanitizedResponse;
  }
  
  static sanitizeAIOutput(response: string, userClearance: UserClearance): string {
    // Apply redaction rules to AI output
    let sanitized = response;
    
    if (userClearance.level < 3) {
      sanitized = sanitized.replace(/\b\d{1,5}\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd)\b/g, 'residential area');
      sanitized = sanitized.replace(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, 'individual');
    }
    
    return sanitized;
  }
}
```

### UI Components for Clearance

#### Classification Badge Component
```typescript
function ClassificationBadge({ level }: { level: number }) {
  const classifications = {
    1: { name: 'UNCLASSIFIED', color: 'bg-green-500', textColor: 'text-white' },
    2: { name: 'RESTRICTED', color: 'bg-yellow-500', textColor: 'text-black' },
    3: { name: 'SECRET', color: 'bg-orange-500', textColor: 'text-white' },
    4: { name: 'TOP SECRET', color: 'bg-red-500', textColor: 'text-white' },
    5: { name: 'FORENSIC ONLY', color: 'bg-purple-500', textColor: 'text-white' }
  };
  
  const classification = classifications[level] || classifications[1];
  
  return (
    <span className={`px-2 py-1 rounded text-xs font-bold ${classification.color} ${classification.textColor}`}>
      {classification.name}
    </span>
  );
}
```

#### Clearance Warning Modal
```typescript
function ClearanceWarningModal({ requiredLevel, userLevel, onAccept, onDeny }: ClearanceWarningProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-red-900 text-white p-6 rounded-lg border-2 border-red-500">
        <div className="flex items-center mb-4">
          <Shield className="h-8 w-8 text-red-300 mr-3" />
          <h2 className="text-xl font-bold">CLEARANCE REQUIRED</h2>
        </div>
        
        <p className="mb-4">
          This information requires <strong>{getLevelName(requiredLevel)}</strong> clearance.
          Your current clearance: <strong>{getLevelName(userLevel)}</strong>
        </p>
        
        <p className="text-red-300 mb-6">
          Unauthorized access may result in disciplinary action.
          Proceed only if you have been granted temporary access.
        </p>
        
        <div className="flex space-x-4">
          <button 
            onClick={onDeny}
            className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
          >
            Cancel
          </button>
          <button 
            onClick={onAccept}
            className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
          >
            Acknowledge & Proceed
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Configuration Management

#### Clearance Configuration
```typescript
export const CLEARANCE_CONFIG = {
  levels: {
    UNCLASSIFIED: 1,
    RESTRICTED: 2,
    SECRET: 3,
    TOP_SECRET: 4,
    FORENSIC_ONLY: 5
  },
  
  roleClearances: {
    responder: 2,
    commander: 3,
    admin: 4,
    ai_monitor: 2,
    forensic_analyst: 5
  },
  
  compartments: {
    'zone_alpha': 'Western Cape Operations',
    'zone_bravo': 'Gauteng/High Risk Areas',
    'zone_charlie': 'Rural Operations', 
    'zone_delta': 'Border Operations',
    'ai_training': 'AI Training Data',
    'forensic_investigation': 'Investigation Data'
  },
  
  redactionRules: {
    names: /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,
    addresses: /\b\d{1,5}\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd)\b/g,
    coordinates: /-?\d+\.\d+,\s*-?\d+\.\d+/g,
    phones: /\b\d{3}-\d{3}-\d{4}\b/g
  }
};
```

### Performance Considerations

#### Caching Strategy
- Cache user clearance levels for 15 minutes
- Pre-compute redacted versions of frequently accessed data
- Use Redis for fast clearance lookups
- Implement lazy loading for classified content

#### Database Optimization
- Index on classification_level for fast filtering
- Partition audit tables by date
- Use materialized views for complex clearance queries
- Implement row-level security policies

### Compliance and Legal

#### Audit Requirements
- Maintain 7-year retention of clearance access logs
- Quarterly clearance review for all users
- Annual security clearance audits
- Real-time monitoring of suspicious access patterns

#### International Standards
- Comply with national security classification systems
- Align with NATO classification standards
- Support multi-national operation requirements
- Implement data sovereignty controls

This comprehensive clearance system ensures DisasterMng-1-OM9 meets military-grade security requirements while maintaining operational effectiveness during emergency response operations.