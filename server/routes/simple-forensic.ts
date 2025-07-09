import { Router } from "express";
import { db } from "../db";
import { forensicLogs } from "../db/simple-forensic-schema";
import { eq, desc, count } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

// Simple auth middleware (using passport session)
const requireAuth = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Not authenticated" });
};

// Mock data for testing
const mockLogs = [
  {
    id: 1,
    eventId: "evt-001",
    eventType: "incident_created",
    userId: 1,
    eventData: { incident: "Fire at Building A", location: "Downtown" },
    createdAt: new Date(),
    blockchainConfirmed: true,
    blockchainHash: "0x123abc",
    integrityVerified: true,
    signature: "sig123"
  },
  {
    id: 2,
    eventId: "evt-002",
    eventType: "resource_allocated",
    userId: 2,
    eventData: { resource: "Fire Truck", quantity: 2 },
    createdAt: new Date(),
    blockchainConfirmed: false,
    integrityVerified: true,
    signature: "sig456"
  }
];

const mockBatches = [
  {
    id: 1,
    batchId: "batch-001",
    merkleRoot: "0x456def",
    logCount: 10,
    status: "confirmed",
    createdAt: new Date(),
    transactionHash: "0x789ghi",
    gasUsed: 21000
  }
];

const mockStats = {
  totalLogs: 25,
  verifiedLogs: 23,
  blockchainConfirmed: 18,
  totalBatches: 3,
  pendingBatches: 1,
  recentLogs: 5,
  verificationRate: 92.0,
  blockchainRate: 72.0
};

// Log emergency event
router.post("/log", requireAuth, async (req, res) => {
  try {
    const { eventType, eventData } = req.body;
    const userId = req.user.id;

    if (!eventType || !eventData) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const eventId = crypto.randomUUID();
    const signature = crypto.createHmac("sha256", "test-key")
      .update(JSON.stringify(eventData))
      .digest("hex");

    // For now, just return success without database insertion
    res.json({ 
      success: true, 
      eventId,
      message: "Event logged successfully"
    });
  } catch (error) {
    console.error("Failed to log forensic event:", error);
    res.status(500).json({ error: "Failed to log event" });
  }
});

// Verify event integrity
router.post("/verify-integrity", requireAuth, async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" });
    }

    // Mock verification
    const isValid = Math.random() > 0.1; // 90% success rate

    res.json({ 
      eventId,
      verified: isValid,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to verify event integrity:", error);
    res.status(500).json({ error: "Failed to verify event" });
  }
});

// Get forensic logs
router.get("/logs", requireAuth, async (req, res) => {
  try {
    const { eventType, limit = 50, offset = 0 } = req.query;
    
    let filteredLogs = mockLogs;
    
    if (eventType) {
      filteredLogs = mockLogs.filter(log => log.eventType === eventType);
    }

    res.json({
      logs: filteredLogs.slice(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string)),
      total: filteredLogs.length,
      filters: { eventType, limit, offset }
    });
  } catch (error) {
    console.error("Failed to get forensic logs:", error);
    res.status(500).json({ error: "Failed to retrieve logs" });
  }
});

// Generate forensic report
router.post("/generate-report", requireAuth, async (req, res) => {
  try {
    const { incidentId, reportType } = req.body;

    if (!incidentId || !reportType) {
      return res.status(400).json({ error: "Incident ID and report type are required" });
    }

    const report = {
      incidentId,
      reportType,
      generatedAt: new Date(),
      totalEvents: 10,
      verifiedEvents: 9,
      blockchainConfirmed: 7,
      events: mockLogs.map(log => ({
        eventId: log.eventId,
        eventType: log.eventType,
        timestamp: log.createdAt,
        verified: log.integrityVerified,
        blockchainConfirmed: log.blockchainConfirmed,
        data: log.eventData
      }))
    };

    res.json({ success: true, report });
  } catch (error) {
    console.error("Failed to generate forensic report:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// Get blockchain batches
router.get("/batches", requireAuth, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const batches = mockBatches.slice(
      parseInt(offset as string), 
      parseInt(offset as string) + parseInt(limit as string)
    );

    res.json({
      batches,
      total: mockBatches.length,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error) {
    console.error("Failed to get blockchain batches:", error);
    res.status(500).json({ error: "Failed to retrieve batches" });
  }
});

// Get system statistics
router.get("/stats", requireAuth, async (req, res) => {
  try {
    res.json(mockStats);
  } catch (error) {
    console.error("Failed to get forensic stats:", error);
    res.status(500).json({ error: "Failed to retrieve statistics" });
  }
});

// Verify blockchain event
router.get("/verify/:eventId", requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const mockEvent = mockLogs.find(log => log.eventId === eventId);
    
    if (!mockEvent) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json({
      eventId,
      exists: true,
      verified: mockEvent.integrityVerified,
      blockchainConfirmed: mockEvent.blockchainConfirmed,
      blockchainHash: mockEvent.blockchainHash,
      timestamp: mockEvent.createdAt
    });
  } catch (error) {
    console.error("Failed to verify blockchain event:", error);
    res.status(500).json({ error: "Failed to verify event" });
  }
});

export default router;