// DisasterMng-1-OM9 Emergency Response Modules
// Modular architecture for emergency operations center

import { Router } from 'express';
import { z } from 'zod';
import { db } from '@db/index';
import { 
  disasterIncidents, 
  disasterAlerts, 
  disasterResources, 
  disasterCommunications,
  disasterActivityLogs,
  disasterUsers
} from '@db/disaster-schema';
import { eq, and, desc, sql } from 'drizzle-orm';

const router = Router();

// Module 1: Incident Intake
router.post('/incident/report', async (req, res) => {
  try {
    const {
      type,
      severity = 'major',
      location,
      description,
      coordinates,
      reportingMethod = 'form'
    } = req.body;

    // Generate incident code
    const incidentCode = `${type.toUpperCase()}-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    // Create incident
    const [incident] = await db.insert(disasterIncidents).values({
      incidentCode,
      type,
      severity,
      status: 'active',
      location,
      coordinates,
      description,
      reportedBy: req.user?.id || 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Log incident creation
    await db.insert(disasterActivityLogs).values({
      userId: req.user?.id || 1,
      incidentId: incident.id,
      action: 'incident_created',
      details: `Created incident ${incidentCode}: ${type} at ${location}`,
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      incident,
      message: `Incident ${incidentCode} reported successfully`
    });
  } catch (error) {
    console.error('[MODULE-1] Incident reporting error:', error);
    res.status(500).json({ error: 'Failed to report incident' });
  }
});

// Module 2: AI Processing Hub Status
router.get('/ai/status', async (req, res) => {
  try {
    // Get recent AI activity
    const recentActivity = await db.query.disasterActivityLogs.findMany({
      where: sql`action LIKE 'ai_%'`,
      orderBy: desc(disasterActivityLogs.timestamp),
      limit: 10,
      with: {
        user: {
          columns: { username: true, role: true }
        },
        incident: {
          columns: { incidentCode: true, type: true }
        }
      }
    });

    res.json({
      aiStatus: 'emergency_fallback_active',
      providersConfigured: 0,
      recentActivity: recentActivity.map(activity => ({
        action: activity.action,
        timestamp: activity.timestamp,
        user: activity.user?.username,
        incident: activity.incident?.incidentCode,
        details: activity.details
      })),
      emergencyMode: true
    });
  } catch (error) {
    console.error('[MODULE-2] AI status error:', error);
    res.status(500).json({ error: 'Failed to get AI status' });
  }
});

// Module 3: Alert Dispatch
router.post('/alert/send', async (req, res) => {
  try {
    const {
      incidentId,
      type = 'internal',
      severity = 'warning',
      title,
      message,
      targetAudience = 'all_responders',
      channels = ['app', 'radio']
    } = req.body;

    // Create alert
    const [alert] = await db.insert(disasterAlerts).values({
      incidentId,
      alertType: type,
      severity,
      title,
      message,
      targetAudience,
      channels: JSON.stringify(channels),
      issuedBy: req.user?.id || 1,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }).returning();

    // Send notifications to target users
    const targetUsers = await getTargetUsers(targetAudience);
    
    for (const user of targetUsers) {
      await db.insert(disasterCommunications).values({
        fromUser: req.user?.id || 1,
        toUser: user.id,
        incidentId,
        messageType: 'urgent',
        content: `ALERT: ${title} - ${message}`,
        priority: severity === 'emergency' ? 'critical' : 'high',
        channel: channels[0] || 'app',
        createdAt: new Date()
      });
    }

    // Log alert issuance
    await db.insert(disasterActivityLogs).values({
      userId: req.user?.id || 1,
      incidentId,
      action: 'alert_issued',
      details: `Issued ${severity} alert: ${title}`,
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      alert,
      notificationsSent: targetUsers.length,
      message: `Alert dispatched to ${targetUsers.length} personnel`
    });
  } catch (error) {
    console.error('[MODULE-3] Alert dispatch error:', error);
    res.status(500).json({ error: 'Failed to dispatch alert' });
  }
});

// Module 4: Response Assignment
router.post('/response/assign', async (req, res) => {
  try {
    const { incidentId, resourceIds, commanderId } = req.body;

    const assigned = [];

    // Assign commander
    if (commanderId) {
      await db.update(disasterIncidents)
        .set({ 
          assignedCommander: commanderId,
          updatedAt: new Date()
        })
        .where(eq(disasterIncidents.id, incidentId));
    }

    // Assign resources
    if (resourceIds && resourceIds.length > 0) {
      for (const resourceId of resourceIds) {
        await db.update(disasterResources)
          .set({ 
            assignedIncident: incidentId,
            status: 'deployed',
            updatedAt: new Date()
          })
          .where(eq(disasterResources.id, resourceId));
        
        assigned.push(resourceId);
      }
    }

    // Log assignment
    await db.insert(disasterActivityLogs).values({
      userId: req.user?.id || 1,
      incidentId,
      action: 'resources_assigned',
      details: `Assigned ${assigned.length} resources to incident`,
      timestamp: new Date()
    });

    res.json({
      success: true,
      assignedResources: assigned.length,
      commanderAssigned: !!commanderId,
      message: 'Resources assigned successfully'
    });
  } catch (error) {
    console.error('[MODULE-4] Response assignment error:', error);
    res.status(500).json({ error: 'Failed to assign response resources' });
  }
});

// Module 5: Audit & Replay Logs
router.get('/logs/audit', async (req, res) => {
  try {
    const { 
      incidentId, 
      userId, 
      action, 
      limit = 50, 
      offset = 0,
      startDate,
      endDate 
    } = req.query;

    let whereConditions = [];
    
    if (incidentId) whereConditions.push(eq(disasterActivityLogs.incidentId, Number(incidentId)));
    if (userId) whereConditions.push(eq(disasterActivityLogs.userId, Number(userId)));
    if (action) whereConditions.push(sql`action LIKE ${`%${action}%`}`);
    if (startDate) whereConditions.push(sql`timestamp >= ${new Date(startDate as string)}`);
    if (endDate) whereConditions.push(sql`timestamp <= ${new Date(endDate as string)}`);

    const logs = await db.query.disasterActivityLogs.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      orderBy: desc(disasterActivityLogs.timestamp),
      limit: Number(limit),
      offset: Number(offset),
      with: {
        user: {
          columns: { username: true, role: true, department: true }
        },
        incident: {
          columns: { incidentCode: true, type: true, location: true }
        },
        resource: {
          columns: { name: true, resourceType: true }
        }
      }
    });

    res.json({
      logs: logs.map(log => ({
        id: log.id,
        action: log.action,
        timestamp: log.timestamp,
        details: log.details,
        user: log.user,
        incident: log.incident,
        resource: log.resource,
        location: log.location
      })),
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: logs.length
      }
    });
  } catch (error) {
    console.error('[MODULE-5] Audit logs error:', error);
    res.status(500).json({ error: 'Failed to retrieve audit logs' });
  }
});

// Module 6: Multilingual Command Bridge
router.post('/communication/translate', async (req, res) => {
  try {
    const { 
      messageId, 
      targetLanguage = 'en',
      sourceLanguage 
    } = req.body;

    // Get original message
    const message = await db.query.disasterCommunications.findFirst({
      where: eq(disasterCommunications.id, messageId)
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Mock translation (would use AI service when configured)
    const translatedContent = `[TRANSLATION NEEDED] ${message.content}`;

    // Update message with translation
    await db.update(disasterCommunications)
      .set({
        translatedContent,
        originalLanguage: sourceLanguage || 'unknown'
      })
      .where(eq(disasterCommunications.id, messageId));

    res.json({
      success: true,
      originalText: message.content,
      translatedText: translatedContent,
      sourceLanguage: sourceLanguage || 'unknown',
      targetLanguage,
      confidence: 0.5
    });
  } catch (error) {
    console.error('[MODULE-6] Translation error:', error);
    res.status(500).json({ error: 'Translation service unavailable' });
  }
});

// Module 7: Dashboard Console Data
router.get('/dashboard/metrics', async (req, res) => {
  try {
    const role = req.user?.role || 'responder';
    
    // Base metrics for all roles
    const [
      activeIncidents,
      availableResources,
      criticalAlerts,
      recentActivity
    ] = await Promise.all([
      db.query.disasterIncidents.findMany({
        where: eq(disasterIncidents.status, 'active'),
        limit: role === 'responder' ? 5 : undefined
      }),
      db.query.disasterResources.findMany({
        where: eq(disasterResources.status, 'available')
      }),
      db.query.disasterAlerts.findMany({
        where: eq(disasterAlerts.severity, 'emergency')
      }),
      db.query.disasterActivityLogs.findMany({
        orderBy: desc(disasterActivityLogs.timestamp),
        limit: 10,
        with: {
          user: { columns: { username: true } },
          incident: { columns: { incidentCode: true } }
        }
      })
    ]);

    res.json({
      metrics: {
        activeIncidents: activeIncidents.length,
        availableResources: availableResources.length,
        criticalAlerts: criticalAlerts.length,
        systemStatus: 'operational'
      },
      incidents: activeIncidents,
      resources: availableResources,
      alerts: criticalAlerts,
      recentActivity: recentActivity.map(activity => ({
        action: activity.action,
        timestamp: activity.timestamp,
        user: activity.user?.username,
        incident: activity.incident?.incidentCode
      })),
      accessLevel: role
    });
  } catch (error) {
    console.error('[MODULE-7] Dashboard metrics error:', error);
    res.status(500).json({ error: 'Failed to load dashboard metrics' });
  }
});

// Helper Functions

async function getTargetUsers(targetAudience: string) {
  switch (targetAudience) {
    case 'all_responders':
      return await db.query.disasterUsers.findMany({
        where: eq(disasterUsers.role, 'responder')
      });
    case 'commanders':
      return await db.query.disasterUsers.findMany({
        where: eq(disasterUsers.role, 'commander')
      });
    case 'all_personnel':
      return await db.query.disasterUsers.findMany({
        where: sql`status = 'active'`
      });
    default:
      return [];
  }
}

export default router;