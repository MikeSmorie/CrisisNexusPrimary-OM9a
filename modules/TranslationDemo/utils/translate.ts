// Emergency translation service for crisis communications
export interface TranslationRequest {
  text: string;
  fromLanguage: string;
  toLanguage: string;
  priority: 'low' | 'medium' | 'high';
  context?: 'emergency' | 'medical' | 'fire' | 'police' | 'general';
}

export interface TranslationResponse {
  translatedText: string;
  confidence: number;
  detectedLanguage?: string;
  processingTime: number;
  emergencyTermsDetected: string[];
}

// Emergency-specific translation templates
const EMERGENCY_TEMPLATES = {
  fire: {
    en: "FIRE EMERGENCY: {location} - {description}. Immediate fire department response required.",
    es: "EMERGENCIA DE INCENDIO: {location} - {description}. Se requiere respuesta inmediata del departamento de bomberos.",
    fr: "URGENCE INCENDIE: {location} - {description}. Intervention immédiate des pompiers requise.",
    de: "FEUER-NOTFALL: {location} - {description}. Sofortige Feuerwehr erforderlich.",
    it: "EMERGENZA INCENDIO: {location} - {description}. Risposta immediata dei vigili del fuoco richiesta."
  },
  medical: {
    en: "MEDICAL EMERGENCY: {location} - {description}. Ambulance required immediately.",
    es: "EMERGENCIA MÉDICA: {location} - {description}. Ambulancia requerida inmediatamente.",
    fr: "URGENCE MÉDICALE: {location} - {description}. Ambulance requise immédiatement.",
    de: "MEDIZINISCHER NOTFALL: {location} - {description}. Krankenwagen sofort erforderlich.",
    it: "EMERGENZA MEDICA: {location} - {description}. Ambulanza richiesta immediatamente."
  },
  police: {
    en: "POLICE EMERGENCY: {location} - {description}. Law enforcement response needed.",
    es: "EMERGENCIA POLICIAL: {location} - {description}. Se necesita respuesta policial.",
    fr: "URGENCE POLICE: {location} - {description}. Intervention des forces de l'ordre nécessaire.",
    de: "POLIZEI-NOTFALL: {location} - {description}. Polizeieinsatz erforderlich.",
    it: "EMERGENZA POLIZIA: {location} - {description}. Risposta delle forze dell'ordine necessaria."
  }
};

// Critical emergency terms that need special handling
const CRITICAL_TERMS = {
  en: ['fire', 'ambulance', 'police', 'emergency', 'help', 'urgent', 'critical', 'trapped', 'injured', 'bleeding'],
  es: ['fuego', 'ambulancia', 'policía', 'emergencia', 'ayuda', 'urgente', 'crítico', 'atrapado', 'herido', 'sangrando'],
  fr: ['feu', 'ambulance', 'police', 'urgence', 'aide', 'urgent', 'critique', 'piégé', 'blessé', 'saignement'],
  de: ['feuer', 'krankenwagen', 'polizei', 'notfall', 'hilfe', 'dringend', 'kritisch', 'gefangen', 'verletzt', 'blutung'],
  it: ['fuoco', 'ambulanza', 'polizia', 'emergenza', 'aiuto', 'urgente', 'critico', 'intrappolato', 'ferito', 'sanguinamento']
};

/**
 * Simulate emergency translation service
 * In production, this would integrate with OpenAI or Google Translate API
 */
export async function translateEmergencyMessage(request: TranslationRequest): Promise<TranslationResponse> {
  const startTime = Date.now();
  
  // Simulate processing delay based on priority
  const delay = request.priority === 'high' ? 500 : request.priority === 'medium' ? 1000 : 1500;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Detect emergency terms in the source text
  const emergencyTerms = detectEmergencyTerms(request.text, request.fromLanguage);
  
  // Generate translation (simulated)
  const translatedText = simulateTranslation(request);
  
  const processingTime = Date.now() - startTime;
  
  return {
    translatedText,
    confidence: emergencyTerms.length > 0 ? 0.95 : 0.85,
    detectedLanguage: request.fromLanguage,
    processingTime,
    emergencyTermsDetected: emergencyTerms
  };
}

/**
 * Detect emergency-related terms in the text
 */
function detectEmergencyTerms(text: string, language: string): string[] {
  const terms = CRITICAL_TERMS[language as keyof typeof CRITICAL_TERMS] || CRITICAL_TERMS.en;
  const foundTerms: string[] = [];
  
  const lowerText = text.toLowerCase();
  for (const term of terms) {
    if (lowerText.includes(term.toLowerCase())) {
      foundTerms.push(term);
    }
  }
  
  return foundTerms;
}

/**
 * Simulate translation with emergency-specific templates
 */
function simulateTranslation(request: TranslationRequest): string {
  const { text, toLanguage, context } = request;
  
  // Use emergency templates if context is provided
  if (context && context !== 'general') {
    const template = EMERGENCY_TEMPLATES[context as keyof typeof EMERGENCY_TEMPLATES];
    if (template && template[toLanguage as keyof typeof template]) {
      // Extract location and description from text (simplified)
      const location = extractLocation(text) || "Location unknown";
      const description = text.length > 50 ? text.substring(0, 50) + "..." : text;
      
      return template[toLanguage as keyof typeof template]
        .replace('{location}', location)
        .replace('{description}', description);
    }
  }
  
  // Fallback to mock translations
  const mockTranslations: Record<string, string> = {
    en: "EMERGENCY: There is a fire in the apartment building at 123 Main Street. Multiple people are trapped on the upper floors. We need immediate assistance!",
    es: "EMERGENCIA: Hay un incendio en el edificio de apartamentos en 123 Main Street. Varias personas están atrapadas en los pisos superiores. ¡Necesitamos asistencia inmediata!",
    fr: "URGENCE: Il y a un incendie dans l'immeuble d'appartements au 123 Main Street. Plusieurs personnes sont piégées aux étages supérieurs. Nous avons besoin d'une aide immédiate!",
    de: "NOTFALL: Es gibt einen Brand im Wohngebäude in der 123 Main Street. Mehrere Menschen sind in den oberen Stockwerken gefangen. Wir brauchen sofortige Hilfe!",
    it: "EMERGENZA: C'è un incendio nel palazzo di appartamenti in 123 Main Street. Più persone sono intrappolate ai piani superiori. Abbiamo bisogno di assistenza immediata!"
  };
  
  return mockTranslations[toLanguage] || mockTranslations.en;
}

/**
 * Extract location information from emergency text
 */
function extractLocation(text: string): string | null {
  // Simple regex patterns for common location formats
  const patterns = [
    /(?:at|@)\s+([^.!?]+)/i,
    /(?:address|location|ubicación|adresse|indirizzo):\s*([^.!?]+)/i,
    /\d+\s+[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|drive|dr)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1]?.trim() || match[0]?.trim();
    }
  }
  
  return null;
}

/**
 * Get supported languages for emergency translation
 */
export function getSupportedLanguages(): Array<{code: string, name: string, nativeName: string}> {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' }
  ];
}