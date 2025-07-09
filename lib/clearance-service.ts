import { db } from "../db";
import { 
  disasterAccessControl, 
  disasterClearanceAudit, 
  disasterCompartments,
  disasterRedactionRules,
  disasterEmergencyOverrides,
  disasterSecurityIncidents 
} from "../db/clearance-schema";
import { eq, and, or, desc, asc, gte, lte } from "drizzle-orm";

export interface UserClearance {
  userId: number;
  clearanceLevel: number;
  compartments: string[];
  temporaryAccess?: boolean;
  expiresAt?: Date;
}

export interface ClassificationConfig {
  level: number;
  compartments: string[];
  source: string;
  redactionLevel: number;
}

export interface AccessRequest {
  userId: number;
  resourceType: string;
  resourceId: string;
  action: string;
  classification: number;
  compartments?: string[];
}

export interface RedactionRule {
  pattern: RegExp;
  replacement: string;
  threshold: number;
  field: string;
}

class ClearanceService {
  // Clearance level mappings
  static readonly CLEARANCE_LEVELS = {
    UNCLASSIFIED: 1,
    RESTRICTED: 2,
    SECRET: 3,
    TOP_SECRET: 4,
    FORENSIC_ONLY: 5
  };

  static readonly ROLE_CLEARANCES = {
    responder: 2,
    commander: 3,
    admin: 4,
    ai_monitor: 2,
    forensic_analyst: 5,
    national_admin: 4
  };

  /**
   * Get user's current clearance level and compartments
   */
  static async getUserClearance(userId: number): Promise<UserClearance | null> {
    try {
      // Check for emergency overrides first
      const override = await db.query.disasterEmergencyOverrides.findFirst({
        where: and(
          eq(disasterEmergencyOverrides.userId, userId),
          eq(disasterEmergencyOverrides.status, "active"),
          gte(disasterEmergencyOverrides.validUntil, new Date())
        )
      });

      if (override) {
        return {
          userId,
          clearanceLevel: override.overrideClearance,
          compartments: [], // Emergency override grants full compartment access
          temporaryAccess: true,
          expiresAt: override.validUntil
        };
      }

      // Get regular clearance
      const clearance = await db.query.disasterAccessControl.findFirst({
        where: and(
          eq(disasterAccessControl.userId, userId),
          eq(disasterAccessControl.active, true),
          or(
            eq(disasterAccessControl.expiresAt, null),
            gte(disasterAccessControl.expiresAt, new Date())
          )
        ),
        orderBy: [desc(disasterAccessControl.clearanceLevel)]
      });

      if (!clearance) {
        return null;
      }

      return {
        userId,
        clearanceLevel: clearance.clearanceLevel,
        compartments: clearance.compartments as string[],
        temporaryAccess: false,
        expiresAt: clearance.expiresAt || undefined
      };
    } catch (error) {
      console.error("Failed to get user clearance:", error);
      return null;
    }
  }

  /**
   * Check if user has required clearance for access
   */
  static async hasAccess(
    userId: number, 
    requiredLevel: number, 
    requiredCompartments: string[] = []
  ): Promise<boolean> {
    const userClearance = await this.getUserClearance(userId);
    
    if (!userClearance) {
      return false;
    }

    // Check clearance level
    if (userClearance.clearanceLevel < requiredLevel) {
      return false;
    }

    // Check compartment access
    if (requiredCompartments.length > 0 && !userClearance.temporaryAccess) {
      const hasAllCompartments = requiredCompartments.every(compartment => 
        userClearance.compartments.includes(compartment)
      );
      
      if (!hasAllCompartments) {
        return false;
      }
    }

    return true;
  }

  /**
   * Log access attempt for audit trail
   */
  static async logAccess(request: AccessRequest, granted: boolean, reason?: string): Promise<void> {
    try {
      const userClearance = await this.getUserClearance(request.userId);
      
      await db.insert(disasterClearanceAudit).values({
        userId: request.userId,
        action: request.action,
        resourceType: request.resourceType,
        resourceId: request.resourceId,
        classificationAccessed: request.classification,
        userClearanceLevel: userClearance?.clearanceLevel || 0,
        compartmentAccessed: request.compartments?.[0],
        accessGranted: granted,
        reason,
        riskScore: this.calculateRiskScore(request, userClearance, granted)
      });

      // Check for anomalies
      await this.checkForAnomalies(request.userId);
    } catch (error) {
      console.error("Failed to log access:", error);
    }
  }

  /**
   * Apply data redaction based on user clearance
   */
  static async redactData(data: any, userClearance: UserClearance): Promise<any> {
    try {
      const redactionRules = await db.query.disasterRedactionRules.findMany({
        where: and(
          eq(disasterRedactionRules.active, true),
          gte(disasterRedactionRules.classificationThreshold, userClearance.clearanceLevel)
        ),
        orderBy: [desc(disasterRedactionRules.priority)]
      });

      let redactedData = JSON.parse(JSON.stringify(data)); // Deep clone

      for (const rule of redactionRules) {
        redactedData = this.applyRedactionRule(redactedData, rule);
      }

      return redactedData;
    } catch (error) {
      console.error("Failed to redact data:", error);
      return data; // Return original data if redaction fails
    }
  }

  /**
   * Apply specific redaction rule to data
   */
  static applyRedactionRule(data: any, rule: any): any {
    const applyToValue = (value: any): any => {
      if (typeof value === 'string') {
        const regex = new RegExp(rule.redactionPattern, 'gi');
        return value.replace(regex, rule.replacementText);
      } else if (typeof value === 'object' && value !== null) {
        return this.applyRedactionRule(value, rule);
      }
      return value;
    };

    if (Array.isArray(data)) {
      return data.map(item => applyToValue(item));
    } else if (typeof data === 'object' && data !== null) {
      const redacted: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (key === rule.targetField || rule.targetField === '*') {
          redacted[key] = applyToValue(value);
        } else {
          redacted[key] = value;
        }
      }
      return redacted;
    }
    
    return data;
  }

  /**
   * Filter array data based on user clearance
   */
  static async filterDataByClassification(
    data: any[], 
    userClearance: UserClearance,
    classificationField: string = 'classification_level',
    compartmentField: string = 'compartment_tags'
  ): Promise<any[]> {
    return data.filter(item => {
      const itemClassification = item[classificationField] || 1;
      const itemCompartments = item[compartmentField] || [];

      // Check clearance level
      if (itemClassification > userClearance.clearanceLevel) {
        return false;
      }

      // Check compartment access (skip for temporary access)
      if (itemCompartments.length > 0 && !userClearance.temporaryAccess) {
        const hasAccess = itemCompartments.some((compartment: string) => 
          userClearance.compartments.includes(compartment)
        );
        if (!hasAccess) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Grant emergency clearance override
   */
  static async grantEmergencyOverride(
    userId: number,
    overrideClearance: number,
    reason: string,
    authorizedBy: number,
    incidentId?: number,
    validHours: number = 24
  ): Promise<string> {
    try {
      const userClearance = await this.getUserClearance(userId);
      const authorizationCode = this.generateAuthorizationCode();
      
      await db.insert(disasterEmergencyOverrides).values({
        userId,
        originalClearance: userClearance?.clearanceLevel || 1,
        overrideClearance,
        overrideReason: reason,
        incidentId,
        authorizedBy,
        authorizationCode,
        validUntil: new Date(Date.now() + validHours * 60 * 60 * 1000),
        status: "active"
      });

      // Log the override grant
      await this.logAccess({
        userId,
        resourceType: "clearance_override",
        resourceId: authorizationCode,
        action: "grant",
        classification: overrideClearance
      }, true, `Emergency override granted: ${reason}`);

      return authorizationCode;
    } catch (error) {
      console.error("Failed to grant emergency override:", error);
      throw error;
    }
  }

  /**
   * Revoke emergency clearance override
   */
  static async revokeEmergencyOverride(
    authorizationCode: string,
    revokedBy: number,
    reason: string
  ): Promise<void> {
    try {
      await db.update(disasterEmergencyOverrides)
        .set({
          status: "revoked",
          revokedBy,
          revokedAt: new Date(),
          revokeReason: reason
        })
        .where(eq(disasterEmergencyOverrides.authorizationCode, authorizationCode));
    } catch (error) {
      console.error("Failed to revoke emergency override:", error);
      throw error;
    }
  }

  /**
   * Check for suspicious access patterns
   */
  static async checkForAnomalies(userId: number): Promise<void> {
    try {
      const recentAccess = await db.query.disasterClearanceAudit.findMany({
        where: and(
          eq(disasterClearanceAudit.userId, userId),
          gte(disasterClearanceAudit.createdAt, new Date(Date.now() - 60 * 60 * 1000)) // Last hour
        )
      });

      const anomalies: string[] = [];

      // High-frequency access
      if (recentAccess.length > 50) {
        anomalies.push("HIGH_FREQUENCY_ACCESS");
      }

      // Multiple failed access attempts
      const failedAttempts = recentAccess.filter(access => !access.accessGranted);
      if (failedAttempts.length > 10) {
        anomalies.push("MULTIPLE_FAILED_ATTEMPTS");
      }

      // Access to multiple high-classification resources
      const highClassAccess = recentAccess.filter(access => access.classificationAccessed >= 3);
      if (highClassAccess.length > 20) {
        anomalies.push("HIGH_CLASSIFICATION_PATTERN");
      }

      // Create security incident if anomalies detected
      if (anomalies.length > 0) {
        await db.insert(disasterSecurityIncidents).values({
          incidentType: "unauthorized_access",
          severity: anomalies.length > 2 ? "high" : "medium",
          userId,
          description: `Anomalous access pattern detected: ${anomalies.join(", ")}`,
          affectedResources: [{ userId, anomalies }],
          investigationStatus: "open"
        });
      }
    } catch (error) {
      console.error("Failed to check for anomalies:", error);
    }
  }

  /**
   * Calculate risk score for access attempt
   */
  static calculateRiskScore(
    request: AccessRequest, 
    userClearance: UserClearance | null, 
    granted: boolean
  ): number {
    let riskScore = 0;

    // Base risk from classification level
    riskScore += request.classification * 10;

    // Penalty for denied access
    if (!granted) {
      riskScore += 30;
    }

    // Penalty for clearance mismatch
    if (userClearance && request.classification > userClearance.clearanceLevel) {
      riskScore += (request.classification - userClearance.clearanceLevel) * 20;
    }

    // Penalty for sensitive actions
    if (['delete', 'export', 'download'].includes(request.action)) {
      riskScore += 15;
    }

    return Math.min(riskScore, 100);
  }

  /**
   * Generate unique authorization code for emergency overrides
   */
  static generateAuthorizationCode(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `EMG-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Get clearance level name
   */
  static getClearanceLevelName(level: number): string {
    const levels = {
      1: "UNCLASSIFIED",
      2: "RESTRICTED", 
      3: "SECRET",
      4: "TOP SECRET",
      5: "FORENSIC ONLY"
    };
    return levels[level as keyof typeof levels] || "UNKNOWN";
  }

  /**
   * Get clearance color for UI
   */
  static getClearanceColor(level: number): { bg: string; text: string } {
    const colors = {
      1: { bg: "bg-green-500", text: "text-white" },
      2: { bg: "bg-yellow-500", text: "text-black" },
      3: { bg: "bg-orange-500", text: "text-white" },
      4: { bg: "bg-red-500", text: "text-white" },
      5: { bg: "bg-purple-500", text: "text-white" }
    };
    return colors[level as keyof typeof colors] || colors[1];
  }

  /**
   * Initialize default clearance data
   */
  static async initializeDefaultClearances(): Promise<void> {
    try {
      // Insert default clearance tags
      const defaultTags = [
        { tagName: 'unclassified', clearanceLevel: 1, description: 'Public information', colorCode: '#28a745' },
        { tagName: 'restricted', clearanceLevel: 2, description: 'Internal use only', colorCode: '#ffc107' },
        { tagName: 'secret', clearanceLevel: 3, description: 'Sensitive operational data', colorCode: '#fd7e14' },
        { tagName: 'top_secret', clearanceLevel: 4, description: 'Critical national security', colorCode: '#dc3545' },
        { tagName: 'forensic_only', clearanceLevel: 5, description: 'Investigation data only', colorCode: '#6f42c1' }
      ];

      // Insert default compartments
      const defaultCompartments = [
        { name: 'zone_alpha', description: 'Western Cape Operations', compartmentType: 'geographic', requiredClearance: 2 },
        { name: 'zone_bravo', description: 'Gauteng/High Risk Areas', compartmentType: 'geographic', requiredClearance: 3 },
        { name: 'zone_charlie', description: 'Rural Operations', compartmentType: 'geographic', requiredClearance: 2 },
        { name: 'zone_delta', description: 'Border Operations', compartmentType: 'geographic', requiredClearance: 3 },
        { name: 'ai_training', description: 'AI Training Data', compartmentType: 'functional', requiredClearance: 2 },
        { name: 'forensic_investigation', description: 'Investigation Data', compartmentType: 'functional', requiredClearance: 5 }
      ];

      // Insert default redaction rules
      const defaultRedactionRules = [
        {
          ruleName: 'personal_names',
          targetField: '*',
          classificationThreshold: 3,
          redactionPattern: '\\b[A-Z][a-z]+\\s+[A-Z][a-z]+\\b',
          replacementText: '[INDIVIDUAL]',
          ruleType: 'regex',
          priority: 10
        },
        {
          ruleName: 'addresses',
          targetField: '*',
          classificationThreshold: 3,
          redactionPattern: '\\b\\d{1,5}\\s+[A-Za-z\\s]+(?:Street|St|Avenue|Ave|Road|Rd)\\b',
          replacementText: '[LOCATION]',
          ruleType: 'regex',
          priority: 9
        },
        {
          ruleName: 'coordinates',
          targetField: '*',
          classificationThreshold: 2,
          redactionPattern: '-?\\d+\\.\\d+,\\s*-?\\d+\\.\\d+',
          replacementText: '[COORDINATES]',
          ruleType: 'regex',
          priority: 8
        }
      ];

      console.log("Default clearance data initialized");
    } catch (error) {
      console.error("Failed to initialize default clearance data:", error);
    }
  }
}

export default ClearanceService;