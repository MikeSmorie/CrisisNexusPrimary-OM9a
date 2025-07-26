import { Router, Request, Response } from 'express';

const router = Router();

// Simple auth check (from existing routes pattern)
const requireAuth = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Not authenticated" });
};

// Enhanced threat analysis using OpenAI GPT-4 for intelligent emergency assessment
router.post('/analyze-threat', requireAuth, async (req: Request, res: Response) => {
  try {
    const { context, analysisType } = req.body;

    if (!context || analysisType !== 'emergency_threat_assessment') {
      return res.status(400).json({ error: 'Invalid analysis request' });
    }

    // Check if OpenAI API key is available
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return res.status(500).json({ error: 'OpenAI API not configured' });
    }

    const systemPrompt = `You are an expert emergency dispatcher analyzing potential crisis situations. Analyze the conversation history for threat level, urgency, and appropriate response.

CRITICAL GUIDELINES:
- Life-threatening situations (dying, drowning, bleeding, unconscious) = 95-100% threat level
- Water rescues with distress signals = 80-95% threat level  
- Medical emergencies with specific symptoms = 70-90% threat level
- Vague requests for help = 30-60% threat level
- Greetings or casual conversation = 0-20% threat level

Respond with JSON in this exact format:
{
  "threatLevel": <number 0-100>,
  "urgency": "<low|medium|high|critical>",
  "situationType": "<brief description>",
  "keyFactors": ["<factor1>", "<factor2>"],
  "nextQuestion": "<question to ask caller>",
  "shouldDispatch": <boolean>,
  "dispatchSummary": "<summary if dispatching>"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this emergency conversation:\n\n${context}` }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);

    // Validate the response structure
    const requiredFields = ['threatLevel', 'urgency', 'situationType', 'keyFactors', 'nextQuestion', 'shouldDispatch'];
    const hasAllFields = requiredFields.every(field => field in analysis);

    if (!hasAllFields) {
      throw new Error('Invalid analysis response format');
    }

    res.json(analysis);
  } catch (error) {
    console.error('Threat analysis error:', error);
    
    // Fallback to local analysis if OpenAI fails
    const fallbackAnalysis = generateFallbackAnalysis(req.body.context);
    res.json(fallbackAnalysis);
  }
});

function generateFallbackAnalysis(context: string): any {
  const text = context.toLowerCase();
  let threatLevel = 0;
  const keyFactors: string[] = [];
  
  // Life-threatening patterns
  if (/dying|drowning|bleeding|unconscious|not breathing/.test(text)) {
    threatLevel = 95;
    keyFactors.push('Life-threatening situation detected');
  }
  // Water rescue patterns
  else if (/swimming|water|ocean/.test(text) && /trouble|help|distress/.test(text)) {
    threatLevel = 85;
    keyFactors.push('Water rescue scenario');
  }
  // Medical emergency patterns
  else if (/injured|hurt|medical|pain/.test(text)) {
    threatLevel = 70;
    keyFactors.push('Medical emergency indicated');
  }
  // General help requests
  else if (/help|emergency|urgent/.test(text)) {
    threatLevel = 50;
    keyFactors.push('Help requested');
  }
  // Greetings or casual
  else if (/hello|hi|how are you/.test(text)) {
    threatLevel = 10;
    keyFactors.push('Casual conversation');
  }
  
  const urgency = threatLevel >= 80 ? 'critical' : 
                  threatLevel >= 60 ? 'high' : 
                  threatLevel >= 40 ? 'medium' : 'low';
  
  const shouldDispatch = threatLevel >= 80;
  
  return {
    threatLevel,
    urgency,
    situationType: shouldDispatch ? 'Emergency dispatch required' : 'Information gathering',
    keyFactors,
    nextQuestion: shouldDispatch ? 
      'Emergency services are being dispatched. Can you describe the current situation?' :
      'Can you provide more details about what\'s happening?',
    shouldDispatch,
    dispatchSummary: shouldDispatch ? keyFactors.join(' | ') : undefined
  };
}

export default router;