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
  flaggedForFalseReporting: boolean;
  recoveryAttempts: number;
  originalEmergencyDescription?: string;
  flaggedMessages: string[];
  recoveryWindowActive: boolean;
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
    reactivated: false,
    flaggedForFalseReporting: false,
    recoveryAttempts: 0,
    flaggedMessages: [],
    recoveryWindowActive: false
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
  
  // Enhanced recovery patterns for false report reassessment
  const isRecoveryPattern = /sorry.*meant to send that elsewhere|this emergency is ongoing|i made a mistake|please help|i was wrong|misclicked|wrong tab|accident/.test(text);
  
  // Check if message contains repeat of original emergency description
  const containsOriginalEmergency = session.originalEmergencyDescription && 
    text.includes(session.originalEmergencyDescription.toLowerCase());

  // STEP 1: Enhanced Recovery Logic for False Report Reassessment
  if (session.level === "false_report" && session.recoveryAttempts < 3) {
    session.recoveryAttempts++;
    
    // Check for recovery patterns within 3-message window
    if (isRecoveryPattern || containsOriginalEmergency || (isApologyOrCorrection && isThreat)) {
      // Unflag and reassess
      session.flaggedForFalseReporting = false;
      session.level = "reactivated_case";
      session.reactivated = true;
      session.retractionConfirmed = false;
      session.retractionFlag = false;
      session.recoveryWindowActive = false;
      
      // Store original emergency context if first threat detected
      if (!session.originalEmergencyDescription && isThreat) {
        session.originalEmergencyDescription = transcribedText;
      }
      
      // Extract threat words for reactivated case
      const threatWords = text.match(/shark|blood|gun|fire|injured|missing|attack|drowning|emergency|help|trapped|accident|screaming/g) || [];
      threatWords.forEach(threat => session.confirmedThreats.add(threat));
      
      console.log(`✅ Emergency re-evaluation complete. Dispatch resuming. Caller reinstated after clarification.`);
    }
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
      session.flaggedForFalseReporting = true;
      session.recoveryWindowActive = true;
      session.flaggedMessages.push(transcribedText);
      
      // Store original emergency context for potential recovery
      if (!session.originalEmergencyDescription && session.confirmedThreats.size > 0) {
        session.originalEmergencyDescription = session.lastText;
      }
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
      if (session.flaggedForFalseReporting === false && session.reactivated) {
        aiResponse = "We have reassessed your report based on your clarification. Emergency dispatch has resumed. Stay on the line and provide updates on the current situation.";
        responderNotice = `🧠 RECOVERED FROM MISFLAG: Caller provided valid correction (${threatList}). Emergency re-evaluation complete - dispatch resuming.`;
      } else {
        aiResponse = "⚠️ Emergency session reactivated based on updated information. Please reconfirm: Where is the incident happening now? Describe the current situation.";
        responderNotice = `🔄 CASE REACTIVATED: Caller provided correction after false report flag (${threatList}). Proceeding with caution - verify legitimacy.`;
      }
      routeToResponder = true;
      incidentCode = "REACTIVATED_CASE_UNDER_REVIEW";
      shouldBlock = false;
      break;

    case "false_report":
      if (session.recoveryAttempts >= 3) {
        aiResponse = "Your actions have been logged and forwarded to authorities. Misuse of emergency services is a serious offense.";
        responderNotice = `❌ FALSE FLAG (confirmed): Multiple recovery attempts failed (${threatList}). Admin review required. NO DISPATCH.`;
        incidentCode = "FALSE_EMERGENCY_CONFIRMED";
      } else {
        aiResponse = "🚨 You are now flagged for false emergency reporting. This is a criminal offense punishable by law. Your call details and device information have been logged for investigation.";
        responderNotice = `⚠️ FALSE FLAG (recovery window active): Caller flagged for false report (${threatList}). ${3 - session.recoveryAttempts} recovery attempts remaining.`;
        incidentCode = "FALSE_EMERGENCY";
      }
      
      routeToResponder = false;
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