import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface IncidentAnalysis {
  severity: 'low' | 'medium' | 'high' | 'critical';
  urgency: 'routine' | 'urgent' | 'emergency';
  recommendedActions: string[];
  estimatedResponseTime: string;
  resourceRequirements: {
    personnel: number;
    vehicles: number;
    specialEquipment: string[];
  };
  riskAssessment: {
    publicSafety: number; // 1-10 scale
    propertyDamage: number;
    environmentalImpact: number;
  };
}

export interface CommunicationAnalysis {
  priority: 'low' | 'normal' | 'high' | 'emergency';
  sentiment: number; // -1 to 1
  keyPoints: string[];
  actionItems: string[];
  responseRecommendation: string;
}

export interface ResourceOptimization {
  deployment: {
    resourceId: string;
    location: string;
    priority: number;
    estimatedArrival: string;
  }[];
  efficiency: number; // 0-100%
  alternatives: string[];
}

export async function analyzeIncident(
  incidentType: string,
  description: string,
  location: string,
  reporterInfo?: string
): Promise<IncidentAnalysis> {
  try {
    const prompt = `Analyze this emergency incident for disaster response:

Type: ${incidentType}
Description: ${description}
Location: ${location}
${reporterInfo ? `Reporter: ${reporterInfo}` : ''}

Provide a comprehensive emergency response analysis in JSON format with:
- severity (low/medium/high/critical)
- urgency (routine/urgent/emergency)
- recommendedActions (array of specific actions)
- estimatedResponseTime (string like "15 minutes" or "1 hour")
- resourceRequirements (personnel count, vehicles count, specialEquipment array)
- riskAssessment (publicSafety 1-10, propertyDamage 1-10, environmentalImpact 1-10)

Focus on immediate emergency response priorities and public safety.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert emergency response coordinator with 20+ years of experience in disaster management. Provide accurate, actionable emergency response analysis."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 1000
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result as IncidentAnalysis;
  } catch (error) {
    console.error('OpenAI incident analysis error:', error);
    // Fallback analysis for critical situations
    return {
      severity: 'medium',
      urgency: 'urgent',
      recommendedActions: ['Dispatch first responders', 'Assess situation on arrival', 'Establish command post'],
      estimatedResponseTime: '20 minutes',
      resourceRequirements: {
        personnel: 4,
        vehicles: 2,
        specialEquipment: ['Basic emergency kit']
      },
      riskAssessment: {
        publicSafety: 6,
        propertyDamage: 5,
        environmentalImpact: 3
      }
    };
  }
}

export async function analyzeCommunication(
  message: string,
  context: string = 'emergency_communication'
): Promise<CommunicationAnalysis> {
  try {
    const prompt = `Analyze this emergency communication:

Message: "${message}"
Context: ${context}

Provide analysis in JSON format with:
- priority (low/normal/high/emergency)
- sentiment (-1 to 1, where -1 is very negative/distressed, 1 is positive/calm)
- keyPoints (array of main points)
- actionItems (array of specific actions needed)
- responseRecommendation (suggested response approach)

Focus on emergency communication protocols and crisis management.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert crisis communication specialist. Analyze emergency communications for priority, sentiment, and response recommendations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 800
    });

    return JSON.parse(response.choices[0].message.content) as CommunicationAnalysis;
  } catch (error) {
    console.error('OpenAI communication analysis error:', error);
    return {
      priority: 'normal',
      sentiment: 0,
      keyPoints: ['Communication received'],
      actionItems: ['Review message', 'Respond as appropriate'],
      responseRecommendation: 'Acknowledge receipt and gather more information'
    };
  }
}

export async function optimizeResourceDeployment(
  availableResources: any[],
  activeIncidents: any[],
  constraints: { maxTravelTime?: number; priorityZones?: string[] } = {}
): Promise<ResourceOptimization> {
  try {
    const prompt = `Optimize emergency resource deployment:

Available Resources:
${JSON.stringify(availableResources, null, 2)}

Active Incidents:
${JSON.stringify(activeIncidents, null, 2)}

Constraints:
${JSON.stringify(constraints, null, 2)}

Provide optimization in JSON format with:
- deployment (array of: resourceId, location, priority 1-10, estimatedArrival)
- efficiency (0-100% overall deployment efficiency)
- alternatives (array of alternative deployment strategies)

Prioritize life safety, response time, and resource efficiency.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert emergency resource coordinator specializing in optimal deployment strategies for disaster response."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 1200
    });

    return JSON.parse(response.choices[0].message.content) as ResourceOptimization;
  } catch (error) {
    console.error('OpenAI resource optimization error:', error);
    return {
      deployment: availableResources.map((resource, index) => ({
        resourceId: resource.id || `resource_${index}`,
        location: activeIncidents[index % activeIncidents.length]?.location || 'Base',
        priority: 5,
        estimatedArrival: '30 minutes'
      })),
      efficiency: 75,
      alternatives: ['Manual deployment', 'Closest resource strategy']
    };
  }
}

export async function generateEmergencyAlert(
  incidentType: string,
  severity: string,
  location: string,
  targetAudience: string = 'general_public'
): Promise<{ title: string; message: string; channels: string[] }> {
  try {
    const prompt = `Generate an emergency alert:

Incident Type: ${incidentType}
Severity: ${severity}
Location: ${location}
Target Audience: ${targetAudience}

Create an emergency alert in JSON format with:
- title (concise alert title)
- message (clear, actionable emergency message)
- channels (array of recommended communication channels: sms, radio, satellite, digital)

Follow emergency communication best practices: clear, concise, actionable information.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert emergency communications specialist. Create clear, actionable emergency alerts following FEMA and emergency management best practices."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 600
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('OpenAI alert generation error:', error);
    return {
      title: `${severity.toUpperCase()} ALERT: ${incidentType}`,
      message: `Emergency situation reported in ${location}. Monitor official channels for updates. Follow local emergency procedures.`,
      channels: ['sms', 'radio', 'digital']
    };
  }
}