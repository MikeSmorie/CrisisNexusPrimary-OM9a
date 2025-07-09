import { db } from "@db";
import { 
  communicationChannels, 
  failoverLogs, 
  multiChannelMessages, 
  voiceTextCache, 
  emergencyBroadcasts,
  type SelectCommunicationChannel,
  type InsertFailoverLog,
  type InsertMultiChannelMessage,
  type InsertVoiceTextCache,
  type InsertEmergencyBroadcast
} from "@db/communication-schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export class CommunicationService {
  private static instance: CommunicationService;
  private readonly TIMEOUT_THRESHOLD = 3000; // 3 seconds
  private readonly HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private healthCheckTimer: NodeJS.Timer | null = null;

  private constructor() {
    this.initializeChannels();
    this.startHealthChecks();
  }

  public static getInstance(): CommunicationService {
    if (!CommunicationService.instance) {
      CommunicationService.instance = new CommunicationService();
    }
    return CommunicationService.instance;
  }

  // Initialize default communication channels
  private async initializeChannels() {
    try {
      const existingChannels = await db.select().from(communicationChannels).limit(1);
      if (existingChannels.length === 0) {
        await db.insert(communicationChannels).values([
          {
            channelType: "satellite",
            channelName: "Tier-1 Satellite Comms Provider",
            priority: 1,
            latency: 500,
            bandwidth: 10000,
            reliability: "99.9",
            configuration: JSON.stringify({
              provider: "generic_satellite",
              frequency: "Ka-band",
              coverage: "global",
              encryption: "AES-256"
            })
          },
          {
            channelType: "internet",
            channelName: "Internet/WiFi/Fiber",
            priority: 2,
            latency: 50,
            bandwidth: 100000,
            reliability: "95.0",
            configuration: JSON.stringify({
              protocols: ["websocket", "https"],
              fallback_formats: ["video", "audio", "text"],
              cdn_enabled: true
            })
          },
          {
            channelType: "gsm",
            channelName: "GSM Network (2G-5G)",
            priority: 3,
            latency: 200,
            bandwidth: 1000,
            reliability: "90.0",
            configuration: JSON.stringify({
              sms_enabled: true,
              data_enabled: true,
              location_triangulation: true,
              emergency_services: true
            })
          },
          {
            channelType: "mesh_helium",
            channelName: "Mesh + Helium Miners",
            priority: 4,
            latency: 2000,
            bandwidth: 100,
            reliability: "70.0",
            configuration: JSON.stringify({
              mesh_protocol: "helium",
              max_hops: 10,
              encryption: "end_to_end",
              offline_capable: true
            })
          },
          {
            channelType: "offline_cache",
            channelName: "Voice-to-Text Offline Cache",
            priority: 5,
            latency: 0,
            bandwidth: 0,
            reliability: "100.0",
            configuration: JSON.stringify({
              voice_recognition: true,
              offline_storage: true,
              auto_sync: true,
              encryption: "device_level"
            })
          }
        ]);
      }
    } catch (error) {
      console.error("Failed to initialize communication channels:", error);
    }
  }

  // Start health check monitoring
  private startHealthChecks() {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthChecks();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  // Stop health check monitoring
  public stopHealthChecks() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  // Perform health checks on all channels
  private async performHealthChecks() {
    try {
      const channels = await db.select().from(communicationChannels)
        .where(eq(communicationChannels.isEnabled, true))
        .orderBy(asc(communicationChannels.priority));

      for (const channel of channels) {
        const health = await this.checkChannelHealth(channel);
        await db.update(communicationChannels)
          .set({
            status: health.status,
            latency: health.latency,
            reliability: health.reliability.toString(),
            lastHealthCheck: new Date(),
            updatedAt: new Date()
          })
          .where(eq(communicationChannels.id, channel.id));
      }
    } catch (error) {
      console.error("Health check failed:", error);
    }
  }

  // Check individual channel health
  private async checkChannelHealth(channel: SelectCommunicationChannel) {
    const startTime = Date.now();
    
    try {
      switch (channel.channelType) {
        case "satellite":
          return await this.checkSatelliteHealth(channel);
        case "internet":
          return await this.checkInternetHealth(channel);
        case "gsm":
          return await this.checkGsmHealth(channel);
        case "mesh_helium":
          return await this.checkMeshHeliumHealth(channel);
        case "offline_cache":
          return await this.checkOfflineCacheHealth(channel);
        default:
          return {
            status: "failed" as const,
            latency: 0,
            reliability: "0.0"
          };
      }
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        status: "failed" as const,
        latency,
        reliability: "0.0"
      };
    }
  }

  // Channel-specific health checks
  private async checkSatelliteHealth(channel: SelectCommunicationChannel) {
    // Simulate satellite health check
    const latency = Math.random() * 1000 + 300; // 300-1300ms
    const reliability = Math.random() * 5 + 95; // 95-100%
    
    return {
      status: latency > this.TIMEOUT_THRESHOLD ? "degraded" : "active" as const,
      latency: Math.round(latency),
      reliability: reliability.toFixed(1)
    };
  }

  private async checkInternetHealth(channel: SelectCommunicationChannel) {
    // Simulate internet connectivity check
    const latency = Math.random() * 200 + 20; // 20-220ms
    const reliability = Math.random() * 10 + 90; // 90-100%
    
    return {
      status: latency > this.TIMEOUT_THRESHOLD ? "degraded" : "active" as const,
      latency: Math.round(latency),
      reliability: reliability.toFixed(1)
    };
  }

  private async checkGsmHealth(channel: SelectCommunicationChannel) {
    // Simulate GSM network check
    const latency = Math.random() * 500 + 100; // 100-600ms
    const reliability = Math.random() * 15 + 85; // 85-100%
    
    return {
      status: latency > this.TIMEOUT_THRESHOLD ? "degraded" : "active" as const,
      latency: Math.round(latency),
      reliability: reliability.toFixed(1)
    };
  }

  private async checkMeshHeliumHealth(channel: SelectCommunicationChannel) {
    // Simulate mesh network check
    const latency = Math.random() * 2000 + 500; // 500-2500ms
    const reliability = Math.random() * 30 + 70; // 70-100%
    
    return {
      status: latency > this.TIMEOUT_THRESHOLD ? "degraded" : "active" as const,
      latency: Math.round(latency),
      reliability: reliability.toFixed(1)
    };
  }

  private async checkOfflineCacheHealth(channel: SelectCommunicationChannel) {
    // Offline cache is always available
    return {
      status: "active" as const,
      latency: 0,
      reliability: "100.0"
    };
  }

  // Get optimal channel for message delivery
  public async getOptimalChannel(priority: string = "normal"): Promise<SelectCommunicationChannel | null> {
    try {
      const channels = await db.select().from(communicationChannels)
        .where(and(
          eq(communicationChannels.isEnabled, true),
          eq(communicationChannels.status, "active")
        ))
        .orderBy(asc(communicationChannels.priority));

      // For critical messages, prefer satellite
      if (priority === "critical" || priority === "high") {
        return channels.find(c => c.channelType === "satellite") || channels[0] || null;
      }

      // For normal messages, prefer internet if available
      return channels.find(c => c.channelType === "internet") || channels[0] || null;
    } catch (error) {
      console.error("Failed to get optimal channel:", error);
      return null;
    }
  }

  // Send message with automatic failover
  public async sendMessage(messageData: Omit<InsertMultiChannelMessage, "messageId" | "createdAt">): Promise<string> {
    const messageId = uuidv4();
    const message: InsertMultiChannelMessage = {
      ...messageData,
      messageId,
      createdAt: new Date()
    };

    try {
      // Get optimal channel
      const primaryChannel = await this.getOptimalChannel(messageData.priority);
      if (!primaryChannel) {
        throw new Error("No communication channels available");
      }

      message.primaryChannel = primaryChannel.id;
      message.actualChannel = primaryChannel.id;

      // Insert message into database
      await db.insert(multiChannelMessages).values(message);

      // Attempt to send through primary channel
      const success = await this.attemptDelivery(message, primaryChannel);
      
      if (!success) {
        // Initiate failover process
        await this.initiateFailover(message, primaryChannel);
      }

      return messageId;
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    }
  }

  // Attempt message delivery through specific channel
  private async attemptDelivery(message: InsertMultiChannelMessage, channel: SelectCommunicationChannel): Promise<boolean> {
    try {
      switch (channel.channelType) {
        case "satellite":
          return await this.deliverViaSatellite(message, channel);
        case "internet":
          return await this.deliverViaInternet(message, channel);
        case "gsm":
          return await this.deliverViaGsm(message, channel);
        case "mesh_helium":
          return await this.deliverViaMeshHelium(message, channel);
        case "offline_cache":
          return await this.deliverViaOfflineCache(message, channel);
        default:
          return false;
      }
    } catch (error) {
      console.error(`Delivery failed via ${channel.channelType}:`, error);
      return false;
    }
  }

  // Channel-specific delivery methods
  private async deliverViaSatellite(message: InsertMultiChannelMessage, channel: SelectCommunicationChannel): Promise<boolean> {
    // Simulate satellite delivery
    const deliveryTime = Math.random() * 2000 + 500; // 500-2500ms
    await new Promise(resolve => setTimeout(resolve, deliveryTime));
    
    const success = Math.random() > 0.05; // 95% success rate
    if (success) {
      await this.updateMessageStatus(message.messageId, "delivered");
    }
    return success;
  }

  private async deliverViaInternet(message: InsertMultiChannelMessage, channel: SelectCommunicationChannel): Promise<boolean> {
    // Simulate internet delivery
    const deliveryTime = Math.random() * 500 + 50; // 50-550ms
    await new Promise(resolve => setTimeout(resolve, deliveryTime));
    
    const success = Math.random() > 0.1; // 90% success rate
    if (success) {
      await this.updateMessageStatus(message.messageId, "delivered");
    }
    return success;
  }

  private async deliverViaGsm(message: InsertMultiChannelMessage, channel: SelectCommunicationChannel): Promise<boolean> {
    // Simulate GSM delivery
    const deliveryTime = Math.random() * 1000 + 200; // 200-1200ms
    await new Promise(resolve => setTimeout(resolve, deliveryTime));
    
    const success = Math.random() > 0.15; // 85% success rate
    if (success) {
      await this.updateMessageStatus(message.messageId, "delivered");
    }
    return success;
  }

  private async deliverViaMeshHelium(message: InsertMultiChannelMessage, channel: SelectCommunicationChannel): Promise<boolean> {
    // Simulate mesh network delivery
    const deliveryTime = Math.random() * 3000 + 1000; // 1-4 seconds
    await new Promise(resolve => setTimeout(resolve, deliveryTime));
    
    const success = Math.random() > 0.3; // 70% success rate
    if (success) {
      await this.updateMessageStatus(message.messageId, "delivered");
    }
    return success;
  }

  private async deliverViaOfflineCache(message: InsertMultiChannelMessage, channel: SelectCommunicationChannel): Promise<boolean> {
    // Offline cache always succeeds but marks as offline queue
    await db.update(multiChannelMessages)
      .set({
        deliveryStatus: "delivered",
        offlineQueue: true,
        deliveredAt: new Date()
      })
      .where(eq(multiChannelMessages.messageId, message.messageId));
    
    return true;
  }

  // Update message delivery status
  private async updateMessageStatus(messageId: string, status: string) {
    await db.update(multiChannelMessages)
      .set({
        deliveryStatus: status,
        deliveredAt: new Date()
      })
      .where(eq(multiChannelMessages.messageId, messageId));
  }

  // Initiate failover process
  private async initiateFailover(message: InsertMultiChannelMessage, failedChannel: SelectCommunicationChannel) {
    try {
      // Get next available channel
      const availableChannels = await db.select().from(communicationChannels)
        .where(and(
          eq(communicationChannels.isEnabled, true),
          eq(communicationChannels.status, "active")
        ))
        .orderBy(asc(communicationChannels.priority));

      const nextChannel = availableChannels.find(c => c.priority > failedChannel.priority);
      
      if (!nextChannel) {
        // All channels failed - mark as failed
        await this.updateMessageStatus(message.messageId, "failed");
        return;
      }

      // Log failover event
      const failoverLog: InsertFailoverLog = {
        fromChannel: failedChannel.id,
        toChannel: nextChannel.id,
        reason: "timeout",
        triggeredBy: message.fromUser,
        incidentId: message.incidentId,
        latencyBefore: failedChannel.latency,
        latencyAfter: nextChannel.latency,
        messagesPending: 1,
        timestamp: new Date()
      };

      await db.insert(failoverLogs).values(failoverLog);

      // Update message with new channel
      await db.update(multiChannelMessages)
        .set({
          actualChannel: nextChannel.id,
          fallbackAttempts: (message.fallbackAttempts || 0) + 1
        })
        .where(eq(multiChannelMessages.messageId, message.messageId));

      // Attempt delivery through new channel
      const success = await this.attemptDelivery(message, nextChannel);
      
      if (!success) {
        // Continue failover cascade
        await this.initiateFailover(message, nextChannel);
      }
    } catch (error) {
      console.error("Failover process failed:", error);
      await this.updateMessageStatus(message.messageId, "failed");
    }
  }

  // Process voice to text
  public async processVoiceMessage(voiceData: Omit<InsertVoiceTextCache, "id" | "timestamp">): Promise<string> {
    try {
      const voiceRecord: InsertVoiceTextCache = {
        ...voiceData,
        timestamp: new Date()
      };

      // Insert voice record
      const [result] = await db.insert(voiceTextCache).values(voiceRecord).returning();

      // Simulate voice-to-text processing
      const transcription = await this.transcribeVoice(voiceData.originalAudio || "");
      
      // Update with transcription
      await db.update(voiceTextCache)
        .set({
          transcribedText: transcription,
          confidence: "85.50",
          processedAt: new Date()
        })
        .where(eq(voiceTextCache.id, result.id));

      return transcription;
    } catch (error) {
      console.error("Voice processing failed:", error);
      throw error;
    }
  }

  // Simulate voice transcription
  private async transcribeVoice(audioData: string): Promise<string> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock transcription
    return "Emergency situation reported in sector 7. Requesting immediate assistance.";
  }

  // Send emergency broadcast
  public async sendEmergencyBroadcast(broadcastData: Omit<InsertEmergencyBroadcast, "broadcastId" | "createdAt">): Promise<string> {
    const broadcastId = uuidv4();
    const broadcast: InsertEmergencyBroadcast = {
      ...broadcastData,
      broadcastId,
      createdAt: new Date()
    };

    try {
      // Insert broadcast record
      await db.insert(emergencyBroadcasts).values(broadcast);

      // Send to all specified channels
      const channels = JSON.parse(broadcast.channels || "[]");
      const deliveryStats = {
        total: channels.length,
        successful: 0,
        failed: 0
      };

      for (const channelId of channels) {
        const channel = await db.select().from(communicationChannels)
          .where(eq(communicationChannels.id, channelId))
          .limit(1);

        if (channel.length > 0) {
          const success = await this.broadcastToChannel(broadcast, channel[0]);
          if (success) {
            deliveryStats.successful++;
          } else {
            deliveryStats.failed++;
          }
        }
      }

      // Update delivery statistics
      await db.update(emergencyBroadcasts)
        .set({
          deliveryStats: JSON.stringify(deliveryStats)
        })
        .where(eq(emergencyBroadcasts.broadcastId, broadcastId));

      return broadcastId;
    } catch (error) {
      console.error("Emergency broadcast failed:", error);
      throw error;
    }
  }

  // Broadcast to specific channel
  private async broadcastToChannel(broadcast: InsertEmergencyBroadcast, channel: SelectCommunicationChannel): Promise<boolean> {
    try {
      // Simulate broadcast delivery
      const deliveryTime = Math.random() * 1000 + 200;
      await new Promise(resolve => setTimeout(resolve, deliveryTime));
      
      // Higher success rate for emergency broadcasts
      return Math.random() > 0.02; // 98% success rate
    } catch (error) {
      console.error(`Broadcast failed to ${channel.channelType}:`, error);
      return false;
    }
  }

  // Get channel status for dashboard
  public async getChannelStatus() {
    try {
      return await db.select().from(communicationChannels)
        .orderBy(asc(communicationChannels.priority));
    } catch (error) {
      console.error("Failed to get channel status:", error);
      return [];
    }
  }

  // Get failover logs
  public async getFailoverLogs(limit: number = 50) {
    try {
      return await db.select().from(failoverLogs)
        .orderBy(desc(failoverLogs.timestamp))
        .limit(limit);
    } catch (error) {
      console.error("Failed to get failover logs:", error);
      return [];
    }
  }

  // Get message history
  public async getMessageHistory(userId?: number, limit: number = 100) {
    try {
      const query = db.select().from(multiChannelMessages)
        .orderBy(desc(multiChannelMessages.createdAt))
        .limit(limit);

      if (userId) {
        return await query.where(eq(multiChannelMessages.fromUser, userId));
      }

      return await query;
    } catch (error) {
      console.error("Failed to get message history:", error);
      return [];
    }
  }
}

// Export singleton instance
export const communicationService = CommunicationService.getInstance();