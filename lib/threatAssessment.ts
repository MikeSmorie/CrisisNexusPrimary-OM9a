// Professional Emergency Threat Assessment System
// Based on real 911 dispatcher protocols and crisis severity matrices

export interface ThreatAssessment {
  severityScore: number; // 0-10 scale
  category: 'MINOR' | 'MODERATE' | 'MAJOR' | 'CRITICAL' | 'CATASTROPHIC';
  immediateDispatch: boolean;
  dispatchLevel: 'SINGLE_UNIT' | 'MULTI_UNIT' | 'FULL_RESPONSE' | 'MASS_CASUALTY';
  timeToDispatch: number; // seconds
  requiredUnits: string[];
  reasoning: string[];
}

export interface EmergencyIndicators {
  // Life threat indicators
  unconsciousness: boolean;
  breathing_difficulty: boolean;
  severe_bleeding: boolean;
  cardiac_arrest: boolean;
  
  // Environmental threats
  fire: boolean;
  explosion_risk: boolean;
  structural_collapse: boolean;
  hazmat: boolean;
  
  // Violence indicators
  weapon_present: boolean;
  active_threat: boolean;
  domestic_violence: boolean;
  
  // Multiple casualty indicators
  mass_casualty: boolean;
  multiple_victims: number;
  
  // Specific high-risk scenarios
  water_emergency: boolean;
  vehicle_accident: boolean;
  entrapment: boolean;
  
  // Caller state
  caller_threatened: boolean;
  caller_injured: boolean;
  caller_panic_level: number; // 1-5
}

// Professional severity matrix used by actual 911 centers
export function assessThreatSeverity(
  transcript: string,
  conversationHistory: string[],
  indicators: Partial<EmergencyIndicators> = {}
): ThreatAssessment {
  
  const text = transcript.toLowerCase();
  const fullHistory = conversationHistory.join(' ').toLowerCase();
  
  let score = 0;
  const reasoning: string[] = [];
  const requiredUnits: string[] = [];
  
  // CATASTROPHIC THREATS (8-10 points) - Immediate dispatch
  if (text.includes('explosion') || text.includes('bomb')) {
    score += 10;
    reasoning.push('EXPLOSION/BOMB: Immediate evacuation and bomb squad required');
    requiredUnits.push('BOMB_SQUAD', 'FIRE', 'EMS', 'POLICE');
  }
  
  if (text.includes('mass shooting') || text.includes('active shooter')) {
    score += 10;
    reasoning.push('ACTIVE SHOOTER: Immediate tactical response required');
    requiredUnits.push('SWAT', 'MULTIPLE_POLICE', 'EMS_STANDBY');
  }
  
  if (text.includes('building collapse') || text.includes('structure collapse')) {
    score += 9;
    reasoning.push('STRUCTURAL COLLAPSE: Search and rescue teams required');
    requiredUnits.push('FIRE_RESCUE', 'EMS', 'URBAN_RESCUE');
  }
  
  // CRITICAL THREATS (6-8 points) - Priority dispatch
  if ((text.includes('shark') && text.includes('blood')) || 
      (text.includes('shark attack'))) {
    score += 8;
    reasoning.push('SHARK ATTACK: Life-threatening marine emergency');
    requiredUnits.push('COAST_GUARD', 'LIFEGUARD', 'EMS');
  }
  
  if (text.includes('drowning') || (text.includes('under water') && text.includes('not coming up'))) {
    score += 7;
    reasoning.push('DROWNING: Water rescue teams required');
    requiredUnits.push('WATER_RESCUE', 'EMS');
  }
  
  if (text.includes('not breathing') || text.includes('unconscious')) {
    score += 7;
    reasoning.push('LIFE THREAT: Immediate medical intervention required');
    requiredUnits.push('EMS_PRIORITY', 'ALS');
  }
  
  if (text.includes('severe bleeding') || text.includes('blood everywhere')) {
    score += 6;
    reasoning.push('SEVERE HEMORRHAGE: Emergency medical response');
    requiredUnits.push('EMS', 'TRAUMA_TEAM');
  }
  
  // MAJOR THREATS (4-6 points) - Standard emergency dispatch
  if (text.includes('fire') && (text.includes('building') || text.includes('house'))) {
    score += 6;
    reasoning.push('STRUCTURE FIRE: Fire suppression and evacuation');
    requiredUnits.push('FIRE', 'EMS');
  }
  
  if (text.includes('car accident') || text.includes('vehicle crash')) {
    score += 5;
    reasoning.push('VEHICLE ACCIDENT: Traffic and medical response');
    requiredUnits.push('POLICE', 'EMS', 'FIRE_IF_ENTRAPMENT');
  }
  
  if (text.includes('trapped') || text.includes('stuck under')) {
    score += 6;
    reasoning.push('ENTRAPMENT: Rescue and medical teams required');
    requiredUnits.push('FIRE_RESCUE', 'EMS');
  }
  
  // MODERATE THREATS (2-4 points) - Assessment and response
  if (text.includes('gun') || text.includes('weapon')) {
    score += 4;
    reasoning.push('WEAPON PRESENT: Police response required');
    requiredUnits.push('POLICE');
  }
  
  if (text.includes('chest pain') || text.includes('heart attack')) {
    score += 4;
    reasoning.push('CARDIAC EVENT: Medical evaluation required');
    requiredUnits.push('EMS');
  }
  
  // ESCALATION FACTORS - Multiply severity
  let multiplier = 1.0;
  
  // Multiple victims
  const victimCount = extractVictimCount(text);
  if (victimCount > 1) {
    multiplier += 0.3 * Math.min(victimCount - 1, 5);
    reasoning.push(`MULTIPLE VICTIMS: ${victimCount} people involved`);
  }
  
  // Caller panic level
  const panicLevel = assessCallerPanic(text, conversationHistory);
  if (panicLevel >= 4) {
    multiplier += 0.2;
    reasoning.push('HIGH CALLER DISTRESS: Extreme panic detected');
  }
  
  // Missing persons in dangerous situation
  if (text.includes('missing') || text.includes('disappeared')) {
    if (score > 4) { // Only if already dangerous situation
      multiplier += 0.4;
      reasoning.push('MISSING PERSON: In dangerous environment');
    }
  }
  
  // Apply multiplier
  score = Math.min(score * multiplier, 10);
  
  // Determine category and dispatch level
  let category: ThreatAssessment['category'];
  let dispatchLevel: ThreatAssessment['dispatchLevel'];
  let timeToDispatch: number;
  let immediateDispatch: boolean;
  
  if (score >= 8) {
    category = 'CATASTROPHIC';
    dispatchLevel = 'MASS_CASUALTY';
    timeToDispatch = 0; // Immediate
    immediateDispatch = true;
  } else if (score >= 6) {
    category = 'CRITICAL';
    dispatchLevel = 'FULL_RESPONSE';
    timeToDispatch = 30; // 30 seconds
    immediateDispatch = true;
  } else if (score >= 4) {
    category = 'MAJOR';
    dispatchLevel = 'MULTI_UNIT';
    timeToDispatch = 60; // 1 minute
    immediateDispatch = true;
  } else if (score >= 2) {
    category = 'MODERATE';
    dispatchLevel = 'SINGLE_UNIT';
    timeToDispatch = 180; // 3 minutes
    immediateDispatch = false;
  } else {
    category = 'MINOR';
    dispatchLevel = 'SINGLE_UNIT';
    timeToDispatch = 300; // 5 minutes
    immediateDispatch = false;
  }
  
  return {
    severityScore: Math.round(score * 10) / 10,
    category,
    immediateDispatch,
    dispatchLevel,
    timeToDispatch,
    requiredUnits,
    reasoning
  };
}

function extractVictimCount(text: string): number {
  // Extract number of people mentioned
  const numbers = text.match(/(\d+)\s*(people|person|swimmer|victim|casualt)/gi);
  if (numbers) {
    return Math.max(...numbers.map(n => parseInt(n.match(/\d+/)?.[0] || '1')));
  }
  
  // Look for plural indicators
  if (text.includes('swimmers') || text.includes('people') || text.includes('victims')) {
    return 2; // Assume at least 2 if plural
  }
  
  return 1;
}

function assessCallerPanic(text: string, history: string[]): number {
  let panicLevel = 1;
  
  // Panic indicators
  if (text.includes('help') || text.includes('please')) panicLevel += 1;
  if (text.includes('screaming') || text.includes('shouting')) panicLevel += 1;
  if (text.includes('panic') || text.includes('scared')) panicLevel += 1;
  if (text.includes('oh my god') || text.includes('jesus')) panicLevel += 1;
  if (text.includes('!!!') || text.match(/[!]{2,}/)) panicLevel += 1;
  
  // Repetition indicates panic
  const repeatCount = history.filter(h => 
    h.toLowerCase().includes(text.toLowerCase().split(' ')[0])
  ).length;
  if (repeatCount > 2) panicLevel += 1;
  
  return Math.min(panicLevel, 5);
}

// Generate professional operator response based on severity
export function generateOperatorResponse(assessment: ThreatAssessment, transcript: string): string {
  const { category, severityScore, reasoning } = assessment;
  
  if (category === 'CATASTROPHIC') {
    return `EMERGENCY CONFIRMED - CATASTROPHIC LEVEL. Multiple emergency units dispatched immediately. EVACUATE THE AREA if safe to do so. Stay on the line for continuous updates.`;
  }
  
  if (category === 'CRITICAL') {
    return `CRITICAL EMERGENCY CONFIRMED. Emergency services dispatched with highest priority. Stay exactly where you are and remain on the line. How many people need immediate medical attention?`;
  }
  
  if (category === 'MAJOR') {
    return `MAJOR EMERGENCY - Units dispatched. Stay on the line. I need you to describe the current condition of all involved. Are they conscious and breathing?`;
  }
  
  if (category === 'MODERATE') {
    if (severityScore < 3) {
      return `Emergency services are being notified. On a scale of 1 to 10, with 10 being life-threatening, how severe would you rate this situation right now?`;
    }
    return `I'm dispatching appropriate units. Stay calm and on the line. Tell me exactly what you can see happening right now.`;
  }
  
  return `I'm gathering information to determine the appropriate response. Help me understand - on a scale of 1 to 10, how urgent is this situation? 1 means no immediate danger, 10 means life-threatening emergency.`;
}