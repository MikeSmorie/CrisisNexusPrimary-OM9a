// 🔧 Context Memory Singleton for Emergency Dialogue Sessions
// Maintains volatile memory of caller interactions for intelligent escalation

export interface SessionContext {
  threatScore: number;
  mentionedKeywords: Set<string>;
  lastUpdate: number;
  callerId: string;
  escalationLevel: number; // Added for smart interrogation
  activeThreats: Set<string>; // Added for contextual questions
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
      escalationLevel: 0,
      activeThreats: new Set(),
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
  
  // Update escalation level based on conversation length and threat score
  context.escalationLevel = Math.min(
    Math.floor(context.conversationHistory.length / 2) + 
    Math.floor(context.threatScore / 30), 
    5
  );
  
  // Track active threats for contextual questioning
  const threatWords = ['shark', 'drowning', 'bleeding', 'attack', 'trapped', 'fire', 'accident'];
  threatWords.forEach(threat => {
    if (callerInput.toLowerCase().includes(threat)) {
      context.activeThreats.add(threat);
    }
  });
  
  // Add to conversation history
  context.conversationHistory.push({
    caller: callerInput,
    operator: operatorResponse,
    timestamp: Date.now()
  });
  
  return context;
}

import { assessEmergencyContext, generateOperatorResponse } from './operatorSOP';
import { detectCrankCall, shouldEscalateToAdmin, logCrankCall } from './crankDetector';

// Enhanced 911 SOP-compliant response generation with crank detection
export function generateEscalatingResponse(context: SessionContext, latestInput: string): {
  response: string;
  shouldDispatch: boolean;
  escalationLevel: 'initial' | 'gathering' | 'escalating' | 'dispatched';
  dispatchSummary?: string;
  crankDetected?: boolean;
  escalateToAdmin?: boolean;
} {
  const conversationHistory = context.conversationHistory.map(h => h.caller);
  
  // Step 1: Check for crank call with enhanced escalation logic
  const crankAnalysis = detectCrankCall(latestInput, conversationHistory);
  const isHighEscalation = (context.escalationLevel || 0) >= 2;
  
  if (crankAnalysis.isCrank && isHighEscalation) {
    logCrankCall(context.callerId, latestInput, crankAnalysis.indicators);
    
    return {
      response: "🚨 This is a criminal act. False reports endanger lives. Your identity and device fingerprint have been logged. Authorities will be notified.",
      shouldDispatch: false,
      escalationLevel: 'initial',
      crankDetected: true,
      escalateToAdmin: true
    };
  } else if (crankAnalysis.isCrank) {
    logCrankCall(context.callerId, latestInput, crankAnalysis.indicators);
    
    return {
      response: crankAnalysis.warningMessage || "This appears to be a false report. Emergency services are for genuine emergencies only.",
      shouldDispatch: false, // CRITICAL: Block all dispatch for crank calls
      escalationLevel: 'initial',
      crankDetected: true,
      escalateToAdmin: shouldEscalateToAdmin(crankAnalysis)
    };
  }
  
  // Step 2: Assess emergency context using deductive reasoning
  const emergencyContext = assessEmergencyContext(latestInput, conversationHistory);
  
  // Step 3: Update critical info extraction
  updateCriticalInfo(context, latestInput);
  
  // Step 4: Generate response using enhanced SOP logic
  const sopResponse = generateOperatorResponse(emergencyContext, latestInput);
  
  // Step 5: Create dispatch summary if needed
  let dispatchSummary: string | undefined;
  if (sopResponse.shouldDispatch) {
    dispatchSummary = generateDispatchSummary(context);
  }
  
  // Map SOP escalation levels to our system
  const escalationMap: Record<string, 'initial' | 'gathering' | 'escalating' | 'dispatched'> = {
    'INITIAL': 'initial',
    'GATHERING': 'gathering', 
    'ESCALATING': 'escalating',
    'DISPATCHED': 'dispatched'
  };
  
  return {
    response: sopResponse.response,
    shouldDispatch: sopResponse.shouldDispatch,
    escalationLevel: escalationMap[sopResponse.escalationLevel] || 'gathering',
    dispatchSummary,
    crankDetected: false,
    escalateToAdmin: false
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