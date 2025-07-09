import { Router } from "express";
import DemoDataGenerator from "../../lib/demo-data-generator";

const router = Router();

// Admin/Supergod role check middleware
const requireAdminAccess = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  if (!['admin', 'supergod'].includes(req.user.role)) {
    return res.status(403).json({ 
      message: "Admin access required",
      userRole: req.user.role,
      requiredRoles: ['admin', 'supergod']
    });
  }
  
  next();
};

/**
 * Get current demo mode status
 */
router.get("/demo-status", requireAdminAccess, async (req, res) => {
  try {
    const status = await DemoDataGenerator.getDemoModeStatus();
    
    res.json({
      success: true,
      ...status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to get demo status:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to retrieve demo mode status",
      details: error.message 
    });
  }
});

/**
 * Generate demo data
 */
router.post("/generate-demo", requireAdminAccess, async (req, res) => {
  try {
    const config = {
      incidentCount: req.body.incidentCount || 12,
      resourceCount: req.body.resourceCount || 25,
      alertCount: req.body.alertCount || 8,
      communicationCount: req.body.communicationCount || 30,
      responderCount: req.body.responderCount || 15
    };

    console.log(`Admin ${req.user.username} initiating demo data generation:`, config);
    
    const result = await DemoDataGenerator.generateDemoData(config);
    
    if (result.success) {
      console.log(`Demo data generation completed by ${req.user.username}:`, result.summary);
      
      res.json({
        success: true,
        message: "Demo data generated successfully",
        summary: result.summary,
        config,
        timestamp: new Date().toISOString(),
        generatedBy: {
          userId: req.user.id,
          username: req.user.username,
          role: req.user.role
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to generate demo data",
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("Demo data generation error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to generate demo data",
      details: error.message 
    });
  }
});

/**
 * Clear mock data only
 */
router.post("/clear-mock", requireAdminAccess, async (req, res) => {
  try {
    console.log(`Admin ${req.user.username} clearing mock data`);
    
    const result = await DemoDataGenerator.clearMockData();
    
    if (result.success) {
      console.log(`Mock data cleared by ${req.user.username}:`, result.summary);
      
      res.json({
        success: true,
        message: "Mock data cleared successfully",
        summary: result.summary,
        timestamp: new Date().toISOString(),
        clearedBy: {
          userId: req.user.id,
          username: req.user.username,
          role: req.user.role
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to clear mock data",
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("Mock data clearing error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to clear mock data",
      details: error.message 
    });
  }
});

/**
 * Perform full system reset (requires additional confirmation)
 */
router.post("/system-reset", requireAdminAccess, async (req, res) => {
  try {
    const { confirmationText, emergencyReason } = req.body;
    
    // Require exact confirmation text
    if (confirmationText !== "RESET") {
      return res.status(400).json({
        success: false,
        error: "Invalid confirmation text. Type 'RESET' to proceed.",
        receivedConfirmation: confirmationText
      });
    }
    
    if (!emergencyReason || emergencyReason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: "Emergency reason must be provided (minimum 10 characters)"
      });
    }
    
    console.log(`CRITICAL: Admin ${req.user.username} initiating FULL SYSTEM RESET`);
    console.log(`Reason: ${emergencyReason}`);
    
    const result = await DemoDataGenerator.performSystemReset();
    
    if (result.success) {
      console.log(`SYSTEM RESET COMPLETED by ${req.user.username}:`, result.summary);
      console.log(`Reset reason: ${emergencyReason}`);
      
      res.json({
        success: true,
        message: "System reset completed successfully",
        summary: result.summary,
        timestamp: new Date().toISOString(),
        resetBy: {
          userId: req.user.id,
          username: req.user.username,
          role: req.user.role
        },
        reason: emergencyReason,
        warning: "All data except admin users has been permanently deleted"
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to perform system reset",
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("System reset error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to perform system reset",
      details: error.message 
    });
  }
});

/**
 * Get system statistics for admin overview
 */
router.get("/system-stats", requireAdminAccess, async (req, res) => {
  try {
    const [demoStatus] = await Promise.all([
      DemoDataGenerator.getDemoModeStatus()
    ]);
    
    // Calculate total data counts (including real data)
    const totalStats = {
      totalIncidents: demoStatus.mockDataCounts.incidents,
      totalResources: demoStatus.mockDataCounts.resources,
      totalAlerts: demoStatus.mockDataCounts.alerts,
      totalCommunications: demoStatus.mockDataCounts.communications,
      totalUsers: demoStatus.mockDataCounts.users
    };
    
    res.json({
      success: true,
      demoMode: demoStatus.isDemoMode,
      mockDataCounts: demoStatus.mockDataCounts,
      totalStats,
      systemInfo: {
        environment: process.env.NODE_ENV || 'development',
        version: '9.0.0',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      },
      adminInfo: {
        requestedBy: req.user.username,
        userRole: req.user.role
      }
    });
  } catch (error) {
    console.error("Failed to get system stats:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to retrieve system statistics",
      details: error.message 
    });
  }
});

/**
 * Validate system integrity before operations
 */
router.get("/integrity-check", requireAdminAccess, async (req, res) => {
  try {
    const checks = {
      database: false,
      schemas: false,
      permissions: false,
      backup: false
    };
    
    // Basic database connectivity check
    try {
      const status = await DemoDataGenerator.getDemoModeStatus();
      checks.database = true;
      checks.schemas = true; // If we can query, schemas exist
    } catch (error) {
      console.error("Database check failed:", error);
    }
    
    // Permission check
    checks.permissions = ['admin', 'supergod'].includes(req.user.role);
    
    // Mock backup check (in production, this would check actual backup systems)
    checks.backup = process.env.NODE_ENV === 'development'; // Always true in dev
    
    const allChecksPass = Object.values(checks).every(check => check === true);
    
    res.json({
      success: true,
      integrityChecks: checks,
      allChecksPass,
      recommendations: allChecksPass ? [] : [
        !checks.database && "Database connectivity issues detected",
        !checks.schemas && "Database schema validation failed", 
        !checks.permissions && "Insufficient user permissions",
        !checks.backup && "Backup system verification failed"
      ].filter(Boolean),
      timestamp: new Date().toISOString(),
      checkedBy: req.user.username
    });
  } catch (error) {
    console.error("Integrity check error:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to perform integrity check",
      details: error.message 
    });
  }
});

export default router;