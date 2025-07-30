import { Router } from "express";
import { db } from "../../db";
import { users } from "../../db/schema";
import { disasterIncidents, disasterResources, disasterAlerts, disasterActivityLogs, disasterCommunications } from "../../db/disaster-schema";
import { eq, desc, and } from "drizzle-orm";
import { createIncident, checkEscalationTriggers } from "../lib/escalationEngine";

const router = Router();

// Get all active incidents
router.get("/incidents", async (req, res) => {
  try {
    const incidents = await db
      .select()
      .from(disasterIncidents)
      .orderBy(desc(disasterIncidents.createdAt));
    res.json(incidents);
  } catch (error) {
    console.error("Error fetching incidents:", error);
    res.status(500).json({ error: "Failed to fetch incidents" });
  }
});

// Get active alerts
router.get("/alerts", async (req, res) => {
  try {
    const alerts = await db
      .select()
      .from(disasterAlerts)
      .orderBy(desc(disasterAlerts.createdAt));
    res.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

// Get available resources
router.get("/resources", async (req, res) => {
  try {
    const resources = await db
      .select()
      .from(disasterResources)
      .orderBy(desc(disasterResources.updatedAt));
    res.json(resources);
  } catch (error) {
    console.error("Error fetching resources:", error);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
});

// Create new incident with AI assessment
router.post("/incidents", async (req, res) => {
  try {
    const { incidentType, type, severity, location, description, reportedBy } = req.body;
    
    if (!description || !location || !(incidentType || type)) {
      return res.status(400).json({ error: "Missing required fields: description, location, and incidentType/type" });
    }

    // Use AI-powered incident creation with escalation engine
    const result = await createIncident({
      incidentType: incidentType || type,
      description,
      location,
      reportedBy: reportedBy || req.user?.username || "System",
      userId: req.user?.id,
      severity
    });

    res.json({
      success: true,
      incident: result.incident,
      aiAssessment: {
        threatLevel: result.aiAssessment.threat_level,
        escalationRequired: result.aiAssessment.escalation_required,
        recommendations: result.aiAssessment.ai_recommendation,
        urgencyLevel: result.aiAssessment.urgency_level,
        estimatedResponseTime: result.aiAssessment.estimated_response_time
      },
      escalated: result.escalated,
      message: `Incident created with AI assessment: ${result.aiAssessment.threat_level} threat level${result.escalated ? ' and escalated' : ''}`
    });
  } catch (error) {
    console.error("Error creating incident:", error);
    res.status(500).json({ 
      error: "Failed to create incident", 
      details: error.message 
    });
  }
});

// Manual escalation check endpoint
router.post("/incidents/:id/check-escalation", async (req, res) => {
  try {
    const incidentId = parseInt(req.params.id);
    const triggers = await checkEscalationTriggers(incidentId);
    
    res.json({
      success: true,
      escalationTriggered: triggers.length > 0,
      triggers,
      message: triggers.length > 0 ? `Escalation triggered: ${triggers.join(', ')}` : 'No escalation required'
    });
  } catch (error) {
    console.error("Error checking escalation:", error);
    res.status(500).json({ 
      error: "Failed to check escalation", 
      details: error.message 
    });
  }
});

// Create new alert
router.post("/alerts", async (req, res) => {
  try {
    const { alertType, severity, title, message, issuedBy, targetZones, activeUntil, broadcastChannels } = req.body;
    
    const alert = await db.insert(disasterAlerts).values({
      alertType,
      severity,
      title,
      message,
      issuedBy,
      targetZones,
      activeUntil: activeUntil ? new Date(activeUntil) : null,
      broadcastChannels,
      createdAt: new Date()
    }).returning();

    // Log the activity
    await db.insert(disasterActivityLogs).values({
      userId: issuedBy,
      action: "alert_issued",
      details: `Issued ${severity} alert: ${title}`,
      timestamp: new Date()
    });

    res.json(alert[0]);
  } catch (error) {
    console.error("Error creating alert:", error);
    res.status(500).json({ error: "Failed to create alert" });
  }
});

// Update incident status
router.patch("/incidents/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, userId } = req.body;
    
    const incident = await db.update(disasterIncidents)
      .set({ 
        status, 
        updatedAt: new Date(),
        actualResolution: status === 'resolved' ? new Date() : undefined
      })
      .where(eq(disasterIncidents.id, parseInt(id)))
      .returning();

    // Log the activity
    await db.insert(disasterActivityLogs).values({
      userId,
      incidentId: parseInt(id),
      action: "status_updated",
      details: `Updated incident status to ${status}`,
      timestamp: new Date()
    });

    res.json(incident[0]);
  } catch (error) {
    console.error("Error updating incident:", error);
    res.status(500).json({ error: "Failed to update incident" });
  }
});

// Get communications for an incident
router.get("/incidents/:id/communications", async (req, res) => {
  try {
    const { id } = req.params;
    const communications = await db.query.disasterCommunications.findMany({
      where: eq(disasterCommunications.incidentId, parseInt(id)),
      orderBy: [desc(disasterCommunications.createdAt)],
      with: {
        sender: true,
        receiver: true
      }
    });
    res.json(communications);
  } catch (error) {
    console.error("Error fetching communications:", error);
    res.status(500).json({ error: "Failed to fetch communications" });
  }
});

// Send communication
router.post("/communications", async (req, res) => {
  try {
    const { fromUser, toUser, incidentId, messageType, content, priority, channel } = req.body;
    
    const communication = await db.insert(disasterCommunications).values({
      fromUser,
      toUser,
      incidentId,
      messageType,
      content,
      priority,
      channel,
      createdAt: new Date()
    }).returning();

    // Log the activity
    await db.insert(disasterActivityLogs).values({
      userId: fromUser,
      incidentId,
      action: "communication_sent",
      details: `Sent ${messageType} communication: ${content.substring(0, 50)}...`,
      timestamp: new Date()
    });

    res.json(communication[0]);
  } catch (error) {
    console.error("Error sending communication:", error);
    res.status(500).json({ error: "Failed to send communication" });
  }
});

// Get activity logs
router.get("/activity", async (req, res) => {
  try {
    const { incidentId, userId, limit = 50 } = req.query;
    
    let whereConditions = [];
    if (incidentId) whereConditions.push(eq(disasterActivityLogs.incidentId, parseInt(incidentId as string)));
    if (userId) whereConditions.push(eq(disasterActivityLogs.userId, parseInt(userId as string)));
    
    const activities = await db.query.disasterActivityLogs.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      orderBy: [desc(disasterActivityLogs.timestamp)],
      limit: parseInt(limit as string),
      with: {
        user: true,
        incident: true,
        resource: true
      }
    });
    
    res.json(activities);
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({ error: "Failed to fetch activity logs" });
  }
});

// Get disaster stats
router.get("/stats", async (req, res) => {
  try {
    // Get basic counts
    const activeIncidents = await db.query.disasterIncidents.findMany({
      where: eq(disasterIncidents.status, "active")
    });
    
    const availableResources = await db.query.disasterResources.findMany({
      where: eq(disasterResources.status, "available")
    });
    
    const activeAlerts = await db.query.disasterAlerts.findMany({
      where: and(
        eq(disasterAlerts.severity, "emergency")
      )
    });
    
    const totalEvacuations = activeIncidents.reduce((sum, incident) => 
      sum + (incident.evacuationsCount || 0), 0
    );
    
    const totalCasualties = activeIncidents.reduce((sum, incident) => 
      sum + (incident.casualtiesCount || 0), 0
    );

    res.json({
      activeIncidents: activeIncidents.length,
      availableResources: availableResources.length,
      criticalAlerts: activeAlerts.length,
      totalEvacuations,
      totalCasualties,
      systemStatus: "operational"
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;