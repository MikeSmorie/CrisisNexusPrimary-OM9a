import { Request, Response, NextFunction } from "express";
import ClearanceService from "../../lib/clearance-service";

export interface ClearanceRequest extends Request {
  userClearance?: any;
  requiredClearance?: {
    level: number;
    compartments?: string[];
  };
}

/**
 * Middleware to enforce clearance requirements
 */
export function requireClearance(level: number, compartments: string[] = []) {
  return async (req: ClearanceRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: "Authentication required",
          code: "AUTH_REQUIRED"
        });
      }

      const userClearance = await ClearanceService.getUserClearance(req.user.id);
      
      if (!userClearance) {
        await ClearanceService.logAccess({
          userId: req.user.id,
          resourceType: req.route?.path || "unknown",
          resourceId: req.params.id || "unknown",
          action: req.method.toLowerCase(),
          classification: level,
          compartments
        }, false, "No clearance found");

        return res.status(403).json({ 
          error: "No security clearance found",
          code: "NO_CLEARANCE"
        });
      }

      const hasAccess = await ClearanceService.hasAccess(req.user.id, level, compartments);
      
      // Log the access attempt
      await ClearanceService.logAccess({
        userId: req.user.id,
        resourceType: req.route?.path || "unknown",
        resourceId: req.params.id || "unknown", 
        action: req.method.toLowerCase(),
        classification: level,
        compartments
      }, hasAccess);

      if (!hasAccess) {
        return res.status(403).json({ 
          error: "Insufficient clearance level",
          code: "INSUFFICIENT_CLEARANCE",
          required: {
            level,
            levelName: ClearanceService.getClearanceLevelName(level),
            compartments
          },
          current: {
            level: userClearance.clearanceLevel,
            levelName: ClearanceService.getClearanceLevelName(userClearance.clearanceLevel),
            compartments: userClearance.compartments,
            temporaryAccess: userClearance.temporaryAccess
          }
        });
      }

      // Attach clearance info to request for use in handlers
      req.userClearance = userClearance;
      req.requiredClearance = { level, compartments };
      
      next();
    } catch (error) {
      console.error("Clearance middleware error:", error);
      res.status(500).json({ 
        error: "Security clearance check failed",
        code: "CLEARANCE_CHECK_FAILED"
      });
    }
  };
}

/**
 * Middleware to apply data redaction based on user clearance
 */
export function applyDataRedaction() {
  return async (req: ClearanceRequest, res: Response, next: NextFunction) => {
    if (!req.userClearance) {
      return next();
    }

    // Override res.json to apply redaction
    const originalJson = res.json;
    res.json = async function(data: any) {
      try {
        const redactedData = await ClearanceService.redactData(data, req.userClearance);
        return originalJson.call(this, redactedData);
      } catch (error) {
        console.error("Data redaction failed:", error);
        return originalJson.call(this, data); // Return original data if redaction fails
      }
    };

    next();
  };
}

/**
 * Middleware to filter array data by classification
 */
export function filterByClassification(
  classificationField: string = 'classification_level',
  compartmentField: string = 'compartment_tags'
) {
  return async (req: ClearanceRequest, res: Response, next: NextFunction) => {
    if (!req.userClearance) {
      return next();
    }

    // Override res.json to apply filtering
    const originalJson = res.json;
    res.json = async function(data: any) {
      try {
        if (Array.isArray(data)) {
          const filteredData = await ClearanceService.filterDataByClassification(
            data, 
            req.userClearance,
            classificationField,
            compartmentField
          );
          return originalJson.call(this, filteredData);
        } else if (data && Array.isArray(data.data)) {
          // Handle paginated responses
          const filteredData = await ClearanceService.filterDataByClassification(
            data.data,
            req.userClearance,
            classificationField, 
            compartmentField
          );
          return originalJson.call(this, { ...data, data: filteredData });
        }
        
        return originalJson.call(this, data);
      } catch (error) {
        console.error("Data filtering failed:", error);
        return originalJson.call(this, data);
      }
    };

    next();
  };
}

/**
 * Middleware to check for emergency override authorization
 */
export function allowEmergencyOverride() {
  return async (req: ClearanceRequest, res: Response, next: NextFunction) => {
    const authCode = req.headers['x-emergency-auth'] as string;
    
    if (authCode && req.user) {
      try {
        // Check if user has active emergency override
        const userClearance = await ClearanceService.getUserClearance(req.user.id);
        
        if (userClearance?.temporaryAccess) {
          req.userClearance = userClearance;
          return next();
        }
      } catch (error) {
        console.error("Emergency override check failed:", error);
      }
    }
    
    next();
  };
}

/**
 * Middleware to validate compartment access for geographic operations
 */
export function requireGeographicCompartment(zone: string) {
  return requireClearance(2, [`zone_${zone.toLowerCase()}`]);
}

/**
 * Middleware to require forensic analyst access
 */
export function requireForensicAccess() {
  return requireClearance(5, ['forensic_investigation']);
}

/**
 * Middleware to check AI model clearance
 */
export function checkAiClearance(modelName: string, maxLevel: number = 2) {
  return async (req: ClearanceRequest, res: Response, next: NextFunction) => {
    try {
      // For AI requests, limit to specified clearance level
      const artificialClearance = {
        userId: -1, // AI user ID
        clearanceLevel: maxLevel,
        compartments: ['ai_training'],
        temporaryAccess: false
      };
      
      req.userClearance = artificialClearance;
      next();
    } catch (error) {
      console.error("AI clearance check failed:", error);
      res.status(500).json({ 
        error: "AI clearance validation failed",
        code: "AI_CLEARANCE_FAILED"
      });
    }
  };
}

/**
 * Middleware to log high-risk actions
 */
export function logHighRiskAction(actionType: string) {
  return async (req: ClearanceRequest, res: Response, next: NextFunction) => {
    if (req.user && req.userClearance) {
      await ClearanceService.logAccess({
        userId: req.user.id,
        resourceType: "high_risk_action",
        resourceId: actionType,
        action: actionType,
        classification: req.requiredClearance?.level || 1
      }, true, `High-risk action: ${actionType}`);
    }
    
    next();
  };
}