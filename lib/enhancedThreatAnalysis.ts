// Enhanced threat analysis using OpenAI's capabilities for intelligent threat interpretation

export async function analyzeEmergencyThreat(conversationHistory: string[], currentInput: string): Promise<{
  threatLevel: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  situationType: string;
  keyFactors: string[];
  nextQuestion: string;
  shouldDispatch: boolean;
  dispatchSummary?: string;
}> {
  const fullContext = [...conversationHistory, currentInput].join('\n');
  
  try {
    const response = await fetch('/api/analyze-threat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: fullContext,
        analysisType: 'emergency_threat_assessment'
      })
    });
    
    if (!response.ok) {
      // Fallback to local analysis if API fails
      return localThreatAnalysis(conversationHistory, currentInput);
    }
    
    return await response.json();
  } catch (error) {
    // Fallback to local analysis
    return localThreatAnalysis(conversationHistory, currentInput);
  }
}

function localThreatAnalysis(conversationHistory: string[], currentInput: string): {
  threatLevel: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  situationType: string;
  keyFactors: string[];
  nextQuestion: string;
  shouldDispatch: boolean;
  dispatchSummary?: string;
} {
  const fullText = [...conversationHistory, currentInput].join(' ').toLowerCase();
  let threatLevel = 0;
  const keyFactors: string[] = [];
  
  // Life-threatening scenarios
  if (/dying|drowning|bleeding|unconscious|not breathing/.test(fullText)) {
    threatLevel += 40;
    keyFactors.push('Life-threatening situation detected');
  }
  
  // Water rescue scenarios
  if (/swimming|water|ocean|sea|beach/.test(fullText) && /trouble|help|distress/.test(fullText)) {
    threatLevel += 30;
    keyFactors.push('Water rescue situation');
  }
  
  // Location specificity
  if (/camps bay|beach|specific location/.test(fullText)) {
    threatLevel += 15;
    keyFactors.push('Specific location provided');
  }
  
  // Behavioral indicators
  if (/hand.*raised|waving|gesturing|signaling/.test(fullText)) {
    threatLevel += 20;
    keyFactors.push('Distress signals observed');
  }
  
  // Medical indicators
  if (/cramp|cramping|pain|medical/.test(fullText)) {
    threatLevel += 15;
    keyFactors.push('Medical distress indicated');
  }
  
  const urgency = threatLevel >= 70 ? 'critical' : 
                  threatLevel >= 50 ? 'high' : 
                  threatLevel >= 30 ? 'medium' : 'low';
  
  const shouldDispatch = threatLevel >= 70;
  
  let nextQuestion = '';
  let situationType = 'Unknown situation';
  
  if (shouldDispatch) {
    situationType = 'Emergency dispatch required';
    nextQuestion = 'Emergency services are being dispatched. Stay on the line. Can you see the person now?';
  } else if (threatLevel >= 50) {
    situationType = 'Escalating emergency';
    nextQuestion = 'This sounds very serious. What is the person doing right now? Are they still moving?';
  } else if (threatLevel >= 30) {
    situationType = 'Potential emergency';
    nextQuestion = 'I need more details to help properly. Where exactly is this happening?';
  } else {
    situationType = 'Gathering information';
    nextQuestion = 'Can you tell me what\'s happening? Is anyone in immediate danger?';
  }
  
  return {
    threatLevel,
    urgency,
    situationType,
    keyFactors,
    nextQuestion,
    shouldDispatch,
    dispatchSummary: shouldDispatch ? `${situationType}: ${keyFactors.join(' | ')}` : undefined
  };
}