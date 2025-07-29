// 🔧 Crank Call Detection System for Emergency Services

export interface CrankAnalysis {
  isCrank: boolean;
  confidence: number;
  indicators: string[];
  warningMessage?: string;
  escalateToAdmin?: boolean;
  incidentCode?: string;
}

export function detectCrankCall(text: string, conversationHistory: string[] = []): CrankAnalysis {
  const lower = text.toLowerCase();
  const fullText = [text, ...conversationHistory].join(' ').toLowerCase();
  
  const indicators: string[] = [];
  let crankScore = 0;
  
  // Obvious joke/fake content
  const obviousFakes = [
    "unicorn", "alien", "fart", "zebra doing karate", "dragon", "superman", 
    "batman", "spaceship", "teleport", "magic", "wizard", "fairy"
  ];
  obviousFakes.forEach(fake => {
    if (lower.includes(fake)) {
      indicators.push(`Fictional content: "${fake}"`);
      crankScore += 40;
    }
  });
  
  // Explicit admissions
  const admissions = [
    "i'm joking", "just kidding", "lol", "haha", "nothing wrong", 
    "i made it up", "false alarm", "nevermind", "just testing", "prank"
  ];
  admissions.forEach(admission => {
    if (lower.includes(admission)) {
      indicators.push(`Admission: "${admission}"`);
      crankScore += 60;
    }
  });
  
  // Inconsistent or impossible scenarios
  const impossibleScenarios = [
    "flying car", "time travel", "invisible", "talking animal", 
    "alien invasion", "zombie", "vampire", "monster"
  ];
  impossibleScenarios.forEach(scenario => {
    if (lower.includes(scenario)) {
      indicators.push(`Impossible scenario: "${scenario}"`);
      crankScore += 50;
    }
  });
  
  // Excessive vagueness after multiple questions
  if (conversationHistory.length >= 3) {
    const vagueResponses = ["maybe", "i think", "not sure", "don't know", "possibly"];
    const vagueCount = vagueResponses.filter(v => lower.includes(v)).length;
    if (vagueCount >= 2) {
      indicators.push("Excessive vagueness after multiple clarifications");
      crankScore += 25;
    }
  }
  
  // Contradictory information
  if (fullText.includes("no emergency") && fullText.includes("help")) {
    indicators.push("Contradictory statements about emergency status");
    crankScore += 30;
  }
  
  // Inappropriate emotional responses
  const laughingWords = ["hehe", "lmao", "rofl", "funny", "hilarious"];
  laughingWords.forEach(laugh => {
    if (lower.includes(laugh)) {
      indicators.push(`Inappropriate humor: "${laugh}"`);
      crankScore += 35;
    }
  });
  
  const isCrank = crankScore >= 50;
  const confidence = Math.min(crankScore, 100);
  
  let warningMessage: string | undefined;
  if (isCrank) {
    warningMessage = "⚠️ CRANK CALL DETECTED: False emergency reporting is a criminal offense. This call and your device information have been logged for investigation.";
  }
  
  // Enhanced crank response based on escalation level
  let escalateToAdmin = false;
  let incidentCode: string | undefined;
  
  if (isCrank && confidence >= 80) {
    warningMessage = "🚨 This is a criminal act. False reports endanger lives. Your identity and device fingerprint have been logged. Authorities will be notified.";
    escalateToAdmin = true;
    incidentCode = "FALSE_EMERGENCY";
  }
  
  return {
    isCrank,
    confidence,
    indicators,
    warningMessage,
    escalateToAdmin,
    incidentCode
  };
}

export function shouldEscalateToAdmin(crankAnalysis: CrankAnalysis): boolean {
  return crankAnalysis.isCrank && crankAnalysis.confidence >= 70;
}

export function logCrankCall(callerId: string, text: string, indicators: string[]): void {
  const timestamp = new Date().toISOString();
  console.warn(`[CRANK CALL LOG] ${timestamp} - Caller: ${callerId}`);
  console.warn(`Text: "${text}"`);
  console.warn(`Indicators: ${indicators.join(', ')}`);
  
  // In production, this would write to a security log file or database
  // for law enforcement follow-up on repeated false emergency reports
}