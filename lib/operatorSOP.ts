// 🔧 Emergency SOP Logic — Deductive Threat Reasoning + Professional Operator Protocols

export interface EmergencyContext {
  hasThreat: boolean;
  hasInjury: boolean;
  locationKnown: boolean;
  callerWorried: boolean;
  threatLevel: number;
  conversationTurns: number;
}

export function getFollowUpQuestions(context: EmergencyContext): string[] {
  const questions: string[] = [];

  // Priority 1: Location (CRITICAL for all emergencies)
  if (!context.locationKnown) {
    questions.push("I need your exact location immediately - what street, what beach, what building?");
    return questions; // Location is blocking - get this first
  }

  // Priority 2: Immediate danger assessment
  if (context.hasThreat && !context.hasInjury) {
    questions.push("How many people are involved? Are they conscious and responding?");
  }

  // Priority 3: Medical condition
  if (context.hasInjury) {
    questions.push("Is there visible bleeding? Are they breathing? Are they responsive to you?");
  }

  // Priority 4: Clarification for worried callers
  if (context.callerWorried && !context.hasThreat && !context.hasInjury) {
    questions.push("Tell me exactly what you're seeing that concerns you - what made you call for help?");
  }

  // Default: Keep them talking
  if (questions.length === 0) {
    questions.push("Stay on the line - tell me what's happening right now, what you can see.");
  }

  return questions;
}

// 🔧 PATCH: Smart Threat-Aware Interrogation
export function getContextualQuestions(context: {
  history: string[];
  threatWords: string[];
  missingPeople: boolean;
  bloodSeen: boolean;
  reducedHeadcount: boolean;
}): string[] {
  const q: string[] = [];

  if (context.bloodSeen && !context.missingPeople)
    q.push("You said there's blood in the water — is someone visibly bleeding?");
  if (context.reducedHeadcount)
    q.push("You said one swimmer is missing — can you see where they went under?");
  if (context.threatWords.includes("shark"))
    q.push("Is the shark still visible? Is it circling or moving away?");
  if (!q.length)
    q.push("Please describe what you're seeing now. Is there still panic?");

  return q;
}

export function assessEmergencyContext(text: string, conversationHistory: string[]): EmergencyContext {
  const lower = text.toLowerCase();
  const fullConversation = conversationHistory.join(' ').toLowerCase();
  
  // Threat detection
  const threatWords = /shark|attack|drowning|bleeding|unconscious|trapped|stuck|fire|explosion|accident|crash|help|emergency|danger/;
  const hasThreat = threatWords.test(lower) || threatWords.test(fullConversation);
  
  // Injury detection
  const injuryWords = /bitten|blood|bleeding|unconscious|injured|collapsed|not breathing|hurt|pain/;
  const hasInjury = injuryWords.test(lower) || injuryWords.test(fullConversation);
  
  // Location detection
  const locationWords = /at|near|beach|street|mall|corner|intersection|camps bay|clifton|sea point|address/;
  const locationKnown = locationWords.test(lower) || locationWords.test(fullConversation);
  
  // Caller concern level
  const worryWords = /trouble|help|think|worried|in danger|can you|please|something wrong/;
  const callerWorried = worryWords.test(lower) || worryWords.test(fullConversation);
  
  // Calculate threat level
  let threatLevel = 0;
  if (hasThreat) threatLevel += 40;
  if (hasInjury) threatLevel += 35;
  if (callerWorried) threatLevel += 15;
  if (locationKnown) threatLevel += 10; // Having location adds urgency
  
  return {
    hasThreat,
    hasInjury,
    locationKnown,
    callerWorried,
    threatLevel: Math.min(threatLevel, 100),
    conversationTurns: conversationHistory.length
  };
}

export function shouldDispatchEmergency(context: EmergencyContext): boolean {
  // Immediate dispatch conditions
  if (context.hasThreat && context.hasInjury) return true;
  if (context.threatLevel >= 60) return true;
  if (context.hasThreat && context.locationKnown) return true;
  
  return false;
}

export function generateOperatorResponse(context: EmergencyContext, latestInput: string): {
  response: string;
  shouldDispatch: boolean;
  escalationLevel: string;
} {
  const questions = getFollowUpQuestions(context);
  const shouldDispatch = shouldDispatchEmergency(context);
  
  if (shouldDispatch) {
    return {
      response: "EMERGENCY CONFIRMED. Units are being dispatched. Stay on the line. " + questions[0],
      shouldDispatch: true,
      escalationLevel: 'DISPATCHED'
    };
  }
  
  if (context.threatLevel >= 40) {
    return {
      response: "This sounds like an emergency situation. " + questions[0],
      shouldDispatch: false,
      escalationLevel: 'ESCALATING'
    };
  }
  
  if (context.threatLevel >= 20) {
    return {
      response: questions[0],
      shouldDispatch: false,
      escalationLevel: 'GATHERING'
    };
  }
  
  return {
    response: "911 Emergency - What is your exact location and what is the emergency?",
    shouldDispatch: false,
    escalationLevel: 'INITIAL'
  };
}