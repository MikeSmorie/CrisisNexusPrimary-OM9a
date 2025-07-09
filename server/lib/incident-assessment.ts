import { analyzeIncident, type IncidentAnalysis } from './openai-emergency';

export async function assessIncident(description: string, incidentType?: string, location?: string): Promise<{
  threat_level: string,
  escalation_required: boolean,
  ai_recommendation: string,
  urgency_level: string,
  estimated_response_time: string,
  resource_requirements: any,
  risk_assessment: any
}> {
  try {
    // Use the OpenAI emergency analysis
    const analysis: IncidentAnalysis = await analyzeIncident(
      incidentType || 'General Emergency',
      description,
      location || 'Unknown Location'
    );

    // Map OpenAI analysis to our database format
    const threatLevel = mapSeverityToThreatLevel(analysis.severity);
    const escalationRequired = analysis.urgency === 'emergency' || analysis.severity === 'critical';
    
    const aiRecommendation = `Severity: ${analysis.severity.toUpperCase()} | Urgency: ${analysis.urgency.toUpperCase()}
    
Recommended Actions:
${analysis.recommendedActions.map(action => `• ${action}`).join('\n')}

Risk Assessment:
• Public Safety: ${analysis.riskAssessment.publicSafety}/10
• Property Damage: ${analysis.riskAssessment.propertyDamage}/10  
• Environmental Impact: ${analysis.riskAssessment.environmentalImpact}/10

Resource Requirements:
• Personnel: ${analysis.resourceRequirements.personnel}
• Vehicles: ${analysis.resourceRequirements.vehicles}
• Equipment: ${analysis.resourceRequirements.specialEquipment.join(', ')}`;

    return {
      threat_level: threatLevel,
      escalation_required: escalationRequired,
      ai_recommendation: aiRecommendation,
      urgency_level: analysis.urgency,
      estimated_response_time: analysis.estimatedResponseTime,
      resource_requirements: analysis.resourceRequirements,
      risk_assessment: analysis.riskAssessment
    };
  } catch (error) {
    console.error('AI incident assessment failed:', error);
    
    // Fallback assessment for critical situations
    return {
      threat_level: 'medium',
      escalation_required: false,
      ai_recommendation: 'AI analysis unavailable. Manual assessment required. Deploy standard response protocols and reassess on scene.',
      urgency_level: 'urgent',
      estimated_response_time: '20 minutes',
      resource_requirements: {
        personnel: 4,
        vehicles: 2,
        specialEquipment: ['Basic emergency kit']
      },
      risk_assessment: {
        publicSafety: 6,
        propertyDamage: 5,
        environmentalImpact: 3
      }
    };
  }
}

function mapSeverityToThreatLevel(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'low': return 'low';
    case 'medium': return 'medium';
    case 'high': return 'high';
    case 'critical': return 'critical';
    default: return 'unclassified';
  }
}

export async function generateEmergencyResponse(
  incidentData: any,
  availableResources: any[] = []
): Promise<{
  priorityActions: string[];
  resourceDeployment: string[];
  communicationPlan: string[];
}> {
  try {
    const prompt = `Emergency Response Planning:

Incident: ${incidentData.incidentType}
Description: ${incidentData.description}
Location: ${incidentData.location}
Severity: ${incidentData.severity}
AI Assessment: ${incidentData.ai_recommendation}

Available Resources: ${JSON.stringify(availableResources, null, 2)}

Generate a comprehensive emergency response plan in JSON format with:
- priorityActions: array of immediate priority actions
- resourceDeployment: array of specific resource deployment instructions
- communicationPlan: array of communication and coordination steps

Focus on life safety, rapid response, and efficient resource utilization.`;

    const response = await fetch('/api/ai/emergency-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      throw new Error('Failed to generate emergency response plan');
    }

    const result = await response.json();
    return JSON.parse(result.response);
  } catch (error) {
    console.error('Emergency response generation failed:', error);
    
    // Fallback response plan
    return {
      priorityActions: [
        'Dispatch first responders to scene',
        'Establish incident command post',
        'Assess immediate life safety threats',
        'Secure the area and control access'
      ],
      resourceDeployment: [
        'Deploy primary response team',
        'Stage additional resources at safe distance',
        'Coordinate with local emergency services'
      ],
      communicationPlan: [
        'Notify incident commander',
        'Establish communication with responding units',
        'Prepare public information if needed'
      ]
    };
  }
}