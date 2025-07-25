export function handleIntent(intent: string, confidence: number, rawInput: string) {
  const emergencyKeywords = ["help", "fire", "bleeding", "attack", "emergency", "ambulance", "crime", "now", "drowning", "stranded", "trapped", "flood", "tree"];
  const lowerInput = rawInput.toLowerCase();

  const likelyEmergency =
    emergencyKeywords.some(keyword => lowerInput.includes(keyword)) && confidence >= 0.85;

  if (intent === "EMERGENCY") {
    if (confidence >= 0.95 || likelyEmergency) {
      // Confirmed high-confidence emergency - immediate dispatch
      return routeToResponder(rawInput);
    } else {
      // Fallback confirmation layer for edge cases only
      return {
        message: "It looks like you might need emergency assistance. Please confirm: Is this an actual emergency?",
        intent: "CONFIRM_EMERGENCY"
      };
    }
  }

  // Default routing for other intents
  return routeToHandler(intent, rawInput);
}

function routeToResponder(rawInput: string) {
  return {
    message: rawInput,
    intent: "EMERGENCY",
    routeToResponder: true,
    action: "DISPATCH"
  };
}

function routeToHandler(intent: string, rawInput: string) {
  return {
    message: rawInput,
    intent: intent,
    routeToResponder: false,
    action: "ACKNOWLEDGE"
  };
}