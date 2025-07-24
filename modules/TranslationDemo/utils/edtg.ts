// Emergency Dispatch Translation Gateway (EDTG) - Core routing logic
export interface EDTGConfig {
  priority: 'low' | 'medium' | 'high' | 'critical';
  sourceLanguage: string;
  targetLanguage: string;
  emergencyType: 'fire' | 'medical' | 'police' | 'rescue' | 'hazmat' | 'general';
  location?: string;
  dispatcherId: string;
}

export interface EDTGResponse {
  translatedMessage: string;
  dispatchInstructions: string;
  recommendedUnits: string[];
  estimatedResponseTime: number;
  confidenceScore: number;
  processingMetadata: {
    timestamp: string;
    processingTime: number;
    languagePair: string;
    emergencyClassification: string;
  };
}

// Emergency response unit mapping
const EMERGENCY_UNITS = {
  fire: ['Engine Company', 'Ladder Company', 'Battalion Chief', 'Hazmat Unit'],
  medical: ['Ambulance', 'Paramedic Unit', 'Supervisor Unit', 'Air Medical'],
  police: ['Patrol Unit', 'Supervisor', 'K-9 Unit', 'SWAT Team'],
  rescue: ['Search & Rescue Team', 'Technical Rescue', 'Water Rescue', 'Mountain Rescue'],
  hazmat: ['Hazmat Team', 'Decontamination Unit', 'Environmental Response', 'Chemical Unit']
};

// Response time estimates by emergency type (in minutes)
const RESPONSE_TIMES = {
  fire: { low: 8, medium: 6, high: 4, critical: 3 },
  medical: { low: 12, medium: 8, high: 5, critical: 4 },
  police: { low: 15, medium: 10, high: 6, critical: 3 },
  rescue: { low: 20, medium: 15, high: 10, critical: 8 },
  hazmat: { low: 25, medium: 20, high: 15, critical: 12 }
};

// Standard dispatch instructions by emergency type
const DISPATCH_INSTRUCTIONS = {
  fire: {
    low: "Respond Code 2 - Non-emergency fire investigation",
    medium: "Respond Code 1 - Structure fire, possible extension",
    high: "Respond Code 1 - Working structure fire, multiple units",
    critical: "Respond Code 1 - Major fire, full assignment, command post"
  },
  medical: {
    low: "Respond Code 2 - Non-emergency medical transport",
    medium: "Respond Code 1 - Medical emergency, ALS response",
    high: "Respond Code 1 - Life-threatening emergency, full ALS",
    critical: "Respond Code 1 - Cardiac arrest/trauma, all available units"
  },
  police: {
    low: "Respond Code 2 - Minor incident, routine patrol",
    medium: "Respond Code 1 - Active incident, officer safety priority",
    high: "Respond Code 1 - Emergency response, backup units advised",
    critical: "Respond Code 1 - Officer needs help, all units respond"
  },
  rescue: {
    low: "Respond Code 2 - Search coordination, establish command",
    medium: "Respond Code 1 - Rescue operation, specialized equipment",
    high: "Respond Code 1 - Technical rescue, full team deployment",
    critical: "Respond Code 1 - Life rescue, immediate deployment"
  },
  hazmat: {
    low: "Respond Code 2 - Hazmat investigation, level A protection",
    medium: "Respond Code 1 - Hazmat incident, decon procedures",
    high: "Respond Code 1 - Major hazmat, evacuation procedures",
    critical: "Respond Code 1 - Mass casualty hazmat, full response"
  }
};

/**
 * Process emergency translation through EDTG
 */
export async function processEmergencyDispatch(
  message: string,
  config: EDTGConfig
): Promise<EDTGResponse> {
  const startTime = Date.now();
  
  // Simulate processing based on priority
  const processingDelay = getPriorityDelay(config.priority);
  await new Promise(resolve => setTimeout(resolve, processingDelay));
  
  // Generate translated message
  const translatedMessage = await translateForDispatch(message, config);
  
  // Get dispatch instructions
  const dispatchInstructions = getDispatchInstructions(config);
  
  // Recommend units
  const recommendedUnits = getRecommendedUnits(config);
  
  // Calculate response time
  const estimatedResponseTime = getEstimatedResponseTime(config);
  
  // Calculate confidence score
  const confidenceScore = calculateConfidenceScore(message, config);
  
  const processingTime = Date.now() - startTime;
  
  return {
    translatedMessage,
    dispatchInstructions,
    recommendedUnits,
    estimatedResponseTime,
    confidenceScore,
    processingMetadata: {
      timestamp: new Date().toISOString(),
      processingTime,
      languagePair: `${config.sourceLanguage}-${config.targetLanguage}`,
      emergencyClassification: `${config.emergencyType}:${config.priority}`
    }
  };
}

/**
 * Translate message for dispatch purposes
 */
async function translateForDispatch(message: string, config: EDTGConfig): Promise<string> {
  // In production, this would use the actual translation service
  const templates = {
    fire: `FIRE EMERGENCY - Priority: ${config.priority.toUpperCase()}\n` +
          `Location: ${config.location || 'Unknown'}\n` +
          `Details: ${message}\n` +
          `Dispatch: Immediate fire department response required`,
    
    medical: `MEDICAL EMERGENCY - Priority: ${config.priority.toUpperCase()}\n` +
             `Location: ${config.location || 'Unknown'}\n` +
             `Details: ${message}\n` +
             `Dispatch: EMS response required`,
    
    police: `POLICE EMERGENCY - Priority: ${config.priority.toUpperCase()}\n` +
            `Location: ${config.location || 'Unknown'}\n` +
            `Details: ${message}\n` +
            `Dispatch: Law enforcement response required`,
    
    rescue: `RESCUE OPERATION - Priority: ${config.priority.toUpperCase()}\n` +
            `Location: ${config.location || 'Unknown'}\n` +
            `Details: ${message}\n` +
            `Dispatch: Search and rescue response required`,
    
    hazmat: `HAZMAT INCIDENT - Priority: ${config.priority.toUpperCase()}\n` +
            `Location: ${config.location || 'Unknown'}\n` +
            `Details: ${message}\n` +
            `Dispatch: Hazmat team response required`
  };
  
  return templates[config.emergencyType] || templates.fire;
}

/**
 * Get dispatch instructions based on emergency type and priority
 */
function getDispatchInstructions(config: EDTGConfig): string {
  const instructions = DISPATCH_INSTRUCTIONS[config.emergencyType];
  return instructions[config.priority] || instructions.medium;
}

/**
 * Get recommended units for the emergency
 */
function getRecommendedUnits(config: EDTGConfig): string[] {
  const baseUnits = EMERGENCY_UNITS[config.emergencyType] || EMERGENCY_UNITS.fire;
  
  // Adjust unit count based on priority
  switch (config.priority) {
    case 'critical':
      return baseUnits;
    case 'high':
      return baseUnits.slice(0, 3);
    case 'medium':
      return baseUnits.slice(0, 2);
    case 'low':
    default:
      return baseUnits.slice(0, 1);
  }
}

/**
 * Get estimated response time
 */
function getEstimatedResponseTime(config: EDTGConfig): number {
  const times = RESPONSE_TIMES[config.emergencyType] || RESPONSE_TIMES.fire;
  return times[config.priority] || times.medium;
}

/**
 * Calculate confidence score based on message content and config
 */
function calculateConfidenceScore(message: string, config: EDTGConfig): number {
  let score = 0.7; // Base score
  
  // Increase score if location is provided
  if (config.location) score += 0.1;
  
  // Increase score if message contains emergency keywords
  const emergencyKeywords = ['fire', 'ambulance', 'police', 'help', 'emergency', 'urgent'];
  const foundKeywords = emergencyKeywords.filter(keyword => 
    message.toLowerCase().includes(keyword)
  );
  score += foundKeywords.length * 0.05;
  
  // Adjust based on priority
  if (config.priority === 'critical') score += 0.1;
  else if (config.priority === 'high') score += 0.05;
  
  // Cap at 1.0
  return Math.min(score, 1.0);
}

/**
 * Get processing delay based on priority
 */
function getPriorityDelay(priority: string): number {
  switch (priority) {
    case 'critical': return 200;
    case 'high': return 400;
    case 'medium': return 600;
    case 'low': return 800;
    default: return 600;
  }
}