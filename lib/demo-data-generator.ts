import { db } from "../db";
import { 
  disasterIncidents, 
  disasterResources, 
  disasterAlerts, 
  disasterCommunications, 
  disasterUsers 
} from "../db/disaster-schema";

export interface DemoDataConfig {
  incidentCount: number;
  resourceCount: number;
  alertCount: number;
  communicationCount: number;
  responderCount: number;
}

export class DemoDataGenerator {
  private static readonly INCIDENT_TYPES = [
    'fire', 'flood', 'earthquake', 'medical', 'accident', 'security', 'weather'
  ];

  private static readonly INCIDENT_DESCRIPTIONS = {
    fire: [
      'Residential structure fire with multiple units trapped',
      'Wildfire spreading rapidly through residential area',
      'Commercial building fire with chemical hazards',
      'Vehicle fire blocking major highway intersection'
    ],
    flood: [
      'Flash flooding in downtown commercial district',
      'River overflow threatening residential neighborhoods',
      'Urban flooding from storm drain backup',
      'Coastal flooding from storm surge'
    ],
    earthquake: [
      'Magnitude 4.2 earthquake causing structural damage',
      'Aftershock sequence following major seismic event',
      'Building collapse from seismic activity',
      'Infrastructure damage from ground shaking'
    ],
    medical: [
      'Mass casualty incident at public event',
      'Hazmat exposure requiring medical response',
      'Multiple vehicle accident with serious injuries',
      'Public health emergency at school facility'
    ],
    accident: [
      'Multi-vehicle collision on major highway',
      'Industrial accident with chemical release',
      'Construction site accident with trapped workers',
      'Public transportation incident with injuries'
    ],
    security: [
      'Suspicious package requiring bomb squad response',
      'Active threat situation at public facility',
      'Evacuation required for security incident',
      'Perimeter breach at critical infrastructure'
    ],
    weather: [
      'Severe thunderstorm with damaging winds',
      'Tornado warning with confirmed funnel cloud',
      'Ice storm causing widespread power outages',
      'Heat emergency affecting vulnerable populations'
    ]
  };

  private static readonly LOCATIONS = [
    { zone: 'Alpha', area: 'Cape Town CBD', coordinates: [-33.9249, 18.4241] },
    { zone: 'Alpha', area: 'Stellenbosch', coordinates: [-33.9321, 18.8602] },
    { zone: 'Alpha', area: 'Paarl', coordinates: [-33.7434, 18.9650] },
    { zone: 'Bravo', area: 'Johannesburg Central', coordinates: [-26.2041, 28.0473] },
    { zone: 'Bravo', area: 'Pretoria', coordinates: [-25.7479, 28.2293] },
    { zone: 'Bravo', area: 'Sandton', coordinates: [-26.1076, 28.0567] },
    { zone: 'Charlie', area: 'Kimberley', coordinates: [-28.7282, 24.7499] },
    { zone: 'Charlie', area: 'Bloemfontein', coordinates: [-29.0852, 26.1596] },
    { zone: 'Delta', area: 'Musina Border', coordinates: [-22.3416, 30.0419] },
    { zone: 'Delta', area: 'Beitbridge Area', coordinates: [-22.2167, 29.9833] }
  ];

  private static readonly RESOURCE_TYPES = [
    'ambulance', 'fire_truck', 'police_vehicle', 'rescue_helicopter', 
    'mobile_command', 'hazmat_unit', 'water_rescue', 'search_team'
  ];

  private static readonly RESPONDER_NAMES = [
    'Alex Johnson', 'Maria Santos', 'David Chen', 'Sarah Williams',
    'Michael Brown', 'Lisa Garcia', 'Robert Taylor', 'Jennifer Davis',
    'Christopher Wilson', 'Amanda Rodriguez', 'Daniel Martinez', 'Emily Anderson'
  ];

  private static readonly AI_CLASSIFICATIONS = [
    'High Priority - Immediate Response Required',
    'Medium Priority - Standard Response Protocol',
    'Low Priority - Monitor and Assess',
    'Critical - All Available Units Respond',
    'Resolved - Stand Down All Units'
  ];

  /**
   * Generate comprehensive demo data for the system
   */
  static async generateDemoData(config: DemoDataConfig = {
    incidentCount: 12,
    resourceCount: 25,
    alertCount: 8,
    communicationCount: 30,
    responderCount: 15
  }): Promise<{ success: boolean; summary: any; error?: string }> {
    try {
      console.log('Starting demo data generation...');
      
      // Clear existing mock data first
      await this.clearMockData();
      
      const summary = {
        incidents: 0,
        responders: 0,
        resources: 0,
        alerts: 0,
        communications: 0
      };

      // Generate demo responders
      const responderIds = await this.generateDemoResponders(config.responderCount);
      summary.responders = responderIds.length;

      // Generate demo incidents
      const incidentIds = await this.generateDemoIncidents(config.incidentCount, responderIds);
      summary.incidents = incidentIds.length;

      // Generate demo resources
      const resourceIds = await this.generateDemoResources(config.resourceCount, incidentIds);
      summary.resources = resourceIds.length;

      // Generate demo alerts
      const alertIds = await this.generateDemoAlerts(config.alertCount, incidentIds);
      summary.alerts = alertIds.length;

      // Generate demo communications
      const communicationIds = await this.generateDemoCommunications(config.communicationCount, incidentIds, responderIds);
      summary.communications = communicationIds.length;

      console.log('Demo data generation completed:', summary);
      
      return { success: true, summary };
    } catch (error) {
      console.error('Failed to generate demo data:', error);
      return { success: false, summary: {}, error: error.message };
    }
  }

  /**
   * Generate demo responders
   */
  private static async generateDemoResponders(count: number): Promise<number[]> {
    const responders = [];
    
    for (let i = 0; i < count; i++) {
      const name = this.RESPONDER_NAMES[i % this.RESPONDER_NAMES.length];
      const role = i < 3 ? 'commander' : 'responder';
      const zone = this.LOCATIONS[i % this.LOCATIONS.length].zone;
      
      responders.push({
        username: `${name.toLowerCase().replace(' ', '_')}_${i + 1}`,
        email: `${name.toLowerCase().replace(' ', '.')}${i + 1}@emergency.demo`,
        password: 'DemoPassword123!',
        role,
        department: 'Emergency Services',
        locationZone: zone,
        status: 'active',
        isMock: true
      });
    }

    try {
      const insertedResponders = await db.insert(disasterUsers).values(responders).returning({ id: disasterUsers.id });
      return insertedResponders.map(r => r.id);
    } catch (error) {
      console.error('Failed to insert demo responders:', error);
      return [];
    }
  }

  /**
   * Generate demo incidents with realistic scenarios
   */
  private static async generateDemoIncidents(count: number, responderIds: number[]): Promise<number[]> {
    const incidents = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      const incidentType = this.INCIDENT_TYPES[Math.floor(Math.random() * this.INCIDENT_TYPES.length)];
      const location = this.LOCATIONS[Math.floor(Math.random() * this.LOCATIONS.length)];
      const descriptions = this.INCIDENT_DESCRIPTIONS[incidentType];
      const description = descriptions[Math.floor(Math.random() * descriptions.length)];
      
      const severity = Math.random() < 0.1 ? 'critical' : 
                      Math.random() < 0.3 ? 'high' : 
                      Math.random() < 0.6 ? 'medium' : 'low';
      
      const status = Math.random() < 0.7 ? 'active' : 
                     Math.random() < 0.9 ? 'responding' : 'resolved';
      
      const createdAt = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Last 7 days
      
      incidents.push({
        incidentCode: `${incidentType.toUpperCase()}-2025-${String(i + 1).padStart(3, '0')}`,
        type: incidentType,
        description,
        severity,
        status,
        location: location.area,
        coordinates: JSON.stringify(location.coordinates),
        reportedBy: responderIds[Math.floor(Math.random() * responderIds.length)] || 1,
        assignedCommander: status === 'active' ? responderIds[Math.floor(Math.random() * responderIds.length)] : null,
        resourcesNeeded: JSON.stringify([
          this.RESOURCE_TYPES[Math.floor(Math.random() * this.RESOURCE_TYPES.length)],
          this.RESOURCE_TYPES[Math.floor(Math.random() * this.RESOURCE_TYPES.length)]
        ]),
        casualtiesCount: Math.floor(Math.random() * 50),
        evacuationsCount: Math.floor(Math.random() * 200),
        createdAt,
        updatedAt: new Date(createdAt.getTime() + Math.random() * 3 * 60 * 60 * 1000), // Up to 3 hours later
        isMock: true
      });
    }

    try {
      const insertedIncidents = await db.insert(disasterIncidents).values(incidents).returning({ id: disasterIncidents.id });
      return insertedIncidents.map(i => i.id);
    } catch (error) {
      console.error('Failed to insert demo incidents:', error);
      return [];
    }
  }

  /**
   * Generate demo resources with realistic deployment
   */
  private static async generateDemoResources(count: number, incidentIds: number[]): Promise<number[]> {
    const resources = [];
    
    for (let i = 0; i < count; i++) {
      const resourceType = this.RESOURCE_TYPES[Math.floor(Math.random() * this.RESOURCE_TYPES.length)];
      const location = this.LOCATIONS[Math.floor(Math.random() * this.LOCATIONS.length)];
      const isDeployed = Math.random() < 0.4;
      
      resources.push({
        resourceType,
        name: `${resourceType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Unit ${i + 1}`,
        identifier: `${resourceType.toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
        status: isDeployed ? 'deployed' : Math.random() < 0.8 ? 'available' : 'maintenance',
        location: location.area,
        assignedIncident: isDeployed && incidentIds.length > 0 ? 
          incidentIds[Math.floor(Math.random() * incidentIds.length)] : null,
        operatorId: responderIds[Math.floor(Math.random() * responderIds.length)] || 1,
        capabilities: JSON.stringify({
          equipment: ['Standard Emergency Kit', 'Communications Radio', 'GPS Navigation'],
          operationType: [resourceType.replace('_', ' ').toLowerCase()],
          maxSpeed: Math.floor(Math.random() * 50) + 80
        }),
        isMock: true
      });
    }

    try {
      const insertedResources = await db.insert(disasterResources).values(resources).returning({ id: disasterResources.id });
      return insertedResources.map(r => r.id);
    } catch (error) {
      console.error('Failed to insert demo resources:', error);
      return [];
    }
  }

  /**
   * Generate demo alerts
   */
  private static async generateDemoAlerts(count: number, incidentIds: number[]): Promise<number[]> {
    const alertTypes = ['evacuation', 'shelter', 'traffic', 'weather', 'public_safety'];
    const alerts = [];
    
    for (let i = 0; i < count; i++) {
      const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const location = this.LOCATIONS[Math.floor(Math.random() * this.LOCATIONS.length)];
      const isActive = Math.random() < 0.6;
      
      alerts.push({
        alertType,
        severity: Math.random() < 0.2 ? 'emergency' : Math.random() < 0.5 ? 'warning' : 'watch',
        title: `${alertType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Alert`,
        message: `Immediate ${alertType.replace('_', ' ')} required in ${location.area}. Follow emergency protocols.`,
        issuedBy: responderIds[Math.floor(Math.random() * responderIds.length)] || 1,
        targetZones: location.zone,
        activeUntil: isActive ? 
          new Date(Date.now() + Math.random() * 4 * 60 * 60 * 1000) : null, // Next 4 hours
        acknowledgedBy: JSON.stringify([]),
        broadcastChannels: JSON.stringify(['sms', 'push_notification', 'radio']),
        isMock: true
      });
    }

    try {
      const insertedAlerts = await db.insert(disasterAlerts).values(alerts).returning({ id: disasterAlerts.id });
      return insertedAlerts.map(a => a.id);
    } catch (error) {
      console.error('Failed to insert demo alerts:', error);
      return [];
    }
  }

  /**
   * Generate demo communications
   */
  private static async generateDemoCommunications(
    count: number, 
    incidentIds: number[], 
    responderIds: number[]
  ): Promise<number[]> {
    const communicationTypes = ['radio', 'sms', 'email', 'dispatch', 'status_update'];
    const communications = [];
    
    for (let i = 0; i < count; i++) {
      const commType = communicationTypes[Math.floor(Math.random() * communicationTypes.length)];
      const senderId = responderIds[Math.floor(Math.random() * responderIds.length)] || 1;
      const receiverId = responderIds[Math.floor(Math.random() * responderIds.length)] || 2;
      
      const messages = {
        radio: ['Unit responding to scene', 'ETA 5 minutes', 'Requesting backup', 'Scene secure'],
        sms: ['Status update required', 'Resources deployed', 'Situation under control', 'Medical assistance needed'],
        email: ['Incident report attached', 'Resource allocation update', 'Shift change notification', 'Training reminder'],
        dispatch: ['All units respond', 'Priority 1 call', 'Code red activation', 'Stand down all units'],
        status_update: ['On scene', 'En route', 'Available', 'Out of service']
      };
      
      const messageContent = messages[commType][Math.floor(Math.random() * messages[commType].length)];
      
      communications.push({
        fromUser: senderId,
        toUser: receiverId,
        incidentId: incidentIds.length > 0 && Math.random() < 0.7 ? 
          incidentIds[Math.floor(Math.random() * incidentIds.length)] : null,
        messageType: commType,
        content: messageContent,
        priority: Math.random() < 0.2 ? 'critical' : Math.random() < 0.5 ? 'high' : 'normal',
        acknowledgedAt: Math.random() < 0.8 ? new Date() : null,
        channel: commType,
        translatedContent: `[Translation] ${messageContent}`,
        originalLanguage: 'en',
        isMock: true
      });
    }

    try {
      const insertedCommunications = await db.insert(disasterCommunications).values(communications).returning({ id: disasterCommunications.id });
      return insertedCommunications.map(c => c.id);
    } catch (error) {
      console.error('Failed to insert demo communications:', error);
      return [];
    }
  }

  /**
   * Clear all mock data from the system
   */
  static async clearMockData(): Promise<{ success: boolean; summary: any; error?: string }> {
    try {
      console.log('Clearing existing mock data...');
      
      const summary = {
        incidents: 0,
        resources: 0,
        alerts: 0,
        communications: 0,
        users: 0
      };

      // Delete mock communications
      const deletedComms = await db.delete(disasterCommunications)
        .where(eq(disasterCommunications.isMock, true));
      summary.communications = deletedComms.rowCount || 0;

      // Delete mock alerts
      const deletedAlerts = await db.delete(disasterAlerts)
        .where(eq(disasterAlerts.isMock, true));
      summary.alerts = deletedAlerts.rowCount || 0;

      // Delete mock resources
      const deletedResources = await db.delete(disasterResources)
        .where(eq(disasterResources.isMock, true));
      summary.resources = deletedResources.rowCount || 0;

      // Delete mock incidents
      const deletedIncidents = await db.delete(disasterIncidents)
        .where(eq(disasterIncidents.isMock, true));
      summary.incidents = deletedIncidents.rowCount || 0;

      // Delete mock users (non-admin)
      const deletedUsers = await db.delete(disasterUsers)
        .where(and(
          eq(disasterUsers.isMock, true),
          ne(disasterUsers.role, 'admin')
        ));
      summary.users = deletedUsers.rowCount || 0;

      console.log('Mock data cleared:', summary);
      
      return { success: true, summary };
    } catch (error) {
      console.error('Failed to clear mock data:', error);
      return { success: false, summary: {}, error: error.message };
    }
  }

  /**
   * Perform full system reset (admin only)
   */
  static async performSystemReset(): Promise<{ success: boolean; summary: any; error?: string }> {
    try {
      console.log('Starting full system reset...');
      
      const summary = {
        incidents: 0,
        resources: 0,
        alerts: 0,
        communications: 0,
        nonAdminUsers: 0,
        logs: 0
      };

      // Delete all communications
      const deletedComms = await db.delete(disasterCommunications);
      summary.communications = deletedComms.rowCount || 0;

      // Delete all alerts
      const deletedAlerts = await db.delete(disasterAlerts);
      summary.alerts = deletedAlerts.rowCount || 0;

      // Delete all resources
      const deletedResources = await db.delete(disasterResources);
      summary.resources = deletedResources.rowCount || 0;

      // Delete all incidents
      const deletedIncidents = await db.delete(disasterIncidents);
      summary.incidents = deletedIncidents.rowCount || 0;

      // Delete all non-admin users
      const deletedUsers = await db.delete(disasterUsers)
        .where(ne(disasterUsers.role, 'admin'));
      summary.nonAdminUsers = deletedUsers.rowCount || 0;

      console.log('System reset completed:', summary);
      
      return { success: true, summary };
    } catch (error) {
      console.error('Failed to perform system reset:', error);
      return { success: false, summary: {}, error: error.message };
    }
  }

  /**
   * Get current demo mode status
   */
  static async getDemoModeStatus(): Promise<{
    isDemoMode: boolean;
    mockDataCounts: {
      incidents: number;
      resources: number;
      alerts: number;
      communications: number;
      users: number;
    };
  }> {
    try {
      // Count mock data in each table
      const [mockIncidents, mockResources, mockAlerts, mockCommunications, mockUsers] = await Promise.all([
        db.select({ count: count() }).from(disasterIncidents).where(eq(disasterIncidents.isMock, true)),
        db.select({ count: count() }).from(disasterResources).where(eq(disasterResources.isMock, true)),
        db.select({ count: count() }).from(disasterAlerts).where(eq(disasterAlerts.isMock, true)),
        db.select({ count: count() }).from(disasterCommunications).where(eq(disasterCommunications.isMock, true)),
        db.select({ count: count() }).from(disasterUsers).where(eq(disasterUsers.isMock, true))
      ]);

      const mockDataCounts = {
        incidents: mockIncidents[0]?.count || 0,
        resources: mockResources[0]?.count || 0,
        alerts: mockAlerts[0]?.count || 0,
        communications: mockCommunications[0]?.count || 0,
        users: mockUsers[0]?.count || 0
      };

      const totalMockData = Object.values(mockDataCounts).reduce((sum, count) => sum + count, 0);
      const isDemoMode = totalMockData > 0;

      return { isDemoMode, mockDataCounts };
    } catch (error) {
      console.error('Failed to get demo mode status:', error);
      return {
        isDemoMode: false,
        mockDataCounts: {
          incidents: 0,
          resources: 0,
          alerts: 0,
          communications: 0,
          users: 0
        }
      };
    }
  }
}

// Import required functions from drizzle-orm
import { eq, ne, and, count } from "drizzle-orm";

export default DemoDataGenerator;