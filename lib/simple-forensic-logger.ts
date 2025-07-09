import { db } from "../db";
import { disasterForensicLogs, disasterBlockchainBatches, disasterIntegrityVerifications } from "../db/forensic-schema";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import crypto from "crypto";

// Types
export interface ForensicLogEntry {
  eventId: string;
  eventType: string;
  userId: number;
  eventData: Record<string, any>;
  locationHash?: string;
  metadata?: Record<string, any>;
}

class SimpleForensicLogger {
  private encryptionKey: string;

  constructor(encryptionKey: string = "default-key-change-in-production") {
    this.encryptionKey = encryptionKey;
  }

  /**
   * Log an emergency event with forensic trail
   */
  async logEvent(entry: ForensicLogEntry): Promise<string> {
    try {
      // Generate unique event ID
      const eventId = crypto.randomUUID();
      
      // Create hashes for audit trail
      const eventHash = this.createEventHash(entry.eventData);
      const userRoleHash = this.createUserRoleHash(entry.userId, entry.eventType);
      const locationHash = entry.locationHash || this.createLocationHash("");
      
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
      
      return eventId;
    } catch (error) {
      console.error("Failed to log forensic event:", error);
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

      // Log verification result
      await db.insert(disasterIntegrityVerifications).values({
        forensicLogId: logEntry.id,
        verificationType: "signature",
        verificationResult: isSignatureValid,
        verifiedAt: new Date(),
        algorithmUsed: "SHA-256 + HMAC",
        verificationDuration: Date.now() - Date.now(),
        trustScore: isSignatureValid ? 100 : 0
      });

      return isSignatureValid;
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
    const cipher = crypto.createCipher("aes-256-cbc", this.encryptionKey);
    let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
    encrypted += cipher.final("hex");
    return Buffer.from(encrypted, "hex");
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

export default SimpleForensicLogger;