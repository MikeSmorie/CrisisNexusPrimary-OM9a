export function classifyIntent(text: string): "emergency" | "greeting" | "noise" | "unknown" {
  const t = text.toLowerCase();
  if (/help|fire|flood|injury|emergency|trapped|accident|drowning|fell|cliff|violence|attack|crash|stuck|medical|ambulance|police|hospital|bleeding|hurt/.test(t)) return "emergency";
  if (/hello|hi|can you hear me|test|is this working|testing|123|check|mic check|hey/.test(t)) return "greeting";
  if (/hmmm+|uhhh+|umm+|ahh+|erm+/.test(t)) return "noise";
  return "unknown";
}

export function generateAcknowledgement(intent: string): string {
  const acknowledgements = {
    greeting: "Yes, I hear you. Please describe your emergency.",
    noise: "I'm listening, but I didn't catch that. Can you repeat clearly?",
    unknown: "Got it. Please share more details about your situation."
  };
  
  return acknowledgements[intent as keyof typeof acknowledgements] || acknowledgements.unknown;
}