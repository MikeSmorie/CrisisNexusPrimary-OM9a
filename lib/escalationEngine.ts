// 🔧 Intelligent Escalation Engine — Reacts to Retraction, Escalation, Contradiction
// Enhanced version of the emergency escalation system with state management

type EscalationState = "none" | "pending" | "active" | "retracted" | "false_report" | "reactivated_case";

export interface EscalationSession {
  level: EscalationState;
  lastText: string;
  confirmedThreats: Set<string>;
  retractionFlag: boolean;
  retractionConfirmed: boolean;
  conversationTurns: number;
  initialThreatTime?: number;
  reactivated: boolean;
}

export const escalationMemory: Record<string, EscalationSession> = {};

export interface EscalationResult {
  aiResponse: string;
  routeToResponder: boolean;
  escalationLevel: EscalationState;
  responderNotice: string;
  incidentCode?: string;
  shouldBlock: boolean;
}

export function processEscalation(callerId: string, transcribedText: string): EscalationResult {
  // Get or create session
  const session = escalationMemory[callerId] ?? {
    level: "none",
    lastText: "",
    confirmedThreats: new Set(),
    retractionFlag: false,
    retractionConfirmed: false,
    conversationTurns: 0,
    reactivated: false
  };

  const text = transcribedText.toLowerCase();
  session.lastText = transcribedText;
  session.conversationTurns++;

  // Enhanced threat detection
  const isThreat = /shark|blood|gun|fire|injured|missing|attack|drowning|emergency|help|trapped|accident|screaming/.test(text);
  
  // Enhanced retraction detection
  const isRetraction = /just kidding|not really|i made it up|wasn't serious|false alarm|joking|kidding|made up|fake|lie/.test(text);
  
  // Sarcastic or dismissive responses
  const isSarcastic = /don't you think it's funny|lol|haha|funny|hilarious|joke|prank/.test(text);
  
  // Apology or correction detection for reactivation
  const isApologyOrCorrection = /sorry|mistake|meant to|this is real|still ongoing|continuing|actually happening|i was wrong/.test(text);

  // STEP 1: Check for reactivation of false report cases
  if (session.level === "false_report" && isApologyOrCorrection && isThreat) {
    session.level = "reactivated_case";
    session.reactivated = true;
    session.retractionConfirmed = false;
    session.retractionFlag = false;
    
    // Extract new threat words for reactivated case
    const threatWords = text.match(/shark|blood|gun|fire|injured|missing|attack|drowning|emergency|help|trapped|accident|screaming/g) || [];
    threatWords.forEach(threat => session.confirmedThreats.add(threat));
  }
  // STEP 2: Process retractions and sarcasm (only if not reactivated)
  else if (isRetraction || isSarcastic) {
    if (session.level === "active" || session.level === "pending") {
      session.retractionFlag = true;
      session.level = "retracted";
    }
    if (session.retractionFlag && (isRetraction || isSarcastic)) {
      session.retractionConfirmed = true;
      session.level = "false_report";
    }
  } 
  // STEP 3: Process threat escalation
  else if (isThreat) {
    // Extract specific threat words
    const threatWords = text.match(/shark|blood|gun|fire|injured|missing|attack|drowning|emergency|help|trapped|accident/g) || [];
    threatWords.forEach(threat => session.confirmedThreats.add(threat));
    
    if (session.level === "retracted") {
      // Re-escalating after retraction - suspicious
      session.level = "pending";
    } else if (session.level === "none") {
      session.level = "pending";
      session.initialThreatTime = Date.now();
    } else if (session.level === "pending" && session.conversationTurns >= 2) {
      session.level = "active";
    }
  }

  // Update session memory
  escalationMemory[callerId] = session;

  // Generate responses based on escalation state
  return generateEscalationResponse(session);
}

function generateEscalationResponse(session: EscalationSession): EscalationResult {
  let aiResponse = "";
  let responderNotice = "";
  let routeToResponder = false;
  let incidentCode = "";
  let shouldBlock = false;

  const threatList = Array.from(session.confirmedThreats).join(", ");

  switch (session.level) {
    case "pending":
      aiResponse = "Emergency confirmed. Stay on the line. Please describe exactly what you're seeing now.";
      responderNotice = `⚡ Threat confirmed: ${threatList}. Awaiting additional details.`;
      routeToResponder = true;
      break;

    case "active":
      aiResponse = "EMERGENCY CONFIRMED. Units are being dispatched. Stay on the line. How many people are involved? Are they conscious and responding?";
      responderNotice = `🚨 FULL DISPATCH ACTIVE: ${threatList}. Multiple threat indicators confirmed.`;
      routeToResponder = true;
      break;

    case "retracted":
      aiResponse = "⚠️ WARNING: Your statements contradict your earlier emergency report. Please clarify immediately - is this a real emergency or not?";
      responderNotice = `⚠️ CONTRADICTION DETECTED: Caller retracted prior threat (${threatList}). PAUSE full deployment pending clarification.`;
      routeToResponder = true; // Still route but with warning
      break;

    case "reactivated_case":
      aiResponse = "⚠️ Emergency session reactivated based on updated information. Please reconfirm: Where is the incident happening now? Describe the current situation.";
      responderNotice = `🔄 CASE REACTIVATED: Caller provided correction after false report flag (${threatList}). Proceeding with caution - verify legitimacy.`;
      routeToResponder = true;
      incidentCode = "REACTIVATED_CASE_UNDER_REVIEW";
      shouldBlock = false;
      break;

    case "false_report":
      aiResponse = "🚨 You are flagged for false emergency reporting. This is a criminal offense punishable by law. Your call details and device information have been logged for investigation.";
      responderNotice = `❌ EMERGENCY LOG CANCELLED: Caller confirmed false report (${threatList}). Admin review required. NO DISPATCH.`;
      routeToResponder = false;
      incidentCode = "FALSE_EMERGENCY";
      shouldBlock = true;
      break;

    default:
      aiResponse = "Please describe the emergency situation in detail. What exactly is happening?";
      responderNotice = "Initial assessment - gathering information.";
      routeToResponder = false;
  }

  return {
    aiResponse,
    routeToResponder,
    escalationLevel: session.level,
    responderNotice,
    incidentCode: incidentCode || undefined,
    shouldBlock
  };
}

export function getEscalationSession(callerId: string): EscalationSession | undefined {
  return escalationMemory[callerId];
}

export function clearEscalationSession(callerId: string): void {
  delete escalationMemory[callerId];
}

// Cleanup old sessions (older than 1 hour)
export function cleanupEscalationSessions(): void {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  
  Object.keys(escalationMemory).forEach(callerId => {
    const session = escalationMemory[callerId];
    if (session.initialThreatTime && session.initialThreatTime < oneHourAgo) {
      delete escalationMemory[callerId];
    }
  });
}