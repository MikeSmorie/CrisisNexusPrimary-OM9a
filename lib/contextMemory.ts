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
  // Enhanced 911 SOP data collection
  criticalInfo: {
    location?: string;
    exactAddress?: string;
    incidentType?: string;
    numberOfVictims?: number;
    currentCondition?: string;
    callerRelation?: string; // witness, victim, bystander
    responderNeeded?: string; // police, fire, ems, lifeguard
    immediateActions?: string[];
    hazards?: string[];
    accessInstructions?: string;
  };
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
    "stuck": 50,        // CRITICAL: stuck under car = immediate dispatch
    "trapped": 45,
    "crushed": 50,
    "pinned": 45,
    
    // High urgency words (30% each)
    "trouble": 30,
    "help": 30,
    "emergency": 30,
    "injured": 30,
    "fallen": 30,
    "car": 35,          // Car incidents are high urgency
    "vehicle": 30,
    "jack": 40,         // Car jack failure = very dangerous
    "fell": 35,
    "under": 40,        // Under something = trapped
    
    // Medium urgency words (20% each)
    "current": 20,
    "rip current": 30, // Special case - higher than individual "current"
    "swept": 20,
    "pulled": 20,
    "struggling": 20,
    "waving": 15,
    "shouting": 15,
    "screaming": 25,
    "accident": 25,
    "crash": 30,
    
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
      conversationHistory: [],
      criticalInfo: {}
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

// Enhanced 911 SOP-compliant response generation
export function generateEscalatingResponse(context: SessionContext, latestInput: string): {
  response: string;
  shouldDispatch: boolean;
  escalationLevel: 'initial' | 'gathering' | 'escalating' | 'dispatched';
  dispatchSummary?: string;
} {
  const { threatScore, mentionedKeywords, criticalInfo } = context;
  const lowerInput = latestInput.toLowerCase();
  
  // Extract critical information from current input
  updateCriticalInfo(context, latestInput);
  
  // Emergency dispatch threshold (60%+) - Full 911 protocol
  if (threatScore >= 60) {
    const missingCritical = getMissingCriticalInfo(context);
    
    if (missingCritical.length > 0) {
      return {
        response: `EMERGENCY CONFIRMED. Dispatching now. Critical: I need the exact ${missingCritical.join(' and ')} immediately. Stay on the line.`,
        shouldDispatch: true,
        escalationLevel: 'dispatched',
        dispatchSummary: generateDispatchSummary(context)
      };
    }
    
    return {
      response: "EMERGENCY UNITS DISPATCHED. Keep the line open. Can you tell me what immediate actions you're taking? Are there any hazards responders should know about?",
      shouldDispatch: true,
      escalationLevel: 'dispatched',
      dispatchSummary: generateDispatchSummary(context)
    };
  }
  
  // High urgency - escalating (40-59%) - Follow 911 triage
  if (threatScore >= 40) {
    const missingInfo = getMissingCriticalInfo(context);
    if (missingInfo.includes('location')) {
      return {
        response: "This is an emergency situation. I need your EXACT LOCATION immediately - what beach, what section, nearest landmark?",
        shouldDispatch: false,
        escalationLevel: 'escalating'
      };
    }
    
    return {
      response: `Emergency developing. How many people are involved? What is their current condition? Are you safe to stay and provide updates?`,
      shouldDispatch: false,
      escalationLevel: 'escalating'
    };
  }
  
  // Medium urgency - gathering information (20-39%)
  if (threatScore >= 20) {
    return {
      response: "I'm coordinating a response. Tell me exactly what you're seeing right now - are they conscious, moving, responding to you?",
      shouldDispatch: false,
      escalationLevel: 'gathering'
    };
  }
  
  // Initial contact - standard 911 opening
  return {
    response: "911 Emergency - What is your exact location and what is the emergency?",
    shouldDispatch: false,
    escalationLevel: 'initial'
  };
}

// Extract and store critical emergency information following 911 protocols
function updateCriticalInfo(context: SessionContext, input: string): void {
  const lower = input.toLowerCase();
  
  // Location extraction (critical priority #1)
  if (/camps?\s*bay|clifton|sea\s*point|hout\s*bay|muizenberg|boulders/.test(lower)) {
    const match = lower.match(/(camps?\s*bay|clifton|sea\s*point|hout\s*bay|muizenberg|boulders)/);
    if (match) context.criticalInfo.location = match[1];
  }
  
  // Incident type identification
  if (/shark|bite|bitten/.test(lower)) {
    context.criticalInfo.incidentType = 'Shark Attack';
    context.criticalInfo.responderNeeded = 'Emergency Medical Services + Marine Rescue';
  }
  if (/drowning|rip\s*current|swept/.test(lower)) {
    context.criticalInfo.incidentType = 'Water Rescue Emergency';
    context.criticalInfo.responderNeeded = 'Lifeguard + Marine Rescue';
  }
  if (/stuck.*car|trapped.*vehicle|car.*fell/.test(lower)) {
    context.criticalInfo.incidentType = 'Vehicle Entrapment';
    context.criticalInfo.responderNeeded = 'Fire Department + Emergency Medical';
  }
  
  // Victim count
  const victimMatch = lower.match(/(\d+)\s*(person|people|victim)/);
  if (victimMatch) {
    context.criticalInfo.numberOfVictims = parseInt(victimMatch[1]);
  } else if (/someone|person|he|she|victim/.test(lower) && !context.criticalInfo.numberOfVictims) {
    context.criticalInfo.numberOfVictims = 1;
  }
  
  // Current condition assessment
  if (/bleeding|blood/.test(lower)) context.criticalInfo.currentCondition = 'Active bleeding';
  if (/unconscious|not\s*moving/.test(lower)) context.criticalInfo.currentCondition = 'Unconscious/unresponsive';
  if (/waving|struggling|calling\s*help/.test(lower)) context.criticalInfo.currentCondition = 'Conscious but in distress';
  
  // Caller relationship
  if (/i\s*am|me|my/.test(lower)) context.criticalInfo.callerRelation = 'victim/involved';
  if (/i\s*see|watching|witnessed/.test(lower)) context.criticalInfo.callerRelation = 'witness';
  
  // Hazards and access
  if (/rough\s*sea|waves|current/.test(lower)) {
    context.criticalInfo.hazards = context.criticalInfo.hazards || [];
    context.criticalInfo.hazards.push('Dangerous sea conditions');
  }
  if (/rocks|reef|shallow/.test(lower)) {
    context.criticalInfo.hazards = context.criticalInfo.hazards || [];
    context.criticalInfo.hazards.push('Rocky/reef hazards');
  }
}

// Identify missing critical information for 911 dispatch
function getMissingCriticalInfo(context: SessionContext): string[] {
  const missing: string[] = [];
  
  if (!context.criticalInfo.location) missing.push('location');
  if (!context.criticalInfo.incidentType) missing.push('nature of emergency');
  if (!context.criticalInfo.numberOfVictims) missing.push('number of people involved');
  if (!context.criticalInfo.currentCondition) missing.push('victim condition');
  
  return missing;
}

// Generate comprehensive dispatch summary following 911 standards
function generateDispatchSummary(context: SessionContext): string {
  const info = context.criticalInfo;
  const keywords = Array.from(context.mentionedKeywords).join(', ');
  
  return `EMERGENCY DISPATCH SUMMARY:
📍 LOCATION: ${info.location || 'Unknown - CRITICAL'}
🚨 INCIDENT TYPE: ${info.incidentType || 'Emergency situation'}
👥 VICTIMS: ${info.numberOfVictims || 'Unknown number'}
🩺 CONDITION: ${info.currentCondition || 'Assessment needed'}
🚒 RESPONSE UNITS: ${info.responderNeeded || 'Multi-unit response'}
⚠️ HAZARDS: ${info.hazards?.join(', ') || 'Standard precautions'}
📞 CALLER: ${info.callerRelation || 'Unknown relation'}
🔍 KEYWORDS: ${keywords}
⭐ THREAT LEVEL: ${context.threatScore}% - ${context.threatScore >= 80 ? 'CRITICAL' : context.threatScore >= 60 ? 'HIGH' : 'ELEVATED'}

ONGOING COMMUNICATION: Caller remains on line for updates.`;
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