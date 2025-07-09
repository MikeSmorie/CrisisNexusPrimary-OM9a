import { Router } from "express";
import { communicationService } from "../../lib/communication-service";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

const router = Router();

// Validation schemas
const sendMessageSchema = z.object({
  toUser: z.number().optional(),
  incidentId: z.number().optional(),
  content: z.string().min(1),
  messageFormat: z.enum(["text", "audio", "video", "image", "emergency_broadcast"]).default("text"),
  priority: z.enum(["low", "normal", "high", "critical"]).default("normal")
});

const voiceMessageSchema = z.object({
  originalAudio: z.string(),
  incidentId: z.number().optional(),
  isOffline: z.boolean().default(false),
  metadata: z.object({
    deviceId: z.string().optional(),
    location: z.string().optional(),
    timestamp: z.string().optional()
  }).optional()
});

const emergencyBroadcastSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  targetZones: z.string().optional(),
  targetRoles: z.string().optional(),
  channels: z.string(),
  priority: z.enum(["low", "normal", "high", "critical"]).default("high"),
  messageFormat: z.enum(["text", "audio", "video", "image", "emergency_broadcast"]).default("text"),
  activeUntil: z.string().optional()
});

// Get communication channel status
router.get("/channels", async (req, res) => {
  try {
    const channels = await communicationService.getChannelStatus();
    res.json(channels);
  } catch (error) {
    console.error("Failed to get channel status:", error);
    res.status(500).json({ error: "Failed to retrieve channel status" });
  }
});

// Get failover logs
router.get("/failover-logs", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = await communicationService.getFailoverLogs(limit);
    res.json(logs);
  } catch (error) {
    console.error("Failed to get failover logs:", error);
    res.status(500).json({ error: "Failed to retrieve failover logs" });
  }
});

// Get message history
router.get("/messages", async (req, res) => {
  try {
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const limit = parseInt(req.query.limit as string) || 100;
    const messages = await communicationService.getMessageHistory(userId, limit);
    res.json(messages);
  } catch (error) {
    console.error("Failed to get message history:", error);
    res.status(500).json({ error: "Failed to retrieve message history" });
  }
});

// Send message with automatic failover
router.post("/send", async (req, res) => {
  try {
    const result = sendMessageSchema.safeParse(req.body);
    if (!result.success) {
      const error = fromZodError(result.error);
      return res.status(400).json({ error: error.toString() });
    }

    const messageData = {
      ...result.data,
      fromUser: req.user?.id,
      createdAt: new Date()
    };

    const messageId = await communicationService.sendMessage(messageData);
    
    res.json({ 
      success: true, 
      messageId,
      message: "Message sent successfully with automatic failover protection"
    });
  } catch (error) {
    console.error("Failed to send message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Process voice message
router.post("/voice", async (req, res) => {
  try {
    const result = voiceMessageSchema.safeParse(req.body);
    if (!result.success) {
      const error = fromZodError(result.error);
      return res.status(400).json({ error: error.toString() });
    }

    const voiceData = {
      ...result.data,
      userId: req.user?.id,
      timestamp: new Date()
    };

    const transcription = await communicationService.processVoiceMessage(voiceData);
    
    res.json({ 
      success: true, 
      transcription,
      message: "Voice message processed successfully"
    });
  } catch (error) {
    console.error("Failed to process voice message:", error);
    res.status(500).json({ error: "Failed to process voice message" });
  }
});

// Send emergency broadcast
router.post("/broadcast", async (req, res) => {
  try {
    // Check if user has permission for emergency broadcasts
    if (!req.user || !['admin', 'commander'].includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions for emergency broadcast" });
    }

    const result = emergencyBroadcastSchema.safeParse(req.body);
    if (!result.success) {
      const error = fromZodError(result.error);
      return res.status(400).json({ error: error.toString() });
    }

    const broadcastData = {
      ...result.data,
      issuedBy: req.user.id,
      activeUntil: result.data.activeUntil ? new Date(result.data.activeUntil) : null,
      createdAt: new Date()
    };

    const broadcastId = await communicationService.sendEmergencyBroadcast(broadcastData);
    
    res.json({ 
      success: true, 
      broadcastId,
      message: "Emergency broadcast sent successfully"
    });
  } catch (error) {
    console.error("Failed to send emergency broadcast:", error);
    res.status(500).json({ error: "Failed to send emergency broadcast" });
  }
});

// Get optimal channel for priority level
router.get("/optimal-channel", async (req, res) => {
  try {
    const priority = req.query.priority as string || "normal";
    const channel = await communicationService.getOptimalChannel(priority);
    
    if (!channel) {
      return res.status(503).json({ error: "No communication channels available" });
    }
    
    res.json(channel);
  } catch (error) {
    console.error("Failed to get optimal channel:", error);
    res.status(500).json({ error: "Failed to get optimal channel" });
  }
});

// Health check endpoint
router.get("/health", async (req, res) => {
  try {
    const channels = await communicationService.getChannelStatus();
    const activeChannels = channels.filter(c => c.status === "active" && c.isEnabled);
    
    res.json({
      status: activeChannels.length > 0 ? "operational" : "degraded",
      totalChannels: channels.length,
      activeChannels: activeChannels.length,
      channels: channels.map(c => ({
        type: c.channelType,
        name: c.channelName,
        status: c.status,
        priority: c.priority,
        latency: c.latency,
        reliability: c.reliability
      }))
    });
  } catch (error) {
    console.error("Communication health check failed:", error);
    res.status(500).json({ 
      status: "error",
      error: "Health check failed" 
    });
  }
});

export default router;