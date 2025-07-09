// DisasterMng-1-OM9 AI Processing Hub
// OmegaAIR integration for emergency response AI coordination

import { Router } from 'express';
import { z } from 'zod';
import { db } from '@db/index';
import { disasterTranslations, disasterActivityLogs, disasterIncidents } from '@db/disaster-schema';
import { eq } from 'drizzle-orm';

const router = Router();

// AI Request Types for Emergency Response
const aiRequestSchema = z.object({
  type: z.enum(['incident_classification', 'translation', 'resource_allocation', 'risk_assessment', 'communication_routing']),
  context: z.string(),
  metadata: z.object({
    incidentId: z.number().optional(),
    language: z.string().optional(),
    urgency: z.enum(['low', 'normal', 'high', 'critical']).optional()
  }).optional()
});

// AI Provider Configuration for Emergency Response
interface AIProvider {
  name: string;
  available: boolean;
  priority: number;
  capabilities: string[];
}

const aiProviders: AIProvider[] = [
  { name: 'openai', available: false, priority: 1, capabilities: ['classification', 'translation', 'analysis'] },
  { name: 'claude', available: false, priority: 2, capabilities: ['classification', 'translation', 'analysis'] },
  { name: 'mistral', available: false, priority: 3, capabilities: ['classification', 'translation'] }
];

// Emergency AI Router - OmegaAIR Integration
async function sendAIRequest(type: string, context: string, metadata?: any): Promise<any> {
  console.log(`[AI-EMERGENCY] Processing ${type} request`);
  
  // Check for available providers (all disabled by default for security)
  const availableProviders = aiProviders.filter(p => p.available);
  
  if (availableProviders.length === 0) {
    console.log('[AI-EMERGENCY] No AI providers configured - using emergency fallback');
    return generateEmergencyFallbackResponse(type, context, metadata);
  }

  // Try providers in priority order
  for (const provider of availableProviders.sort((a, b) => a.priority - b.priority)) {
    try {
      const response = await processWithProvider(provider.name, type, context, metadata);
      
      // Log successful AI usage
      await logAIUsage(provider.name, type, response, metadata);
      
      return response;
    } catch (error) {
      console.error(`[AI-EMERGENCY] Provider ${provider.name} failed:`, error);
      await logAIError(provider.name, type, error as Error);
      continue;
    }
  }
  
  // All providers failed - use emergency fallback
  console.log('[AI-EMERGENCY] All providers failed - using emergency fallback');
  return generateEmergencyFallbackResponse(type, context, metadata);
}

// Emergency Fallback Response Generator
function generateEmergencyFallbackResponse(type: string, context: string, metadata?: any) {
  const timestamp = new Date().toISOString();
  
  switch (type) {
    case 'incident_classification':
      return {
        severity: 'major',
        type: 'unknown',
        urgency: 'high',
        confidence: 0.5,
        source: 'emergency_fallback',
        timestamp,
        recommendation: 'Manual review required - AI classification unavailable'
      };
      
    case 'translation':
      return {
        translatedText: `[TRANSLATION UNAVAILABLE] Original: ${context}`,
        detectedLanguage: metadata?.language || 'unknown',
        targetLanguage: 'en',
        confidence: 0.0,
        source: 'emergency_fallback',
        timestamp
      };
      
    case 'resource_allocation':
      return {
        recommendations: [],
        reasoning: 'AI resource allocation unavailable - manual assignment required',
        confidence: 0.0,
        source: 'emergency_fallback',
        timestamp
      };
      
    case 'risk_assessment':
      return {
        riskLevel: 'medium',
        factors: ['AI assessment unavailable'],
        recommendations: ['Manual risk assessment required'],
        confidence: 0.0,
        source: 'emergency_fallback',
        timestamp
      };
      
    default:
      return {
        result: 'AI processing unavailable',
        source: 'emergency_fallback',
        timestamp
      };
  }
}

// Provider Processing (Stub Implementation)
async function processWithProvider(provider: string, type: string, context: string, metadata?: any) {
  // This would integrate with actual AI providers when configured
  // For now, return structured emergency responses
  
  throw new Error(`Provider ${provider} not configured for emergency operations`);
}

// AI Usage Logging
async function logAIUsage(provider: string, type: string, response: any, metadata?: any) {
  try {
    await db.insert(disasterActivityLogs).values({
      userId: metadata?.userId || 1,
      incidentId: metadata?.incidentId || null,
      action: `ai_${type}_completed`,
      details: JSON.stringify({
        provider,
        type,
        confidence: response.confidence,
        timestamp: new Date().toISOString()
      }),
      timestamp: new Date()
    });
  } catch (error) {
    console.error('[AI-EMERGENCY] Failed to log AI usage:', error);
  }
}

// AI Error Logging
async function logAIError(provider: string, type: string, error: Error) {
  console.error(`[AI-EMERGENCY] ${provider} ${type} error:`, error.message);
}

// API Endpoints

// POST /api/disaster/ai/translate - Emergency Translation Service
router.post('/translate', async (req, res) => {
  try {
    const { text, sourceLanguage, targetLanguage = 'en', incidentId } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required for translation' });
    }

    // Check for existing translation
    const existingTranslation = await db.query.disasterTranslations.findFirst({
      where: eq(disasterTranslations.originalText, text)
    });

    if (existingTranslation) {
      return res.json({
        translatedText: existingTranslation.translatedText,
        detectedLanguage: existingTranslation.detectedLanguage,
        confidence: existingTranslation.confidenceScore,
        cached: true
      });
    }

    // Request AI translation
    const result = await sendAIRequest('translation', text, {
      language: sourceLanguage,
      incidentId,
      userId: req.user?.id
    });

    // Cache the translation
    if (result.confidence > 0.5) {
      await db.insert(disasterTranslations).values({
        originalText: text,
        detectedLanguage: result.detectedLanguage,
        translatedText: result.translatedText,
        targetLanguage,
        confidenceScore: result.confidence.toString(),
        aiProvider: result.source,
        incidentId: incidentId || null
      });
    }

    res.json(result);
  } catch (error) {
    console.error('[AI-EMERGENCY] Translation error:', error);
    res.status(500).json({ error: 'Translation service unavailable' });
  }
});

// POST /api/disaster/ai/assess - AI Incident Assessment
router.post('/assess', async (req, res) => {
  try {
    const validation = aiRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid request format' });
    }

    const { type, context, metadata } = validation.data;
    
    const result = await sendAIRequest(type, context, {
      ...metadata,
      userId: req.user?.id
    });

    res.json(result);
  } catch (error) {
    console.error('[AI-EMERGENCY] Assessment error:', error);
    res.status(500).json({ error: 'AI assessment service unavailable' });
  }
});

// GET /api/disaster/ai/providers - Check AI Provider Status
router.get('/providers', async (req, res) => {
  const providerStatus = aiProviders.map(provider => ({
    name: provider.name,
    available: provider.available,
    capabilities: provider.capabilities,
    status: provider.available ? 'online' : 'offline'
  }));

  res.json({
    providers: providerStatus,
    emergencyFallback: true,
    totalProviders: aiProviders.length,
    availableProviders: aiProviders.filter(p => p.available).length
  });
});

export default router;