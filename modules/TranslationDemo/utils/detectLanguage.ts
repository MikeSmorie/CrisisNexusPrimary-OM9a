// Language detection utility for emergency translation
export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  script?: string;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  emergencyPhrases: string[];
}

export const EMERGENCY_LANGUAGES: SupportedLanguage[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    emergencyPhrases: ['help', 'emergency', 'fire', 'ambulance', 'police', 'accident']
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    emergencyPhrases: ['ayuda', 'emergencia', 'fuego', 'ambulancia', 'policía', 'accidente']
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    emergencyPhrases: ['aide', 'urgence', 'feu', 'ambulance', 'police', 'accident']
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    emergencyPhrases: ['hilfe', 'notfall', 'feuer', 'krankenwagen', 'polizei', 'unfall']
  },
  {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    emergencyPhrases: ['aiuto', 'emergenza', 'fuoco', 'ambulanza', 'polizia', 'incidente']
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    emergencyPhrases: ['ajuda', 'emergência', 'fogo', 'ambulância', 'polícia', 'acidente']
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    emergencyPhrases: ['помощь', 'чрезвычайная ситуация', 'пожар', 'скорая помощь', 'полиция', 'авария']
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    emergencyPhrases: ['帮助', '紧急情况', '火灾', '救护车', '警察', '事故']
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    emergencyPhrases: ['助けて', '緊急事態', '火事', '救急車', '警察', '事故']
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    emergencyPhrases: ['مساعدة', 'طوارئ', 'حريق', 'إسعاف', 'شرطة', 'حادث']
  }
];

/**
 * Simple pattern-based language detection for emergency scenarios
 * In production, this would integrate with a proper language detection service
 */
export function detectLanguage(text: string): LanguageDetectionResult {
  if (!text || text.trim().length === 0) {
    return { language: 'unknown', confidence: 0 };
  }

  const normalizedText = text.toLowerCase().trim();
  let maxMatches = 0;
  let detectedLanguage = 'en'; // Default to English
  
  // Check for emergency phrase matches in each language
  for (const lang of EMERGENCY_LANGUAGES) {
    let matches = 0;
    
    for (const phrase of lang.emergencyPhrases) {
      if (normalizedText.includes(phrase.toLowerCase())) {
        matches++;
      }
    }
    
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedLanguage = lang.code;
    }
  }

  // Calculate confidence based on matches and text length
  const confidence = Math.min(maxMatches * 0.3 + (normalizedText.length > 10 ? 0.4 : 0.2), 1.0);
  
  return {
    language: detectedLanguage,
    confidence,
    script: getScriptType(normalizedText)
  };
}

/**
 * Determine script type for better language detection
 */
function getScriptType(text: string): string {
  if (/[\u4e00-\u9fff]/.test(text)) return 'chinese';
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'japanese';
  if (/[\u0600-\u06ff]/.test(text)) return 'arabic';
  if (/[\u0400-\u04ff]/.test(text)) return 'cyrillic';
  return 'latin';
}

/**
 * Get language name by code
 */
export function getLanguageName(code: string): string {
  const lang = EMERGENCY_LANGUAGES.find(l => l.code === code);
  return lang?.name || 'Unknown';
}

/**
 * Check if a language is supported for emergency translation
 */
export function isLanguageSupported(code: string): boolean {
  return EMERGENCY_LANGUAGES.some(l => l.code === code);
}