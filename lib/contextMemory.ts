// 🔧 Context Memory Singleton for Emergency Dialogue Sessions
// Maintains volatile memory of caller interactions for intelligent escalation

import { assessEmergencyContext, generateOperatorResponse } from './operatorSOP';
import { detectCrankCall, shouldEscalateToAdmin, logCrankCall } from './crankDetector';
import { processEscalation } from './escalationEngine';
import { assessThreatSeverity, generateOperatorResponse as generateProfessionalResponse } from './threatAssessment';

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
    // CRITICAL DISPATCH TRIGGERS - Immediate 80%+ score
    "shark": 80,        // Shark = immediate critical threat
    "shark attack": 90,
    "blood in water": 85,
    "missing swimmer": 85,
    "disappeared": 70,  // Person disappeared = critical
    "fin circling": 90,
    
    // Critical danger words (60% each)
    "drowning": 60, 
    "bleeding": 50,
    "attack": 50,
    "attacked": 50,
    "stuck": 50,        // CRITICAL: stuck under car = immediate dispatch
    "trapped": 45,
    "crushed": 50,
    "pinned": 45,
    "panicking": 40,    // Multiple people panicking = serious
    "swimmers": 30,     // Combined with other words increases score
    
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

// Enhanced 911 SOP-compliant response generation with professional threat assessment
export function generateEscalatingResponse(context: SessionContext, latestInput: string): {
  response: string;
  shouldDispatch: boolean;
  escalationLevel: 'initial' | 'gathering' | 'escalating' | 'dispatched';
  dispatchSummary?: string;
  crankDetected?: boolean;
  escalateToAdmin?: boolean;
  threatAssessment?: any;
} {
  const conversationHistory = context.conversationHistory.map(h => h.caller);
  
  // Step 1: Professional threat assessment using real 911 protocols
  const threatAssessment = assessThreatSeverity(latestInput, conversationHistory);
  
  // Step 2: Use intelligent escalation engine for enhanced retraction/contradiction handling
  const escalationResult = processEscalation(context.callerId, latestInput);
  
  // Handle false reports detected by escalation engine
  if (escalationResult.shouldBlock) {
    logCrankCall(context.callerId, latestInput, ['Escalation engine detected false report']);
    
    return {
      response: escalationResult.aiResponse,
      shouldDispatch: false,
      escalationLevel: 'initial',
      crankDetected: true,
      escalateToAdmin: true,
      dispatchSummary: undefined
    };
  }
  
  // Handle contradiction/retraction states
  if (escalationResult.escalationLevel === 'retracted') {
    return {
      response: escalationResult.aiResponse,
      shouldDispatch: false, // Pause dispatch for contradictions
      escalationLevel: 'gathering',
      crankDetected: false,
      escalateToAdmin: false,
      dispatchSummary: undefined
    };
  }
  
  // Handle reactivated cases with special caution
  if (escalationResult.escalationLevel === 'reactivated_case') {
    updateCriticalInfo(context, latestInput);
    
    // Check if this is a successful recovery from false flag
    const isRecoveredFromMisflag = escalationResult.incidentCode === "REACTIVATED_CASE_UNDER_REVIEW" && 
                                  escalationResult.responderNotice?.includes('RECOVERED FROM MISFLAG');
    
    return {
      response: escalationResult.aiResponse,
      shouldDispatch: isRecoveredFromMisflag, // Allow dispatch for successful recoveries
      escalationLevel: isRecoveredFromMisflag ? 'dispatched' : 'gathering',
      crankDetected: false,
      escalateToAdmin: false,
      dispatchSummary: isRecoveredFromMisflag ? generateDispatchSummary(context) : undefined
    };
  }
  
  // Check for traditional crank patterns as backup
  const crankAnalysis = detectCrankCall(latestInput, conversationHistory);
  if (crankAnalysis.isCrank && crankAnalysis.confidence >= 80) {
    logCrankCall(context.callerId, latestInput, crankAnalysis.indicators);
    
    return {
      response: "🚨 This is a criminal act. False reports endanger lives. Your identity and device fingerprint have been logged. Authorities will be notified.",
      shouldDispatch: false,
      escalationLevel: 'initial',
      crankDetected: true,
      escalateToAdmin: true
    };
  }
  
  // Step 2: Process legitimate emergency using professional threat assessment + escalation engine
  const shouldDispatch = threatAssessment.immediateDispatch || 
                        threatAssessment.severityScore >= 4 ||
                        escalationResult.routeToResponder;
  
  // Use professional threat assessment response if severity warrants it
  let response: string;
  if (threatAssessment.severityScore >= 6) {
    response = generateProfessionalResponse(threatAssessment, latestInput);
  } else if (escalationResult.routeToResponder) {
    response = escalationResult.aiResponse;
  } else {
    response = generateProfessionalResponse(threatAssessment, latestInput);
  }
  
  if (shouldDispatch) {
    // Update critical info extraction
    updateCriticalInfo(context, latestInput);
    
    // Create dispatch summary for active emergencies
    let dispatchSummary: string | undefined;
    if (escalationResult.escalationLevel === 'active') {
      dispatchSummary = generateDispatchSummary(context);
    }
    
    // Map escalation states to our system
    const escalationMap: Record<string, 'initial' | 'gathering' | 'escalating' | 'dispatched'> = {
      'none': 'initial',
      'pending': 'gathering',
      'active': 'dispatched',
      'retracted': 'escalating',
      'false_report': 'initial',
      'reactivated_case': 'gathering'
    };
    
    return {
      response,
      shouldDispatch: true,
      escalationLevel: 'dispatched',
      dispatchSummary: generateDispatchSummary(context, threatAssessment),
      crankDetected: false,
      escalateToAdmin: shouldEscalateToAdmin(context.threatScore, false),
      threatAssessment
    };
  }
  
  // Step 3: Fallback to traditional SOP for initial assessment
  const emergencyContext = assessEmergencyContext(latestInput, conversationHistory);
  updateCriticalInfo(context, latestInput);
  const sopResponse = generateOperatorResponse(emergencyContext, latestInput);
  
  return {
    response: response,
    shouldDispatch: false, // Initial assessment, no dispatch yet
    escalationLevel: 'initial',
    dispatchSummary: undefined,
    crankDetected: false,
    escalateToAdmin: false,
    threatAssessment
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

// Generate comprehensive dispatch summary following 911 standards with professional threat assessment
function generateDispatchSummary(context: SessionContext, threatAssessment?: any): string {
  const info = context.criticalInfo;
  const keywords = Array.from(context.mentionedKeywords).join(', ');
  
  // Use professional threat assessment if available
  let threatLevel = `${context.threatScore}% - ${context.threatScore >= 80 ? 'CRITICAL' : context.threatScore >= 60 ? 'HIGH' : 'ELEVATED'}`;
  let responseUnits = info.responderNeeded || 'Multi-unit response';
  
  if (threatAssessment) {
    threatLevel = `${Math.round(threatAssessment.severityScore * 10)}% - ${threatAssessment.category}`;
    if (threatAssessment.requiredUnits.length > 0) {
      responseUnits = threatAssessment.requiredUnits.join(' + ');
    }
  }
  
  return `EMERGENCY DISPATCH SUMMARY:
📍 LOCATION: ${info.location || 'Unknown - CRITICAL'}
🚨 INCIDENT TYPE: ${info.incidentType || 'Emergency situation'}
👥 VICTIMS: ${info.numberOfVictims || 'Unknown number'}
🩺 CONDITION: ${info.currentCondition || 'Assessment needed'}
🚒 RESPONSE UNITS: ${responseUnits}
⚠️ HAZARDS: ${info.hazards?.join(', ') || 'Standard precautions'}
📞 CALLER: ${info.callerRelation || 'Unknown relation'}
🔍 KEYWORDS: ${keywords}
⭐ THREAT LEVEL: ${threatLevel}
${threatAssessment?.reasoning ? '\n🧠 ASSESSMENT: ' + threatAssessment.reasoning.join('; ') : ''}

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