import { Router } from "express";
import { db } from "../../db";
import { disasterUsers, disasterIncidents, disasterResources, disasterAlerts, disasterActivityLogs, disasterCommunications } from "../../db/disaster-schema";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

// Get all active incidents
router.get("/incidents", async (req, res) => {
  try {
    const incidents = await db.query.disasterIncidents.findMany({
      orderBy: [desc(disasterIncidents.createdAt)],
      with: {
        reporter: true,
        commander: true
      }
    });
    res.json(incidents);
  } catch (error) {
    console.error("Error fetching incidents:", error);
    res.status(500).json({ error: "Failed to fetch incidents" });
  }
});

// Get active alerts
router.get("/alerts", async (req, res) => {
  try {
    const alerts = await db.query.disasterAlerts.findMany({
      orderBy: [desc(disasterAlerts.createdAt)],
      with: {
        issuer: true
      }
    });
    res.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

// Get available resources
router.get("/resources", async (req, res) => {
  try {
    const resources = await db.query.disasterResources.findMany({
      orderBy: [desc(disasterResources.updatedAt)],
      with: {
        operator: true,
        incident: true
      }
    });
    res.json(resources);
  } catch (error) {
    console.error("Error fetching resources:", error);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
});

// Create new incident
router.post("/incidents", async (req, res) => {
  try {
    const { incidentCode, type, severity, location, description, reportedBy } = req.body;
    
    const incident = await db.insert(disasterIncidents).values({
      incidentCode,
      type,
      severity,
      status: "active",
      location,
      description,
      reportedBy,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Log the activity
    await db.insert(disasterActivityLogs).values({
      userId: reportedBy,
      incidentId: incident[0].id,
      action: "incident_created",
      details: `Created incident ${incidentCode}: ${type} at ${location}`,
      timestamp: new Date()
    });

    res.json(incident[0]);
  } catch (error) {
    console.error("Error creating incident:", error);
    res.status(500).json({ error: "Failed to create incident" });
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