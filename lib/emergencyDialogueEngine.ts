export interface DialogueState {
  stage: 'initial' | 'gathering' | 'escalating' | 'dispatched';
  threatLevel: number; // 0-100
  context: {
    location?: string;
    personInDanger?: boolean;
    typeOfThreat?: string;
    urgency?: 'low' | 'medium' | 'high' | 'critical';
    responses: string[];
  };
}

export function assessThreatLevel(input: string, currentContext: DialogueState['context']): number {
  const text = input.toLowerCase();
  let threatScore = 0;

  // Life-threatening indicators (high scoring)
  if (/dying|drowning|bleeding|unconscious|not breathing|heart attack|stroke/.test(text)) threatScore += 40;
  if (/trapped|stuck|can't move|collapsed/.test(text)) threatScore += 35;
  if (/fire|explosion|smoke|burning/.test(text)) threatScore += 35;
  if (/accident|crash|collision/.test(text)) threatScore += 30;

  // Distress indicators (medium scoring)
  if (/help|rescue|emergency|urgent/.test(text)) threatScore += 20;
  if (/trouble|danger|scared|panic/.test(text)) threatScore += 15;
  if (/pain|hurt|injured/.test(text)) threatScore += 15;

  // Specific scenario indicators
  if (/rip|current|ocean|sea|swimming/.test(text) && /trouble|help|hand/.test(text)) threatScore += 25;
  if (/cramp|cramping/.test(text) && /water|swimming/.test(text)) threatScore += 20;
  if (/raised.*hand|waving|gesturing/.test(text) && /water|beach|sea/.test(text)) threatScore += 20;

  // Location specificity adds urgency
  if (/beach|camps bay|ocean|sea|street|address/.test(text)) threatScore += 10;
  
  // Progressive concern (building narrative)
  if (currentContext.responses.length > 2 && threatScore > 0) threatScore += 10;

  return Math.min(threatScore, 100);
}

export function generateIntelligentResponse(state: DialogueState, newInput: string): {
  response: string;
  newState: DialogueState;
  shouldDispatch: boolean;
  dispatchSummary?: string;
} {
  const newThreatLevel = assessThreatLevel(newInput, state.context);
  const maxThreat = Math.max(state.threatLevel, newThreatLevel);
  
  const newState: DialogueState = {
    ...state,
    threatLevel: maxThreat,
    context: {
      ...state.context,
      responses: [...state.context.responses, newInput]
    }
  };

  // Extract key information
  if (/camps? bay|beach|ocean|sea/.test(newInput.toLowerCase())) {
    newState.context.location = extractLocation(newInput);
  }
  if (/someone|person|he|she|they/.test(newInput.toLowerCase())) {
    newState.context.personInDanger = true;
  }

  // Check for potential crank calls after multiple exchanges
  if (newState.context.responses.length > 2 && maxThreat < 30) {
    const isPotentialCrank = detectPotentialCrank(newState.context);
    if (isPotentialCrank) {
      return {
        response: generateCrankWarning(),
        newState,
        shouldDispatch: false
      };
    }
  }

  // Determine response strategy based on threat level
  if (maxThreat >= 70) {
    // High threat - immediate dispatch with intelligent summary
    const summary = generateDispatchSummary(newState.context);
    return {
      response: "Emergency services are being dispatched immediately. Stay on the line - can you see the person now? Are they still moving?",
      newState: { ...newState, stage: 'dispatched' },
      shouldDispatch: true,
      dispatchSummary: summary
    };
  } else if (maxThreat >= 45) {
    // Medium-high threat - gather critical details quickly
    newState.stage = 'escalating';
    return {
      response: generateEscalatingQuestion(newState.context),
      newState,
      shouldDispatch: false
    };
  } else if (maxThreat >= 25) {
    // Medium threat - focused information gathering
    newState.stage = 'gathering';
    return {
      response: generateGatheringQuestion(newState.context),
      newState,
      shouldDispatch: false
    };
  } else {
    // Low threat - general inquiry
    return {
      response: "I'm here to help. Can you tell me what's happening? Is anyone in immediate danger?",
      newState,
      shouldDispatch: false
    };
  }
}

function extractLocation(input: string): string {
  const text = input.toLowerCase();
  if (/camps? bay/.test(text)) return "Camps Bay Beach";
  if (/beach/.test(text)) return "Beach area";
  if (/ocean|sea/.test(text)) return "Ocean/Sea";
  return "Location mentioned";
}

function generateEscalatingQuestion(context: DialogueState['context']): string {
  if (context.location && context.personInDanger) {
    return "This sounds serious. Is the person still in the water? Can you describe their current condition? Emergency services are being prepared for dispatch.";
  }
  if (context.personInDanger) {
    return "Where exactly is this happening? Can you give me the specific location? I need to alert emergency services immediately.";
  }
  return "Is someone in immediate physical danger right now? Where is this occurring? Please be specific - this could be an emergency.";
}

function generateGatheringQuestion(context: DialogueState['context']): string {
  if (!context.location) {
    return "Can you tell me the exact location? This will help emergency services respond quickly if needed.";
  }
  if (!context.personInDanger) {
    return "Is anyone hurt or in danger? What exactly are you seeing? I need to determine if this requires emergency response.";
  }
  return "Help me understand the situation better - what's the person's current condition? Are they responsive?";
}

// Add crank call detection
function detectPotentialCrank(context: DialogueState['context']): boolean {
  const responses = context.responses.join(' ').toLowerCase();
  
  // Check for inconsistent or silly responses
  if (/joke|kidding|pranking|fake|test/.test(responses)) return true;
  if (context.responses.length > 3 && !context.location && !context.personInDanger) return true;
  
  return false;
}

export function generateCrankWarning(): string {
  return "⚠️ WARNING: Making false emergency reports is a serious offense that wastes critical resources and can result in criminal charges. If this is not a genuine emergency, please disconnect now. If this IS an emergency, please provide specific details immediately.";
}

function generateDispatchSummary(context: DialogueState['context']): string {
  const parts = [];
  
  if (context.location) parts.push(`Location: ${context.location}`);
  if (context.personInDanger) parts.push("Person in distress");
  
  const responses = context.responses.join(' ');
  if (/rip|current/.test(responses)) parts.push("Rip current involved");
  if (/cramping|cramp/.test(responses)) parts.push("Possible cramping");
  if (/hand.*raised|waving|gesturing/.test(responses)) parts.push("Distress signals observed");
  
  return parts.join(' | ') || "Emergency situation requiring immediate response";
}