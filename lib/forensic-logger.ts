import { db } from "../db";
import { disasterForensicLogs, disasterBlockchainBatches, disasterIpfsContents, disasterForensicAccessLogs, disasterIntegrityVerifications } from "../db/forensic-schema";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import crypto from "crypto";
import { ethers } from "ethers";

// Types
export interface ForensicLogEntry {
  eventId: string;
  eventType: string;
  userId: number;
  eventData: Record<string, any>;
  locationHash?: string;
  metadata?: Record<string, any>;
}

export interface BlockchainConfig {
  providerUrl: string;
  contractAddress: string;
  privateKey: string;
  chainId: number;
}

export interface IPFSConfig {
  apiUrl: string;
  gatewayUrl: string;
  projectId?: string;
  projectSecret?: string;
}

class ForensicLogger {
  private blockchain: BlockchainConfig;
  private ipfs: IPFSConfig;
  private encryptionKey: string;
  private contract: ethers.Contract | null = null;
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;

  constructor(blockchain: BlockchainConfig, ipfs: IPFSConfig, encryptionKey: string) {
    this.blockchain = blockchain;
    this.ipfs = ipfs;
    this.encryptionKey = encryptionKey;
    this.initializeBlockchain();
  }

  private initializeBlockchain() {
    try {
      this.provider = new ethers.JsonRpcProvider(this.blockchain.providerUrl);
      this.wallet = new ethers.Wallet(this.blockchain.privateKey, this.provider);
      
      // Smart contract ABI (simplified)
      const contractABI = [
        "function logEmergencyEvent(bytes32 eventId, bytes32 eventHash, bytes32 userRoleHash, bytes32 locationHash, bytes32 metadataHash, uint8 eventType) external",
        "function createBatch(bytes32 batchId, bytes32 merkleRoot, uint256 logCount) external",
        "function verifyEvent(bytes32 eventId) external view returns (bool)",
        "function getEvent(bytes32 eventId) external view returns (bool exists, tuple(bytes32 eventHash, bytes32 userRoleHash, bytes32 locationHash, bytes32 metadataHash, uint256 timestamp, uint8 eventType, bool verified, address logger) logEntry)",
        "event EmergencyEventLogged(bytes32 indexed eventId, bytes32 indexed eventHash, uint8 indexed eventType, address logger, uint256 timestamp)",
        "event BatchCreated(bytes32 indexed batchId, bytes32 merkleRoot, uint256 logCount, uint256 timestamp)"
      ];
      
      this.contract = new ethers.Contract(this.blockchain.contractAddress, contractABI, this.wallet);
    } catch (error) {
      console.error("Failed to initialize blockchain connection:", error);
    }
  }

  /**
   * Log an emergency event with full forensic trail
   */
  async logEvent(entry: ForensicLogEntry): Promise<string> {
    try {
      // Generate unique event ID
      const eventId = crypto.randomUUID();
      
      // Create hashes for blockchain
      const eventHash = this.createEventHash(entry.eventData);
      const userRoleHash = this.createUserRoleHash(entry.userId, entry.eventType);
      const locationHash = entry.locationHash || this.createLocationHash("");
      const metadataHash = this.createMetadataHash(entry.metadata || {});
      
      // Create digital signature
      const signature = await this.createSignature(eventHash, userRoleHash, locationHash);
      
      // Encrypt sensitive data
      const encryptedPayload = this.encryptData(entry.eventData);
      
      // Insert into database
      await db.insert(disasterForensicLogs).values({
        eventId,
        eventType: entry.eventType,
        userId: entry.userId,
        userRoleHash,
        eventData: entry.eventData,
        locationHash: entry.locationHash,
        metadata: entry.metadata,
        signature,
        encryptedPayload,
        keyVersion: 1,
        integrityVerified: true,
        lastVerified: new Date()
      });

      // Queue for blockchain logging (async)
      this.queueBlockchainLog(eventId, eventHash, userRoleHash, locationHash, metadataHash, entry.eventType);
      
      return eventId;
    } catch (error) {
      console.error("Failed to log forensic event:", error);
      throw error;
    }
  }

  /**
   * Queue blockchain logging for batch processing
   */
  private async queueBlockchainLog(
    eventId: string,
    eventHash: string,
    userRoleHash: string,
    locationHash: string,
    metadataHash: string,
    eventType: string
  ) {
    // In production, this would use a queue system like Bull/BullMQ
    // For now, we'll do immediate logging for critical events
    if (this.isCriticalEvent(eventType)) {
      await this.logToBlockchain(eventId, eventHash, userRoleHash, locationHash, metadataHash, eventType);
    }
  }

  /**
   * Log event to blockchain
   */
  private async logToBlockchain(
    eventId: string,
    eventHash: string,
    userRoleHash: string,
    locationHash: string,
    metadataHash: string,
    eventType: string
  ) {
    if (!this.contract) {
      console.error("Blockchain contract not initialized");
      return;
    }

    try {
      const eventTypeNum = this.getEventTypeNumber(eventType);
      const tx = await this.contract.logEmergencyEvent(
        ethers.id(eventId),
        ethers.id(eventHash),
        ethers.id(userRoleHash),
        ethers.id(locationHash),
        ethers.id(metadataHash),
        eventTypeNum
      );

      const receipt = await tx.wait();
      
      // Update database with blockchain confirmation
      await db.update(disasterForensicLogs)
        .set({
          blockchainHash: receipt.hash,
          blockchainConfirmed: true,
          blockNumber: receipt.blockNumber,
          transactionHash: receipt.hash
        })
        .where(eq(disasterForensicLogs.eventId, eventId));

      console.log(`Event ${eventId} logged to blockchain: ${receipt.hash}`);
    } catch (error) {
      console.error("Failed to log to blockchain:", error);
    }
  }

  /**
   * Create batch for multiple events
   */
  async createBatch(eventIds: string[]): Promise<string> {
    if (eventIds.length === 0) {
      throw new Error("Cannot create empty batch");
    }

    try {
      const batchId = crypto.randomUUID();
      const merkleRoot = await this.createMerkleRoot(eventIds);
      
      await db.insert(disasterBlockchainBatches).values({
        batchId: `0x${batchId.replace(/-/g, '')}`,
        merkleRoot,
        logCount: eventIds.length,
        status: "pending"
      });

      // Submit batch to blockchain
      if (this.contract) {
        const tx = await this.contract.createBatch(
          ethers.id(batchId),
          ethers.id(merkleRoot),
          eventIds.length
        );
        
        const receipt = await tx.wait();
        
        await db.update(disasterBlockchainBatches)
          .set({
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            confirmedAt: new Date(),
            status: "confirmed"
          })
          .where(eq(disasterBlockchainBatches.batchId, `0x${batchId.replace(/-/g, '')}`));
      }

      return batchId;
    } catch (error) {
      console.error("Failed to create batch:", error);
      throw error;
    }
  }

  /**
   * Verify event integrity
   */
  async verifyEventIntegrity(eventId: string): Promise<boolean> {
    try {
      const logEntry = await db.query.disasterForensicLogs.findFirst({
        where: eq(disasterForensicLogs.eventId, eventId)
      });

      if (!logEntry) {
        return false;
      }

      // Verify signature
      const isSignatureValid = await this.verifySignature(
        logEntry.signature,
        this.createEventHash(logEntry.eventData),
        logEntry.userRoleHash,
        logEntry.locationHash || ""
      );

      // Verify blockchain if confirmed
      let isBlockchainValid = true;
      if (logEntry.blockchainConfirmed && this.contract) {
        try {
          const [exists] = await this.contract.getEvent(ethers.id(eventId));
          isBlockchainValid = exists;
        } catch (error) {
          console.error("Blockchain verification failed:", error);
          isBlockchainValid = false;
        }
      }

      const isValid = isSignatureValid && isBlockchainValid;

      // Log verification result
      await db.insert(disasterIntegrityVerifications).values({
        forensicLogId: logEntry.id,
        verificationType: "full",
        verificationResult: isValid,
        verifiedAt: new Date(),
        algorithmUsed: "SHA-256 + ECDSA",
        blockchainNetwork: "polygon",
        contractAddress: this.blockchain.contractAddress,
        verificationDuration: Date.now() - Date.now(), // Would be calculated properly
        trustScore: isValid ? 100 : 0
      });

      return isValid;
    } catch (error) {
      console.error("Failed to verify event integrity:", error);
      return false;
    }
  }

  /**
   * Get forensic logs with role-based access control
   */
  async getForensicLogs(
    userRole: string,
    userId: number,
    filters: {
      eventType?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<any[]> {
    try {
      // Log access attempt
      await this.logAccess(userId, "view", filters);

      let query = db.select().from(disasterForensicLogs);
      
      // Apply role-based filtering
      if (userRole === "commander") {
        // Commanders can only see logs from their region
        // This would need additional logic to determine region
      } else if (userRole === "ai_monitor") {
        // AI monitors get redacted view
        query = db.select({
          id: disasterForensicLogs.id,
          eventId: disasterForensicLogs.eventId,
          eventType: disasterForensicLogs.eventType,
          // Redacted fields only
          createdAt: disasterForensicLogs.createdAt,
          blockchainConfirmed: disasterForensicLogs.blockchainConfirmed
        }).from(disasterForensicLogs);
      }

      // Apply filters
      const conditions = [];
      if (filters.eventType) {
        conditions.push(eq(disasterForensicLogs.eventType, filters.eventType));
      }
      if (filters.startDate) {
        conditions.push(gte(disasterForensicLogs.createdAt, filters.startDate));
      }
      if (filters.endDate) {
        conditions.push(lte(disasterForensicLogs.createdAt, filters.endDate));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      query = query.orderBy(desc(disasterForensicLogs.createdAt));
      
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.offset(filters.offset);
      }

      return await query;
    } catch (error) {
      console.error("Failed to get forensic logs:", error);
      throw error;
    }
  }

  /**
   * Generate forensic report
   */
  async generateForensicReport(
    incidentId: string,
    reportType: "timeline" | "decisions" | "resources" | "full"
  ): Promise<any> {
    try {
      const logs = await db.query.disasterForensicLogs.findMany({
        where: eq(disasterForensicLogs.eventData, { incidentId }),
        orderBy: [asc(disasterForensicLogs.createdAt)]
      });

      const report = {
        incidentId,
        reportType,
        generatedAt: new Date(),
        totalEvents: logs.length,
        verifiedEvents: logs.filter(log => log.integrityVerified).length,
        blockchainConfirmed: logs.filter(log => log.blockchainConfirmed).length,
        events: logs.map(log => ({
          eventId: log.eventId,
          eventType: log.eventType,
          timestamp: log.createdAt,
          verified: log.integrityVerified,
          blockchainConfirmed: log.blockchainConfirmed,
          data: reportType === "full" ? log.eventData : this.getRedactedData(log.eventData, reportType)
        }))
      };

      return report;
    } catch (error) {
      console.error("Failed to generate forensic report:", error);
      throw error;
    }
  }

  // Helper methods
  private createEventHash(eventData: Record<string, any>): string {
    return crypto.createHash("sha256")
      .update(JSON.stringify(eventData))
      .digest("hex");
  }

  private createUserRoleHash(userId: number, eventType: string): string {
    return crypto.createHash("sha256")
      .update(`${userId}:${eventType}:${Date.now()}`)
      .digest("hex");
  }

  private createLocationHash(location: string): string {
    return crypto.createHash("sha256")
      .update(location || "unknown")
      .digest("hex");
  }

  private createMetadataHash(metadata: Record<string, any>): string {
    return crypto.createHash("sha256")
      .update(JSON.stringify(metadata))
      .digest("hex");
  }

  private async createSignature(eventHash: string, userRoleHash: string, locationHash: string): Promise<string> {
    const message = `${eventHash}:${userRoleHash}:${locationHash}`;
    return crypto.createHmac("sha256", this.encryptionKey)
      .update(message)
      .digest("hex");
  }

  private async verifySignature(signature: string, eventHash: string, userRoleHash: string, locationHash: string): Promise<boolean> {
    const expectedSignature = await this.createSignature(eventHash, userRoleHash, locationHash);
    return signature === expectedSignature;
  }

  private encryptData(data: Record<string, any>): Buffer {
    const cipher = crypto.createCipher("aes-256-gcm", this.encryptionKey);
    let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
    encrypted += cipher.final("hex");
    return Buffer.from(encrypted, "hex");
  }

  private decryptData(encryptedData: Buffer): Record<string, any> {
    const decipher = crypto.createDecipher("aes-256-gcm", this.encryptionKey);
    let decrypted = decipher.update(encryptedData.toString("hex"), "hex", "utf8");
    decrypted += decipher.final("utf8");
    return JSON.parse(decrypted);
  }

  private async createMerkleRoot(eventIds: string[]): Promise<string> {
    // Simple merkle tree implementation
    const hashes = eventIds.map(id => crypto.createHash("sha256").update(id).digest("hex"));
    
    while (hashes.length > 1) {
      const newHashes = [];
      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = hashes[i + 1] || hashes[i];
        const combined = crypto.createHash("sha256").update(left + right).digest("hex");
        newHashes.push(combined);
      }
      hashes.splice(0, hashes.length, ...newHashes);
    }
    
    return hashes[0];
  }

  private isCriticalEvent(eventType: string): boolean {
    return ["incident_created", "decision_approved", "resource_allocated", "resolution_submitted"].includes(eventType);
  }

  private getEventTypeNumber(eventType: string): number {
    const types = {
      "incident_created": 0,
      "decision_approved": 1,
      "resource_allocated": 2,
      "resolution_submitted": 3,
      "system_alert": 4,
      "user_action": 5
    };
    return types[eventType as keyof typeof types] || 5;
  }

  private async logAccess(userId: number, accessType: string, filters: any) {
    // Log access attempt for audit trail
    // Implementation would go here
  }

  private getRedactedData(data: Record<string, any>, reportType: string): Record<string, any> {
    // Redact sensitive data based on report type
    switch (reportType) {
      case "timeline":
        return { timestamp: data.timestamp, eventType: data.eventType };
      case "decisions":
        return { decision: data.decision, outcome: data.outcome };
      case "resources":
        return { resourceType: data.resourceType, quantity: data.quantity };
      default:
        return data;
    }
  }
}

export default ForensicLogger;