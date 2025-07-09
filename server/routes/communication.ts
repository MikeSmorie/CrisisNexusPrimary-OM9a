import { Router } from "express";
import { db } from "@db";
import { disasterCommunications, disasterUsers } from "@db/disaster-schema";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

// Get channel health status
router.get("/api/communication/channels/status", async (req, res) => {
  try {
    // Mock channel status data for demonstration
    const channelStatuses = [
      {
        channel: 'satellite',
        available: true,
        latency: Math.floor(Math.random() * 300) + 200, // 200-500ms
        lastTest: new Date(),
        errorRate: Math.random() * 0.05, // 0-5%
        bandwidth: 2048
      },
      {
        channel: 'internet',
        available: Math.random() > 0.05, // 95% uptime
        latency: Math.floor(Math.random() * 100) + 50, // 50-150ms
        lastTest: new Date(),
        errorRate: Math.random() * 0.02, // 0-2%
        bandwidth: 50000
      },
      {
        channel: 'gsm',
        available: Math.random() > 0.15, // 85% uptime
        latency: Math.floor(Math.random() * 1500) + 800, // 800-2300ms
        lastTest: new Date(),
        errorRate: Math.random() * 0.1, // 0-10%
        bandwidth: 384
      },
      {
        channel: 'mesh',
        available: Math.random() > 0.3, // 70% uptime
        latency: Math.floor(Math.random() * 2000) + 2000, // 2000-4000ms
        lastTest: new Date(),
        errorRate: Math.random() * 0.25, // 0-25%
        bandwidth: 56
      },
      {
        channel: 'offline',
        available: true,
        latency: 0,
        lastTest: new Date(),
        errorRate: 0,
        bandwidth: 0
      }
    ];

    res.json(channelStatuses);
  } catch (error) {
    console.error('Error fetching channel status:', error);
    res.status(500).json({ error: 'Failed to fetch channel status' });
  }
});

// Test specific channel
router.post("/api/communication/channels/:channel/test", async (req, res) => {
  try {
    const { channel } = req.params;
    
    // Simulate channel testing with different response times
    const testLatency = {
      satellite: () => Math.floor(Math.random() * 400) + 300,
      internet: () => Math.floor(Math.random() * 100) + 30,
      gsm: () => Math.floor(Math.random() * 2000) + 500,
      mesh: () => Math.floor(Math.random() * 3000) + 1000,
      offline: () => 0
    };

    const latency = testLatency[channel as keyof typeof testLatency]?.() || 1000;
    const available = latency < 5000; // Fail if latency too high

    await new Promise(resolve => setTimeout(resolve, Math.min(latency, 1000)));

    res.json({
      channel,
      available,
      latency,
      timestamp: new Date(),
      status: available ? 'operational' : 'failed'
    });
  } catch (error) {
    console.error('Error testing channel:', error);
    res.status(500).json({ error: 'Channel test failed' });
  }
});

// Send message through failover system
router.post("/api/communication/send", async (req, res) => {
  try {
    const { toUserId, content, priority = 'normal', channel, incidentId } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Optimize content based on channel
    let optimizedContent = content;
    switch (channel) {
      case 'gsm':
        // SMS optimization - 160 characters
        optimizedContent = content.substring(0, 160);
        break;
      case 'mesh':
        // Ultra-compressed for mesh networks
        optimizedContent = content.substring(0, 50);
        break;
      case 'satellite':
        // Bandwidth optimization for satellite
        if (content.length > 500) {
          optimizedContent = content.substring(0, 500) + '...';
        }
        break;
    }

    // Store message in database
    const [message] = await db.insert(disasterCommunications).values({
      fromUser: req.user.id,
      toUser: toUserId || null,
      content: optimizedContent,
      messageType: priority === 'critical' ? 'urgent' : 'status_update',
      priority,
      channel: channel || 'satellite',
      incidentId: incidentId || null,
      isMock: false
    }).returning();

    res.json({
      success: true,
      messageId: message.id,
      channel: channel || 'satellite',
      optimized: optimizedContent !== content,
      originalLength: content.length,
      sentLength: optimizedContent.length
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get recent communications
router.get("/api/communication/messages", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const messages = await db
      .select({
        id: disasterCommunications.id,
        content: disasterCommunications.content,
        messageType: disasterCommunications.messageType,
        priority: disasterCommunications.priority,
        channel: disasterCommunications.channel,
        createdAt: disasterCommunications.createdAt,
        acknowledgedAt: disasterCommunications.acknowledgedAt,
        fromUserName: disasterUsers.username,
        isMock: disasterCommunications.isMock
      })
      .from(disasterCommunications)
      .leftJoin(disasterUsers, eq(disasterCommunications.fromUser, disasterUsers.id))
      .where(
        and(
          eq(disasterCommunications.isMock, false)
        )
      )
      .orderBy(desc(disasterCommunications.createdAt))
      .limit(50);

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Emergency broadcast
router.post("/api/communication/emergency-broadcast", async (req, res) => {
  try {
    const { message, severity = 'emergency', targetZones } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'commander') {
      return res.status(403).json({ error: 'Insufficient permissions for emergency broadcast' });
    }

    // Send broadcast message through all available channels
    const channels = ['satellite', 'internet', 'gsm', 'mesh'];
    const broadcasts = [];

    for (const channel of channels) {
      const [broadcast] = await db.insert(disasterCommunications).values({
        fromUser: req.user.id,
        toUser: null, // Broadcast to all
        content: `[EMERGENCY BROADCAST] ${message}`,
        messageType: 'urgent',
        priority: 'critical',
        channel,
        isMock: false
      }).returning();

      broadcasts.push(broadcast);
    }

    res.json({
      success: true,
      broadcastCount: broadcasts.length,
      channels,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error sending emergency broadcast:', error);
    res.status(500).json({ error: 'Failed to send emergency broadcast' });
  }
});

// Get offline queue status
router.get("/api/communication/offline-queue", async (req, res) => {
  try {
    // In a real implementation, this would check actual offline storage
    // For now, return mock data
    const queueCount = Math.floor(Math.random() * 10);
    
    res.json({
      queuedMessages: queueCount,
      lastSync: new Date(Date.now() - Math.random() * 60 * 60 * 1000), // Last hour
      estimatedDeliveryTime: queueCount > 0 ? Math.ceil(queueCount * 2) : 0 // 2 minutes per message
    });
  } catch (error) {
    console.error('Error fetching offline queue:', error);
    res.status(500).json({ error: 'Failed to fetch offline queue' });
  }
});

// Process offline queue
router.post("/api/communication/process-offline-queue", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Simulate processing offline messages
    const processedCount = Math.floor(Math.random() * 5) + 1;
    
    res.json({
      success: true,
      processedMessages: processedCount,
      remainingInQueue: 0,
      processingTime: processedCount * 1.5 // 1.5 seconds per message
    });
  } catch (error) {
    console.error('Error processing offline queue:', error);
    res.status(500).json({ error: 'Failed to process offline queue' });
  }
});

export default router;