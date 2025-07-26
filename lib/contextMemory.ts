// 🔧 Context Memory Singleton for Emergency Dialogue Sessions
// Maintains volatile memory of caller interactions for intelligent escalation

export interface SessionContext {
  threatScore: number;
  mentionedKeywords: Set<string>;
  lastUpdate: number;
  callerId: string;
  conversationHistory: Array<{
    caller: string;
    operator: string;
    timestamp: number;
  }>;
}

// Volatile session memory - resets on server restart
export const sessionMemory: Record<string, SessionContext> = {};

// Emergency keyword scoring system
export function scoreEmergencyWords(text: string): { keywords: string[], score: number } {
  const emergencyMap = {
    // Critical danger words (40% each)
    "shark": 40,
    "drowning": 40, 
    "bleeding": 40,
    "attack": 40,
    "attacked": 40,
    
    // High urgency words (30% each)
    "trouble": 30,
    "help": 30,
    "emergency": 30,
    "injured": 30,
    "fallen": 30,
    
    // Medium urgency words (20% each)
    "current": 20,
    "rip current": 30, // Special case - higher than individual "current"
    "swept": 20,
    "pulled": 20,
    "struggling": 20,
    "waving": 15,
    "shouting": 15,
    "screaming": 25,
    
    // Location/context words (10% each)
    "water": 10,
    "ocean": 10,
    "sea": 10,
    "beach": 10,
    "swimming": 10
  };
  
  const lower = text.toLowerCase();
  const found: string[] = [];
  let totalScore = 0;
  
  // Check for each emergency keyword
  Object.entries(emergencyMap).forEach(([keyword, score]) => {
    if (lower.includes(keyword)) {
      found.push(keyword);
      totalScore += score;
    }
  });
  
  return { keywords: found, score: Math.min(totalScore, 100) }; // Cap at 100%
}

// Get or create session context
export function getSessionContext(callerId: string): SessionContext {
  if (!sessionMemory[callerId]) {
    sessionMemory[callerId] = {
      threatScore: 0,
      mentionedKeywords: new Set(),
      lastUpdate: Date.now(),
      callerId,
      conversationHistory: []
    };
  }
  return sessionMemory[callerId];
}

// Update session with new input
export function updateSessionContext(
  callerId: string, 
  callerInput: string, 
  operatorResponse: string
): SessionContext {
  const context = getSessionContext(callerId);
  const { keywords, score } = scoreEmergencyWords(callerInput);
  
  // Update keywords and threat score
  keywords.forEach(k => context.mentionedKeywords.add(k));
  context.threatScore = Math.min(context.threatScore + score, 100);
  context.lastUpdate = Date.now();
  
  // Add to conversation history
  context.conversationHistory.push({
    caller: callerInput,
    operator: operatorResponse,
    timestamp: Date.now()
  });
  
  return context;
}

// Generate intelligent escalating response based on context
export function generateEscalatingResponse(context: SessionContext, latestInput: string): {
  response: string;
  shouldDispatch: boolean;
  escalationLevel: 'initial' | 'gathering' | 'escalating' | 'dispatched';
} {
  const { threatScore, mentionedKeywords } = context;
  
  // Emergency dispatch threshold (60%+)
  if (threatScore >= 60) {
    return {
      response: "Emergency confirmed. Stay on the line. Dispatching responders now. Where exactly is the person located?",
      shouldDispatch: true,
      escalationLevel: 'dispatched'
    };
  }
  
  // High urgency - escalating (40-59%)
  if (threatScore >= 40) {
    return {
      response: "This appears to be a developing emergency. Are lifeguards present? What's the exact location? Can you see the person now?",
      shouldDispatch: false,
      escalationLevel: 'escalating'
    };
  }
  
  // Medium urgency - gathering information (20-39%)
  if (threatScore >= 20) {
    return {
      response: "Help me understand the situation better - what's the person's current condition? Are they responsive?",
      shouldDispatch: false,
      escalationLevel: 'gathering'
    };
  }
  
  // Initial contact - standard response
  return {
    response: "I'm here to help. Can you tell me what's happening? Is anyone in immediate danger?",
    shouldDispatch: false,
    escalationLevel: 'initial'
  };
}

// Clean up old sessions (5+ minutes idle)
export function cleanupOldSessions(): void {
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  Object.keys(sessionMemory).forEach(callerId => {
    if (sessionMemory[callerId].lastUpdate < fiveMinutesAgo) {
      delete sessionMemory[callerId];
    }
  });
}

// Reset specific session
export function resetSession(callerId: string): void {
  delete sessionMemory[callerId];
}