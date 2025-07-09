import { assessIncident } from './incident-assessment';
import { db } from '../../db';
import { disasterIncidents, disasterAlerts, disasterResources, disasterActivityLogs } from '../../db/disaster-schema';
import { generateEmergencyAlert } from './openai-emergency';

export { assessIncident };

export async function createIncident(data: {
  incidentType: string;
  description: string;
  location: string;
  reportedBy?: string;
  severity?: string;
  userId?: number;
}) {
  try {
    // Step 1: AI Assessment
    const ai = await assessIncident(data.description, data.incidentType, data.location);
    
    // Step 2: Generate incident code
    const incidentCode = generateIncidentCode(data.incidentType);
    
    // Step 3: Resolve reporter user ID
    let reporterId = data.userId || 1; // Default to system user
    if (data.reportedBy && data.reportedBy !== 'Unknown' && data.reportedBy !== 'System') {
      try {
        const reporter = await db.query.disasterUsers.findFirst({
          where: (users, { eq }) => eq(users.username, data.reportedBy)
        });
        if (reporter) {
          reporterId = reporter.id;
        }
      } catch (error) {
        console.log('Could not find user, using default reporter ID');
      }
    }
    
    // Step 4: Create incident with AI analysis (using existing schema)
    const [newIncident] = await db
      .insert(disasterIncidents)
      .values({
        incidentCode,
        type: data.incidentType,
        description: data.description,
        location: data.location,
        severity: ai.threat_level,
        status: 'active',
        reportedBy: reporterId,
        resourcesNeeded: JSON.stringify(ai.resource_requirements),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    // Step 5: Log the incident creation  
    await db.insert(disasterActivityLogs).values({
      userId: reporterId,
      incidentId: newIncident.id,
      action: 'incident_created', 
      details: `New incident created: ${incidentCode} - ${data.incidentType}`,
      timestamp: new Date()
    });

    // Step 6: Trigger alerting logic if escalation required
    if (ai.escalation_required || ai.threat_level === 'critical' || ai.threat_level === 'high') {
      await triggerEmergencyAlert(newIncident, ai);
    }

    // Step 7: Auto-assign resources if needed  
    if (ai.threat_level === 'critical' || ai.urgency_level === 'emergency') {
      await autoAssignResources(newIncident, ai.resource_requirements);
    }

    return {
      success: true,
      incident: newIncident,
      aiAssessment: ai,
      escalated: ai.escalation_required
    };
  } catch (error) {
    console.error('Failed to create incident:', error);
    throw new Error(`Incident creation failed: ${error.message}`);
  }
}

export async function triggerEmergencyAlert(incident: any, aiAssessment: any) {
  try {
    // Generate AI-powered alert message
    const alertData = await generateEmergencyAlert(
      incident.incidentType,
      incident.severity,
      incident.location,
      'emergency_responders'
    );

    // Create alert record
    const [newAlert] = await db
      .insert(disasterAlerts)
      .values({
        alertCode: `ALERT-${incident.incidentCode}`,
        incidentId: incident.id,
        alertType: 'incident_escalation',
        severity: incident.severity,
        title: alertData.title,
        message: alertData.message,
        targetAudience: 'emergency_responders',
        channels: JSON.stringify(alertData.channels),
        location: incident.location,
        isActive: true,
        sentAt: new Date(),
        createdBy: 1, // System user
        createdAt: new Date()
      })
      .returning();

    // Log alert dispatch
    await db.insert(disasterActivityLogs).values({
      userId: 1,
      action: 'alert_dispatched',
      details: `Emergency alert dispatched for incident ${incident.incidentCode}`,
      timestamp: new Date(),
      module: 'alert_system',
      severity: incident.severity
    });

    return newAlert;
  } catch (error) {
    console.error('Failed to trigger emergency alert:', error);
    throw error;
  }
}

export async function autoAssignResources(incident: any, resourceRequirements: any) {
  try {
    // Find available resources matching requirements
    const availableResources = await db.query.disasterResources.findMany({
      where: (resources, { eq }) => eq(resources.status, 'available'),
      limit: resourceRequirements.personnel || 4
    });

    // Assign resources to incident
    for (const resource of availableResources.slice(0, resourceRequirements.personnel || 2)) {
      await db
        .update(disasterResources)
        .set({
          status: 'deployed',
          currentIncident: incident.id,
          assignedAt: new Date(),
          updatedAt: new Date()
        })
        .where((r, { eq }) => eq(r.id, resource.id));

      // Log resource assignment
      await db.insert(disasterActivityLogs).values({
        userId: 1,
        action: 'resource_assigned',
        details: `Resource ${resource.resourceCode} assigned to incident ${incident.incidentCode}`,
        timestamp: new Date(),
        module: 'resource_management',
        severity: incident.severity
      });
    }

    // Update incident with assigned personnel count
    await db
      .update(disasterIncidents)
      .set({
        assignedPersonnel: availableResources.length,
        updatedAt: new Date()
      })
      .where((i, { eq }) => eq(i.id, incident.id));

    return {
      assignedResources: availableResources.length,
      resources: availableResources
    };
  } catch (error) {
    console.error('Failed to auto-assign resources:', error);
    throw error;
  }
}

function generateIncidentCode(incidentType: string): string {
  const typePrefix = incidentType.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${typePrefix}-${timestamp}-${random}`;
}

// Escalation triggers
export async function checkEscalationTriggers(incidentId: number) {
  try {
    const incident = await db.query.disasterIncidents.findFirst({
      where: (incidents, { eq }) => eq(incidents.id, incidentId)
    });

    if (!incident) {
      throw new Error('Incident not found');
    }

    const escalationTriggers = [];

    // Time-based escalation
    const incidentAge = Date.now() - new Date(incident.reportedAt).getTime();
    const hoursSinceReported = incidentAge / (1000 * 60 * 60);

    if (hoursSinceReported > 2 && incident.status === 'active') {
      escalationTriggers.push('time_threshold_exceeded');
    }

    // Severity-based escalation
    if (incident.severity === 'critical' && !incident.escalationRequired) {
      escalationTriggers.push('critical_severity_detected');
    }

    // Resource unavailability escalation
    const availableResources = await db.query.disasterResources.findMany({
      where: (resources, { eq }) => eq(resources.status, 'available')
    });

    if (availableResources.length < 2 && incident.status === 'active') {
      escalationTriggers.push('insufficient_resources');
    }

    // Execute escalation if triggers found
    if (escalationTriggers.length > 0) {
      await escalateIncident(incident, escalationTriggers);
    }

    return escalationTriggers;
  } catch (error) {
    console.error('Failed to check escalation triggers:', error);
    throw error;
  }
}

async function escalateIncident(incident: any, triggers: string[]) {
  // Update incident escalation status
  await db
    .update(disasterIncidents)
    .set({
      escalationRequired: true,
      escalationNotes: `Auto-escalated due to: ${triggers.join(', ')}`,
      updatedAt: new Date()
    })
    .where((i, { eq }) => eq(i.id, incident.id));

  // Trigger high-priority alert
  await triggerEmergencyAlert(incident, { 
    threat_level: 'critical',
    escalation_required: true 
  });

  // Log escalation
  await db.insert(disasterActivityLogs).values({
    userId: 1,
    action: 'incident_escalated',
    details: `Incident ${incident.incidentCode} escalated: ${triggers.join(', ')}`,
    timestamp: new Date(),
    module: 'escalation_engine',
    severity: 'critical'
  });
}