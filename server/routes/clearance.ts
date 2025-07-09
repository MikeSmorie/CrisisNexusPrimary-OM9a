import { Router } from "express";
import { eq, desc, and, gte } from "drizzle-orm";

const router = Router();

// Simple auth middleware (using passport session)
const requireAuth = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Not authenticated" });
};

// Mock data for testing the clearance management interface
const mockUserClearances = [
  {
    id: 1,
    userId: 1,
    userName: "Emergency1",
    userRole: "responder", 
    clearanceLevel: 2,
    compartments: ["zone_alpha"],
    grantedAt: new Date().toISOString(),
    active: true,
    temporaryAccess: false
  },
  {
    id: 2,
    userId: 2,
    userName: "Commander1", 
    userRole: "commander",
    clearanceLevel: 3,
    compartments: ["zone_alpha", "zone_bravo"],
    grantedAt: new Date().toISOString(),
    active: true,
    temporaryAccess: false
  },
  {
    id: 3,
    userId: 4,
    userName: "admin",
    userRole: "admin",
    clearanceLevel: 4,
    compartments: ["zone_alpha", "zone_bravo", "zone_charlie", "zone_delta"],
    grantedAt: new Date().toISOString(),
    active: true,
    temporaryAccess: false
  }
];

const mockSecurityIncidents = [
  {
    id: 1,
    incidentType: "unauthorized_access",
    severity: "medium",
    userId: 1,
    userName: "Emergency1",
    description: "Attempted access to SECRET level document without proper clearance",
    createdAt: new Date().toISOString(),
    investigationStatus: "open"
  },
  {
    id: 2,
    incidentType: "clearance_violation",
    severity: "high", 
    userId: 2,
    userName: "Commander1",
    description: "Accessed TOP SECRET compartment outside authorized zone",
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    investigationStatus: "in_progress"
  }
];

const mockEmergencyOverrides = [
  {
    id: 1,
    userId: 1,
    userName: "Emergency1",
    originalClearance: 2,
    overrideClearance: 3,
    reason: "Critical fire incident requiring SECRET level resource access",
    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    authorizationCode: "EMG-ABC123",
    authorizedBy: 4,
    createdAt: new Date().toISOString()
  }
];

const mockAuditLogs = [
  {
    id: 1,
    userId: 1,
    userName: "Emergency1",
    action: "view",
    resourceType: "incident",
    resourceId: "INC-001",
    classificationAccessed: 2,
    userClearanceLevel: 2,
    accessGranted: true,
    createdAt: new Date().toISOString(),
    riskScore: 10
  },
  {
    id: 2,
    userId: 1,
    userName: "Emergency1", 
    action: "view",
    resourceType: "resource",
    resourceId: "RES-001",
    classificationAccessed: 3,
    userClearanceLevel: 2,
    accessGranted: false,
    reason: "Insufficient clearance level",
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    riskScore: 45
  }
];

// Get all user clearances
router.get("/users", requireAuth, async (req, res) => {
  try {
    res.json(mockUserClearances);
  } catch (error) {
    console.error("Failed to get user clearances:", error);
    res.status(500).json({ error: "Failed to retrieve user clearances" });
  }
});

// Get security incidents  
router.get("/incidents", requireAuth, async (req, res) => {
  try {
    const { severity, status, limit = 50, offset = 0 } = req.query;
    
    let filteredIncidents = mockSecurityIncidents;
    
    if (severity) {
      filteredIncidents = filteredIncidents.filter(incident => incident.severity === severity);
    }
    
    if (status) {
      filteredIncidents = filteredIncidents.filter(incident => incident.investigationStatus === status);
    }

    const paginatedIncidents = filteredIncidents.slice(
      parseInt(offset as string),
      parseInt(offset as string) + parseInt(limit as string)
    );

    res.json({
      incidents: paginatedIncidents,
      total: filteredIncidents.length,
      filters: { severity, status, limit, offset }
    });
  } catch (error) {
    console.error("Failed to get security incidents:", error);
    res.status(500).json({ error: "Failed to retrieve security incidents" });
  }
});

// Get emergency overrides
router.get("/overrides", requireAuth, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    
    let filteredOverrides = mockEmergencyOverrides;
    
    if (status) {
      filteredOverrides = filteredOverrides.filter(override => override.status === status);
    }

    const paginatedOverrides = filteredOverrides.slice(
      parseInt(offset as string),
      parseInt(offset as string) + parseInt(limit as string) 
    );

    res.json({
      overrides: paginatedOverrides,
      total: filteredOverrides.length,
      filters: { status, limit, offset }
    });
  } catch (error) {
    console.error("Failed to get emergency overrides:", error);
    res.status(500).json({ error: "Failed to retrieve emergency overrides" });
  }
});

// Get audit trail
router.get("/audit", requireAuth, async (req, res) => {
  try {
    const { userId, action, resourceType, limit = 100, offset = 0 } = req.query;
    
    let filteredLogs = mockAuditLogs;
    
    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === parseInt(userId as string));
    }
    
    if (action) {
      filteredLogs = filteredLogs.filter(log => log.action === action);
    }
    
    if (resourceType) {
      filteredLogs = filteredLogs.filter(log => log.resourceType === resourceType);
    }

    const paginatedLogs = filteredLogs.slice(
      parseInt(offset as string),
      parseInt(offset as string) + parseInt(limit as string)
    );

    res.json({
      logs: paginatedLogs,
      total: filteredLogs.length,
      filters: { userId, action, resourceType, limit, offset }
    });
  } catch (error) {
    console.error("Failed to get audit logs:", error); 
    res.status(500).json({ error: "Failed to retrieve audit logs" });
  }
});

// Grant clearance
router.post("/grant", requireAuth, async (req, res) => {
  try {
    const { userId, clearanceLevel, compartments, justification, expiresAt } = req.body;

    if (!userId || !clearanceLevel || !justification) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate clearance level
    if (clearanceLevel < 1 || clearanceLevel > 5) {
      return res.status(400).json({ error: "Invalid clearance level" });
    }

    // Check if user has authority to grant this level
    const grantingUser = req.user;
    if (clearanceLevel >= 4 && grantingUser.role !== 'admin') {
      return res.status(403).json({ error: "Insufficient authority to grant this clearance level" });
    }

    // Create new clearance record (mock)
    const newClearance = {
      id: mockUserClearances.length + 1,
      userId: parseInt(userId),
      userName: `User${userId}`,
      userRole: "responder", // Would be fetched from user table
      clearanceLevel: parseInt(clearanceLevel),
      compartments: compartments || [],
      grantedAt: new Date().toISOString(),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      active: true,
      temporaryAccess: false,
      grantedBy: grantingUser.id,
      justification
    };

    mockUserClearances.push(newClearance);

    res.json({ 
      success: true, 
      clearance: newClearance,
      message: "Clearance granted successfully"
    });
  } catch (error) {
    console.error("Failed to grant clearance:", error);
    res.status(500).json({ error: "Failed to grant clearance" });
  }
});

// Grant emergency override
router.post("/emergency-override", requireAuth, async (req, res) => {
  try {
    const { userId, overrideClearance, reason, validHours, incidentId } = req.body;

    if (!userId || !overrideClearance || !reason) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Generate authorization code
    const authorizationCode = `EMG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Calculate expiry
    const validUntil = new Date(Date.now() + (parseInt(validHours) || 24) * 60 * 60 * 1000);
    
    // Get user's current clearance
    const currentClearance = mockUserClearances.find(c => c.userId === parseInt(userId));
    const originalClearance = currentClearance?.clearanceLevel || 1;

    // Create emergency override record (mock)
    const newOverride = {
      id: mockEmergencyOverrides.length + 1,
      userId: parseInt(userId),
      userName: currentClearance?.userName || `User${userId}`,
      originalClearance,
      overrideClearance: parseInt(overrideClearance),
      reason,
      validUntil: validUntil.toISOString(),
      status: "active",
      authorizationCode,
      authorizedBy: req.user.id,
      incidentId: incidentId ? parseInt(incidentId) : null,
      createdAt: new Date().toISOString()
    };

    mockEmergencyOverrides.push(newOverride);

    res.json({
      success: true,
      override: newOverride,
      authorizationCode,
      message: "Emergency override granted successfully"
    });
  } catch (error) {
    console.error("Failed to grant emergency override:", error);
    res.status(500).json({ error: "Failed to grant emergency override" });
  }
});

// Revoke clearance
router.post("/revoke/:clearanceId", requireAuth, async (req, res) => {
  try {
    const { clearanceId } = req.params;
    const { reason } = req.body;

    const clearanceIndex = mockUserClearances.findIndex(c => c.id === parseInt(clearanceId));
    
    if (clearanceIndex === -1) {
      return res.status(404).json({ error: "Clearance not found" });
    }

    // Deactivate clearance
    mockUserClearances[clearanceIndex].active = false;

    res.json({
      success: true,
      message: "Clearance revoked successfully"
    });
  } catch (error) {
    console.error("Failed to revoke clearance:", error);
    res.status(500).json({ error: "Failed to revoke clearance" });
  }
});

// Revoke emergency override
router.post("/revoke-override/:overrideId", requireAuth, async (req, res) => {
  try {
    const { overrideId } = req.params;
    const { reason } = req.body;

    const overrideIndex = mockEmergencyOverrides.findIndex(o => o.id === parseInt(overrideId));
    
    if (overrideIndex === -1) {
      return res.status(404).json({ error: "Override not found" });
    }

    // Revoke override
    mockEmergencyOverrides[overrideIndex].status = "revoked";
    mockEmergencyOverrides[overrideIndex].revokedAt = new Date().toISOString();
    mockEmergencyOverrides[overrideIndex].revokeReason = reason;

    res.json({
      success: true,
      message: "Emergency override revoked successfully"
    });
  } catch (error) {
    console.error("Failed to revoke emergency override:", error);
    res.status(500).json({ error: "Failed to revoke emergency override" });
  }
});

// Check user clearance
router.get("/check/:userId", requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check for active emergency override first
    const activeOverride = mockEmergencyOverrides.find(override => 
      override.userId === parseInt(userId) &&
      override.status === "active" &&
      new Date(override.validUntil) > new Date()
    );

    if (activeOverride) {
      return res.json({
        userId: parseInt(userId),
        clearanceLevel: activeOverride.overrideClearance,
        compartments: [], // Emergency override grants full access
        temporaryAccess: true,
        expiresAt: activeOverride.validUntil,
        authorizationCode: activeOverride.authorizationCode
      });
    }

    // Get regular clearance
    const clearance = mockUserClearances.find(c => 
      c.userId === parseInt(userId) && 
      c.active
    );

    if (!clearance) {
      return res.status(404).json({ error: "No clearance found for user" });
    }

    res.json({
      userId: clearance.userId,
      clearanceLevel: clearance.clearanceLevel,
      compartments: clearance.compartments,
      temporaryAccess: false,
      expiresAt: clearance.expiresAt
    });
  } catch (error) {
    console.error("Failed to check user clearance:", error);
    res.status(500).json({ error: "Failed to check clearance" });
  }
});

// Verify access
router.post("/verify-access", requireAuth, async (req, res) => {
  try {
    const { userId, requiredLevel, compartments = [] } = req.body;

    if (!userId || !requiredLevel) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get user clearance
    const userClearance = await getUserClearance(parseInt(userId));
    
    if (!userClearance) {
      return res.json({
        hasAccess: false,
        reason: "No clearance found"
      });
    }

    // Check clearance level
    if (userClearance.clearanceLevel < requiredLevel) {
      return res.json({
        hasAccess: false,
        reason: "Insufficient clearance level",
        required: requiredLevel,
        current: userClearance.clearanceLevel
      });
    }

    // Check compartments (skip for emergency overrides)
    if (compartments.length > 0 && !userClearance.temporaryAccess) {
      const hasAllCompartments = compartments.every((compartment: string) => 
        userClearance.compartments.includes(compartment)
      );
      
      if (!hasAllCompartments) {
        return res.json({
          hasAccess: false,
          reason: "Insufficient compartment access",
          requiredCompartments: compartments,
          currentCompartments: userClearance.compartments
        });
      }
    }

    res.json({
      hasAccess: true,
      clearanceLevel: userClearance.clearanceLevel,
      temporaryAccess: userClearance.temporaryAccess
    });
  } catch (error) {
    console.error("Failed to verify access:", error);
    res.status(500).json({ error: "Failed to verify access" });
  }
});

// Helper function to get user clearance (reused logic)
async function getUserClearance(userId: number) {
  // Check for active emergency override first
  const activeOverride = mockEmergencyOverrides.find(override => 
    override.userId === userId &&
    override.status === "active" &&
    new Date(override.validUntil) > new Date()
  );

  if (activeOverride) {
    return {
      userId,
      clearanceLevel: activeOverride.overrideClearance,
      compartments: [], // Emergency override grants full access
      temporaryAccess: true,
      expiresAt: new Date(activeOverride.validUntil)
    };
  }

  // Get regular clearance
  const clearance = mockUserClearances.find(c => 
    c.userId === userId && 
    c.active
  );

  if (!clearance) {
    return null;
  }

  return {
    userId: clearance.userId,
    clearanceLevel: clearance.clearanceLevel,
    compartments: clearance.compartments,
    temporaryAccess: false,
    expiresAt: clearance.expiresAt ? new Date(clearance.expiresAt) : null
  };
}

export default router;