# Smart Contract + Forensic Logging Layer
## DisasterMng-1-OM9 Immutable Audit System

### Overview

A comprehensive forensic logging system combining blockchain immutability with local redundancy for tamper-proof emergency response audit trails. The system provides role-based transparency and enables post-crisis forensic reconstruction.

### Architecture Components

#### 1. Smart Contract Layer (EVM Compatible)
- **Chain**: Polygon (low cost) or Base (Ethereum L2)
- **Contract**: Emergency Response Logging Contract
- **Purpose**: Immutable timestamping and hash verification
- **Gas Optimization**: Batch operations and merkle tree proofs

#### 2. Forensic Database Layer
- **Storage**: PostgreSQL encrypted tables with daily blockchain backups
- **Redundancy**: Local + cloud backup with geographic distribution
- **Access**: Role-based permissions with audit trail viewing restrictions

#### 3. Integration Layer
- **IPFS**: Distributed file storage for media evidence
- **Encryption**: AES-256 for sensitive data with role-based key management
- **API**: REST endpoints for forensic data retrieval and verification

### Smart Contract Design

#### Core Events Logged to Blockchain

1. **Incident Creation**
   - Incident UUID (hashed)
   - Timestamp (block timestamp)
   - Reporter role hash
   - Location hash (geo-coordinates)
   - Classification hash

2. **Decision Approval**
   - Decision ID (hashed)
   - Approver role hash
   - Decision type
   - Timestamp

3. **Resource Allocation**
   - Resource ID (hashed)
   - Allocator role hash
   - Resource type
   - Quantity/details hash

4. **Resolution Submission**
   - Resolution ID (hashed)
   - Resolver role hash
   - Status change
   - Completion timestamp

#### Smart Contract Functions

```solidity
// Emergency Response Logging Contract
contract EmergencyResponseLogger {
    struct LogEntry {
        bytes32 eventHash;
        bytes32 userRoleHash;
        bytes32 locationHash;
        uint256 timestamp;
        uint8 eventType;
    }
    
    mapping(bytes32 => LogEntry) public logs;
    mapping(address => bool) public authorizedLoggers;
    
    event EmergencyEventLogged(
        bytes32 indexed eventId,
        bytes32 eventHash,
        uint8 eventType,
        uint256 timestamp
    );
    
    function logEmergencyEvent(
        bytes32 eventId,
        bytes32 eventHash,
        bytes32 userRoleHash,
        bytes32 locationHash,
        uint8 eventType
    ) external onlyAuthorized {
        logs[eventId] = LogEntry({
            eventHash: eventHash,
            userRoleHash: userRoleHash,
            locationHash: locationHash,
            timestamp: block.timestamp,
            eventType: eventType
        });
        
        emit EmergencyEventLogged(eventId, eventHash, eventType, block.timestamp);
    }
    
    function verifyEvent(bytes32 eventId) external view returns (bool) {
        return logs[eventId].timestamp > 0;
    }
}
```

### Database Schema Extensions

#### Forensic Logs Table
```sql
CREATE TABLE disaster_forensic_logs (
    id SERIAL PRIMARY KEY,
    event_id UUID NOT NULL UNIQUE,
    event_type VARCHAR(50) NOT NULL,
    user_id INTEGER REFERENCES disaster_users(id),
    user_role_hash VARCHAR(64) NOT NULL,
    event_data JSONB NOT NULL,
    location_hash VARCHAR(64),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    blockchain_hash VARCHAR(66),
    blockchain_confirmed BOOLEAN DEFAULT FALSE,
    ipfs_hash VARCHAR(64),
    signature VARCHAR(128) NOT NULL,
    
    -- Encryption fields
    encrypted_payload BYTEA,
    key_version INTEGER DEFAULT 1,
    
    -- Audit fields
    access_log JSONB DEFAULT '[]',
    integrity_verified BOOLEAN DEFAULT TRUE
);

-- Indexes for performance
CREATE INDEX idx_forensic_logs_event_type ON disaster_forensic_logs(event_type);
CREATE INDEX idx_forensic_logs_user_id ON disaster_forensic_logs(user_id);
CREATE INDEX idx_forensic_logs_created_at ON disaster_forensic_logs(created_at);
CREATE INDEX idx_forensic_logs_blockchain_hash ON disaster_forensic_logs(blockchain_hash);
```

#### Blockchain Batch Operations Table
```sql
CREATE TABLE disaster_blockchain_batches (
    id SERIAL PRIMARY KEY,
    batch_hash VARCHAR(66) NOT NULL UNIQUE,
    merkle_root VARCHAR(66) NOT NULL,
    transaction_hash VARCHAR(66),
    block_number BIGINT,
    log_count INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    gas_used BIGINT,
    status VARCHAR(20) DEFAULT 'pending'
);
```

### Implementation Plan

#### Phase 1: Off-Chain Logging Foundation (Weeks 1-2)
- Implement forensic logging database tables
- Create encryption/decryption service
- Build role-based access control for log viewing
- Implement daily hash generation for blockchain backup

#### Phase 2: Blockchain Integration (Weeks 3-4)
- Deploy smart contract to Polygon testnet
- Implement batch hashing and merkle tree generation
- Create blockchain submission service
- Add verification endpoints

#### Phase 3: IPFS Integration (Weeks 5-6)
- IPFS node setup for media storage
- Image/audio fingerprinting service
- Distributed backup system
- Content addressing for evidence files

#### Phase 4: Production Deployment (Weeks 7-8)
- Production blockchain deployment
- Government compliance integration
- Performance optimization
- Security audit and penetration testing

### Role-Based Access Control

#### Commander Access
- View logs for their assigned region
- Access incident reports and decisions
- Cannot view sensitive AI bias data
- Can request forensic reports for their incidents

#### Admin Access
- Full system log access
- User activity monitoring
- System integrity verification
- Blockchain verification status

#### AI Monitor Access
- Redacted view for bias tracking
- AI decision logs only
- No personal identifying information
- Aggregate statistics and patterns

### API Endpoints

#### Logging Endpoints
```typescript
// Log emergency event
POST /api/forensic/log
{
  eventType: 'incident_created' | 'decision_approved' | 'resource_allocated' | 'resolution_submitted',
  eventData: object,
  metadata?: object
}

// Verify blockchain hash
GET /api/forensic/verify/{eventId}

// Get forensic logs (role-based)
GET /api/forensic/logs?eventType=&startDate=&endDate=&limit=
```

#### Verification Endpoints
```typescript
// Verify event integrity
POST /api/forensic/verify-integrity
{
  eventId: string,
  expectedHash: string
}

// Generate forensic report
POST /api/forensic/generate-report
{
  incidentId: string,
  reportType: 'timeline' | 'decisions' | 'resources' | 'full'
}
```

### Security Measures

#### Encryption Strategy
- **AES-256-GCM** for sensitive data encryption
- **Role-based key management** with key rotation
- **Secure key derivation** from user roles and system secrets
- **Data at rest encryption** for all forensic logs

#### Access Logging
- All log access attempts recorded
- IP address and user agent tracking
- Geolocation verification for sensitive access
- Anomaly detection for unusual access patterns

#### Integrity Verification
- **Hash chain verification** for sequential log integrity
- **Merkle tree proofs** for batch verification
- **Digital signatures** for all log entries
- **Blockchain hash comparison** for tamper detection

### Deployment Configuration

#### Environment Variables
```bash
# Blockchain Configuration
BLOCKCHAIN_PROVIDER_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
SMART_CONTRACT_ADDRESS=0x...
PRIVATE_KEY_ENCRYPTED=...

# IPFS Configuration
IPFS_API_URL=https://ipfs.infura.io:5001
IPFS_GATEWAY_URL=https://gateway.ipfs.io

# Encryption Configuration
FORENSIC_ENCRYPTION_KEY=...
KEY_DERIVATION_SALT=...

# Logging Configuration
FORENSIC_LOG_RETENTION_DAYS=2555  # 7 years
BLOCKCHAIN_BATCH_SIZE=100
BLOCKCHAIN_SUBMIT_INTERVAL=86400  # 24 hours
```

#### Docker Configuration
```dockerfile
# Forensic logging service
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["node", "forensic-logger.js"]
```

### Performance Considerations

#### Batch Processing
- **Daily blockchain submissions** to minimize gas costs
- **Merkle tree batching** for efficient verification
- **Asynchronous processing** to avoid blocking main application
- **Queue management** for high-volume periods

#### Database Optimization
- **Partitioning** by date for large log volumes
- **Indexing strategy** for common query patterns
- **Archival policies** for old log data
- **Read replicas** for report generation

### Compliance and Legal

#### Data Retention
- **7-year retention** for emergency response logs
- **Automated archival** after retention period
- **Deletion policies** for personal data (GDPR compliance)
- **Export capabilities** for legal discovery

#### Audit Trail
- **Immutable blockchain record** of all critical events
- **Role-based access logs** for accountability
- **Integrity verification** for legal evidence
- **Chain of custody** documentation

### Monitoring and Alerting

#### System Health
- **Blockchain connection status** monitoring
- **IPFS node health** checking
- **Encryption service** availability
- **Database integrity** verification

#### Security Alerts
- **Unusual access patterns** detection
- **Failed integrity checks** alerting
- **Blockchain submission failures** notification
- **Encryption key rotation** reminders

### Future Enhancements

#### Advanced Features
- **AI-powered anomaly detection** in log patterns
- **Automated compliance reporting** generation
- **Cross-jurisdiction data sharing** protocols
- **Real-time integrity monitoring** dashboard

#### Integration Opportunities
- **Government blockchain networks** for official records
- **International emergency response** coordination
- **Insurance claim automation** through smart contracts
- **Legal discovery** API for court proceedings

This comprehensive forensic logging system ensures DisasterMng-1-OM9 maintains the highest standards of transparency, accountability, and legal compliance while providing robust tools for post-crisis analysis and improvement.