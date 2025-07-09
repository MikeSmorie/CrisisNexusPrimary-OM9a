import { db } from "@db";
import { disasterCommunications, disasterUsers, disasterIncidents } from "@db/schema";
import { eq, and } from "drizzle-orm";

// Communication channel types and priorities
export const COMMUNICATION_CHANNELS = {
  SATELLITE: 'satellite',
  INTERNET: 'internet', 
  GSM: 'gsm',
  MESH: 'mesh',
  OFFLINE: 'offline'
} as const;

export type CommunicationChannel = typeof COMMUNICATION_CHANNELS[keyof typeof COMMUNICATION_CHANNELS];

export interface ChannelStatus {
  channel: CommunicationChannel;
  available: boolean;
  latency: number;
  lastTest: Date;
  errorRate: number;
  bandwidth: number; // kbps
}

export interface FailoverConfig {
  primaryChannel: CommunicationChannel;
  fallbackSequence: CommunicationChannel[];
  timeoutThreshold: number; // seconds
  retryAttempts: number;
  testInterval: number; // minutes
}

export interface OfflineMessage {
  id: string;
  content: string;
  voiceData?: ArrayBuffer;
  timestamp: Date;
  priority: 'low' | 'normal' | 'high' | 'critical';
  location?: { lat: number; lng: number };
  encrypted: boolean;
}

export class CommunicationFailoverSystem {
  private channelStatuses: Map<CommunicationChannel, ChannelStatus> = new Map();
  private offlineQueue: OfflineMessage[] = [];
  private activeChannel: CommunicationChannel = COMMUNICATION_CHANNELS.SATELLITE;
  private config: FailoverConfig;

  constructor() {
    this.config = {
      primaryChannel: COMMUNICATION_CHANNELS.SATELLITE,
      fallbackSequence: [
        COMMUNICATION_CHANNELS.INTERNET,
        COMMUNICATION_CHANNELS.GSM,
        COMMUNICATION_CHANNELS.MESH,
        COMMUNICATION_CHANNELS.OFFLINE
      ],
      timeoutThreshold: 3,
      retryAttempts: 3,
      testInterval: 5
    };

    this.initializeChannels();
    this.startChannelMonitoring();
  }

  private initializeChannels() {
    // Initialize all communication channels with default status
    Object.values(COMMUNICATION_CHANNELS).forEach(channel => {
      this.channelStatuses.set(channel, {
        channel,
        available: channel === COMMUNICATION_CHANNELS.SATELLITE, // Satellite is primary
        latency: 0,
        lastTest: new Date(),
        errorRate: 0,
        bandwidth: this.getDefaultBandwidth(channel)
      });
    });
  }

  private getDefaultBandwidth(channel: CommunicationChannel): number {
    switch (channel) {
      case COMMUNICATION_CHANNELS.SATELLITE: return 2048; // 2 Mbps
      case COMMUNICATION_CHANNELS.INTERNET: return 50000; // 50 Mbps
      case COMMUNICATION_CHANNELS.GSM: return 384; // 384 kbps (3G)
      case COMMUNICATION_CHANNELS.MESH: return 56; // 56 kbps
      case COMMUNICATION_CHANNELS.OFFLINE: return 0; // No bandwidth
      default: return 1024;
    }
  }

  private startChannelMonitoring() {
    setInterval(() => {
      this.testAllChannels();
    }, this.config.testInterval * 60 * 1000);
  }

  async testAllChannels(): Promise<void> {
    const testPromises = Array.from(this.channelStatuses.keys()).map(channel => 
      this.testChannel(channel)
    );
    
    await Promise.allSettled(testPromises);
    this.selectOptimalChannel();
  }

  private async testChannel(channel: CommunicationChannel): Promise<void> {
    const startTime = Date.now();
    let available = false;
    let latency = 0;

    try {
      switch (channel) {
        case COMMUNICATION_CHANNELS.SATELLITE:
          available = await this.testSatelliteConnection();
          break;
        case COMMUNICATION_CHANNELS.INTERNET:
          available = await this.testInternetConnection();
          break;
        case COMMUNICATION_CHANNELS.GSM:
          available = await this.testGSMConnection();
          break;
        case COMMUNICATION_CHANNELS.MESH:
          available = await this.testMeshConnection();
          break;
        case COMMUNICATION_CHANNELS.OFFLINE:
          available = true; // Always available as last resort
          break;
      }

      latency = Date.now() - startTime;
    } catch (error) {
      console.error(`Channel test failed for ${channel}:`, error);
      available = false;
      latency = this.config.timeoutThreshold * 1000;
    }

    const status = this.channelStatuses.get(channel);
    if (status) {
      status.available = available;
      status.latency = latency;
      status.lastTest = new Date();
      if (!available) {
        status.errorRate = Math.min(status.errorRate + 0.1, 1.0);
      } else {
        status.errorRate = Math.max(status.errorRate - 0.05, 0);
      }
    }
  }

  private async testSatelliteConnection(): Promise<boolean> {
    // Simulate satellite connection test
    // In real implementation, this would ping satellite endpoints
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(Math.random() > 0.05); // 95% availability
      }, Math.random() * 1000 + 500);
    });
  }

  private async testInternetConnection(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', { 
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeoutThreshold * 1000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async testGSMConnection(): Promise<boolean> {
    // Simulate GSM network test
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(Math.random() > 0.15); // 85% availability
      }, Math.random() * 2000 + 1000);
    });
  }

  private async testMeshConnection(): Promise<boolean> {
    // Simulate mesh network test (Helium miners)
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(Math.random() > 0.3); // 70% availability
      }, Math.random() * 3000 + 2000);
    });
  }

  private selectOptimalChannel(): void {
    // Try primary channel first
    let optimal = this.channelStatuses.get(this.config.primaryChannel);
    
    if (!optimal?.available || optimal.latency > this.config.timeoutThreshold * 1000) {
      // Fallback through sequence
      for (const channel of this.config.fallbackSequence) {
        const status = this.channelStatuses.get(channel);
        if (status?.available && status.latency <= this.config.timeoutThreshold * 1000) {
          optimal = status;
          break;
        }
      }
    }

    if (optimal && optimal.channel !== this.activeChannel) {
      console.log(`Switching communication channel from ${this.activeChannel} to ${optimal.channel}`);
      this.activeChannel = optimal.channel;
      this.logFailoverEvent(this.activeChannel, optimal.channel);
    }
  }

  async sendMessage(message: {
    fromUserId: number;
    toUserId: number;
    content: string;
    priority: 'low' | 'normal' | 'high' | 'critical';
    incidentId?: number;
    voiceData?: ArrayBuffer;
  }): Promise<boolean> {
    const selectedChannel = this.activeChannel;
    const channelStatus = this.channelStatuses.get(selectedChannel);

    if (!channelStatus?.available) {
      // Store for offline delivery
      this.queueOfflineMessage({
        id: crypto.randomUUID(),
        content: message.content,
        voiceData: message.voiceData,
        timestamp: new Date(),
        priority: message.priority,
        encrypted: true
      });
      return false;
    }

    try {
      switch (selectedChannel) {
        case COMMUNICATION_CHANNELS.SATELLITE:
          return await this.sendViaSatellite(message);
        case COMMUNICATION_CHANNELS.INTERNET:
          return await this.sendViaInternet(message);
        case COMMUNICATION_CHANNELS.GSM:
          return await this.sendViaGSM(message);
        case COMMUNICATION_CHANNELS.MESH:
          return await this.sendViaMesh(message);
        case COMMUNICATION_CHANNELS.OFFLINE:
          this.queueOfflineMessage({
            id: crypto.randomUUID(),
            content: message.content,
            voiceData: message.voiceData,
            timestamp: new Date(),
            priority: message.priority,
            encrypted: true
          });
          return true;
        default:
          return false;
      }
    } catch (error) {
      console.error(`Failed to send via ${selectedChannel}:`, error);
      
      // Try next available channel
      for (const fallbackChannel of this.config.fallbackSequence) {
        const fallbackStatus = this.channelStatuses.get(fallbackChannel);
        if (fallbackStatus?.available) {
          this.activeChannel = fallbackChannel;
          return await this.sendMessage(message);
        }
      }
      
      return false;
    }
  }

  private async sendViaSatellite(message: any): Promise<boolean> {
    // High-priority satellite communication
    const optimizedContent = this.optimizeForBandwidth(message.content, 2048);
    
    // Store in database with satellite channel marker
    await db.insert(disasterCommunications).values({
      fromUser: message.fromUserId,
      toUser: message.toUserId,
      content: optimizedContent,
      messageType: 'urgent',
      priority: message.priority,
      channel: 'satellite',
      incidentId: message.incidentId,
      isMock: false
    });

    return true;
  }

  private async sendViaInternet(message: any): Promise<boolean> {
    // Standard internet delivery with WebSocket support
    await db.insert(disasterCommunications).values({
      fromUser: message.fromUserId,
      toUser: message.toUserId,
      content: message.content,
      messageType: 'status_update',
      priority: message.priority,
      channel: 'internet',
      incidentId: message.incidentId,
      isMock: false
    });

    return true;
  }

  private async sendViaGSM(message: any): Promise<boolean> {
    // SMS-optimized delivery (160 char limit)
    const smsContent = this.optimizeForSMS(message.content);
    
    await db.insert(disasterCommunications).values({
      fromUser: message.fromUserId,
      toUser: message.toUserId,
      content: smsContent,
      messageType: 'radio',
      priority: message.priority,
      channel: 'gsm',
      incidentId: message.incidentId,
      isMock: false
    });

    return true;
  }

  private async sendViaMesh(message: any): Promise<boolean> {
    // Mesh network via Helium miners - ultra-compressed
    const meshContent = this.optimizeForMesh(message.content);
    
    await db.insert(disasterCommunications).values({
      fromUser: message.fromUserId,
      toUser: message.toUserId,
      content: meshContent,
      messageType: 'radio',
      priority: message.priority,
      channel: 'mesh',
      incidentId: message.incidentId,
      isMock: false
    });

    return true;
  }

  private optimizeForBandwidth(content: string, maxBandwidth: number): string {
    if (maxBandwidth < 1000) {
      // Low bandwidth - compress heavily
      return content.substring(0, 100) + (content.length > 100 ? '...' : '');
    }
    return content;
  }

  private optimizeForSMS(content: string): string {
    // SMS 160 character limit
    const urgent = content.includes('URGENT') || content.includes('CRITICAL');
    const prefix = urgent ? '[URGENT] ' : '';
    const maxLength = 160 - prefix.length;
    
    return prefix + content.substring(0, maxLength);
  }

  private optimizeForMesh(content: string): string {
    // Ultra-compressed for mesh networks
    const codes = {
      'emergency': 'EMG',
      'medical': 'MED',
      'fire': 'FIR',
      'police': 'POL',
      'status': 'STA',
      'update': 'UPD',
      'request': 'REQ',
      'acknowledged': 'ACK'
    };

    let compressed = content.toLowerCase();
    Object.entries(codes).forEach(([word, code]) => {
      compressed = compressed.replace(new RegExp(word, 'g'), code);
    });

    return compressed.substring(0, 50);
  }

  private queueOfflineMessage(message: OfflineMessage): void {
    this.offlineQueue.push(message);
    
    // Store locally (in real app, this would use IndexedDB)
    localStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue));
  }

  async processOfflineQueue(): Promise<void> {
    if (this.activeChannel === COMMUNICATION_CHANNELS.OFFLINE) {
      return; // Still offline
    }

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const message of queue) {
      try {
        // Convert offline message back to sendable format
        await this.sendMessage({
          fromUserId: 1, // System user for delayed messages
          toUserId: 1, // Broadcast
          content: `[DELAYED RELAY ${message.timestamp.toISOString()}] ${message.content}`,
          priority: message.priority
        });
      } catch (error) {
        console.error('Failed to send queued message:', error);
        this.offlineQueue.push(message); // Re-queue
      }
    }

    // Update local storage
    localStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue));
  }

  private async logFailoverEvent(fromChannel: CommunicationChannel, toChannel: CommunicationChannel): Promise<void> {
    // In a real implementation, this would log to a failover_logs table
    console.log(`Failover event: ${fromChannel} → ${toChannel} at ${new Date().toISOString()}`);
  }

  getChannelStatuses(): ChannelStatus[] {
    return Array.from(this.channelStatuses.values());
  }

  getCurrentChannel(): CommunicationChannel {
    return this.activeChannel;
  }

  isOnline(): boolean {
    return this.activeChannel !== COMMUNICATION_CHANNELS.OFFLINE;
  }

  // Voice-to-text processing for offline scenarios
  async processVoiceMessage(audioBlob: Blob): Promise<string> {
    // In real implementation, this would use speech recognition API
    // For now, return placeholder
    return "[Voice message recorded - awaiting transcription]";
  }
}

// Global instance
export const failoverSystem = new CommunicationFailoverSystem();