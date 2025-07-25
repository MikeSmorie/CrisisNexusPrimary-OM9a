export function classifyIntent(text: string): {
  type: "emergency" | "greeting" | "noise" | "unknown";
  confidence: number;
} {
  const t = text.toLowerCase();
  
  // High-confidence emergency patterns
  if (/fire|flood|fell|injured|stabbed|accident|trapped|collapsed|emergency|help|drowning|violence|attack|crash|stuck|medical|ambulance|police|hospital|bleeding|hurt/.test(t)) {
    return { type: "emergency", confidence: 0.95 };
  }
  
  // High-confidence greeting patterns
  if (/hello|hi|can you hear me|how are you|is this working|test|testing|123|check|mic check|hey/.test(t)) {
    return { type: "greeting", confidence: 0.85 };
  }
  
  // Medium-confidence noise patterns
  if (/hmm+|uhh+|umm+|ahh+|erm+|what/.test(t)) {
    return { type: "noise", confidence: 0.7 };
  }
  
  // Low-confidence unknown
  return { type: "unknown", confidence: 0.4 };
}

export function generateAcknowledgement(intent: string, confidence: number): string {
  const acknowledgements = {
    greeting: "Yes, I hear you. Please describe your emergency.",
    noise: "I'm listening, but I didn't catch that. Can you repeat clearly?",
    unknown: confidence < 0.5 
      ? "Message received, but no emergency detected. Please describe the crisis briefly."
      : "Got it. Please share more details about your situation."
  };
  
  return acknowledgements[intent as keyof typeof acknowledgements] || acknowledgements.unknown;
}