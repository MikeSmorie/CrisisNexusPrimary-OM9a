import { Router } from "express";
import { db } from "../db";
import { disasterForensicLogs, disasterBlockchainBatches, disasterIntegrityVerifications } from "../db/forensic-schema";
import { eq, and, gte, lte, desc, count } from "drizzle-orm";
import SimpleForensicLogger from "../lib/simple-forensic-logger";

// Simple auth middleware (using passport session)
const authenticateToken = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Not authenticated" });
};

const router = Router();

// Initialize forensic logger
const forensicLogger = new SimpleForensicLogger(
  process.env.FORENSIC_ENCRYPTION_KEY || "default-key-change-in-production"
);

// Log emergency event
router.post("/log", authenticateToken, async (req, res) => {
  try {
    const { eventType, eventData, metadata } = req.body;
    const userId = req.user.id;

    if (!eventType || !eventData) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const eventId = await forensicLogger.logEvent({
      eventId: "", // Will be generated
      eventType,
      userId,
      eventData,
      metadata
    });

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
router.post("/verify-integrity", authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" });
    }

    const isValid = await forensicLogger.verifyEventIntegrity(eventId);

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

// Get forensic logs with role-based access control
router.get("/logs", authenticateToken, async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    const {
      eventType,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = req.query;

    const filters = {
      eventType: eventType as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    const logs = await forensicLogger.getForensicLogs(userRole, userId, filters);

    res.json({
      logs,
      total: logs.length,
      filters
    });
  } catch (error) {
    console.error("Failed to get forensic logs:", error);
    res.status(500).json({ error: "Failed to retrieve logs" });
  }
});

// Generate forensic report
router.post("/generate-report", authenticateToken, async (req, res) => {
  try {
    const { incidentId, reportType } = req.body;

    if (!incidentId || !reportType) {
      return res.status(400).json({ error: "Incident ID and report type are required" });
    }

    if (!["timeline", "decisions", "resources", "full"].includes(reportType)) {
      return res.status(400).json({ error: "Invalid report type" });
    }

    const report = await forensicLogger.generateForensicReport(incidentId, reportType);

    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error("Failed to generate forensic report:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// Get blockchain batch status
router.get("/batches", authenticateToken, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const batches = await db.query.disasterBlockchainBatches.findMany({
      orderBy: [desc(disasterBlockchainBatches.createdAt)],
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    const totalBatches = await db.select({ count: count() }).from(disasterBlockchainBatches);

    res.json({
      batches,
      total: totalBatches[0].count,
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
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const [
      totalLogs,
      verifiedLogs,
      blockchainConfirmed,
      totalBatches,
      pendingBatches,
      recentLogs
    ] = await Promise.all([
      db.select({ count: count() }).from(disasterForensicLogs),
      db.select({ count: count() }).from(disasterForensicLogs).where(eq(disasterForensicLogs.integrityVerified, true)),
      db.select({ count: count() }).from(disasterForensicLogs).where(eq(disasterForensicLogs.blockchainConfirmed, true)),
      db.select({ count: count() }).from(disasterBlockchainBatches),
      db.select({ count: count() }).from(disasterBlockchainBatches).where(eq(disasterBlockchainBatches.status, "pending")),
      db.select({ count: count() }).from(disasterForensicLogs).where(gte(disasterForensicLogs.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)))
    ]);

    res.json({
      totalLogs: totalLogs[0].count,
      verifiedLogs: verifiedLogs[0].count,
      blockchainConfirmed: blockchainConfirmed[0].count,
      totalBatches: totalBatches[0].count,
      pendingBatches: pendingBatches[0].count,
      recentLogs: recentLogs[0].count,
      verificationRate: totalLogs[0].count > 0 ? (verifiedLogs[0].count / totalLogs[0].count) * 100 : 0,
      blockchainRate: totalLogs[0].count > 0 ? (blockchainConfirmed[0].count / totalLogs[0].count) * 100 : 0
    });
  } catch (error) {
    console.error("Failed to get forensic stats:", error);
    res.status(500).json({ error: "Failed to retrieve statistics" });
  }
});

// Verify blockchain event
router.get("/verify/:eventId", authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Get event from database
    const logEntry = await db.query.disasterForensicLogs.findFirst({
      where: eq(disasterForensicLogs.eventId, eventId)
    });

    if (!logEntry) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Verify integrity
    const isValid = await forensicLogger.verifyEventIntegrity(eventId);

    res.json({
      eventId,
      exists: true,
      verified: isValid,
      blockchainConfirmed: logEntry.blockchainConfirmed,
      blockchainHash: logEntry.blockchainHash,
      transactionHash: logEntry.transactionHash,
      blockNumber: logEntry.blockNumber,
      timestamp: logEntry.createdAt
    });
  } catch (error) {
    console.error("Failed to verify blockchain event:", error);
    res.status(500).json({ error: "Failed to verify event" });
  }
});

// Get integrity verification history
router.get("/verifications/:eventId", authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Get the forensic log entry
    const logEntry = await db.query.disasterForensicLogs.findFirst({
      where: eq(disasterForensicLogs.eventId, eventId)
    });

    if (!logEntry) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Get verification history
    const verifications = await db.query.disasterIntegrityVerifications.findMany({
      where: eq(disasterIntegrityVerifications.forensicLogId, logEntry.id),
      orderBy: [desc(disasterIntegrityVerifications.verifiedAt)]
    });

    res.json({
      eventId,
      verifications: verifications.map(v => ({
        id: v.id,
        type: v.verificationType,
        result: v.verificationResult,
        timestamp: v.verifiedAt,
        algorithm: v.algorithmUsed,
        trustScore: v.trustScore,
        duration: v.verificationDuration
      }))
    });
  } catch (error) {
    console.error("Failed to get verification history:", error);
    res.status(500).json({ error: "Failed to retrieve verification history" });
  }
});

export default router;