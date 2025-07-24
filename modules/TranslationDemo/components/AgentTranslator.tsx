import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UserCheck, ArrowRight, ArrowLeft, Brain, Zap } from 'lucide-react';

export function AgentTranslator() {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [sourceLanguage, setSourceLanguage] = useState('auto');
  const [targetLanguage, setTargetLanguage] = useState('en');

  const supportedLanguages = [
    { code: 'auto', name: 'Auto-detect', flag: '🔍' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' }
  ];

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    
    setIsTranslating(true);
    setTranslationProgress(0);
    
    // Simulate AI translation process
    const progressSteps = [20, 45, 70, 90, 100];
    for (const step of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setTranslationProgress(step);
    }
    
    // Simulate translation result
    const mockTranslations = [
      "EMERGENCY: There is a fire in the apartment building at 123 Main Street. Multiple people are trapped on the upper floors. We need immediate assistance!",
      "URGENT: Road accident with multiple casualties on Highway 95 near Exit 12. Ambulances required immediately.",
      "MEDICAL EMERGENCY: Elderly person having chest pains and difficulty breathing. Address: 456 Oak Avenue, Apartment 3B."
    ];
    
    const randomTranslation = mockTranslations[Math.floor(Math.random() * mockTranslations.length)];
    setTranslatedText(randomTranslation);
    setIsTranslating(false);
  };

  const handleSwapLanguages = () => {
    if (sourceLanguage !== 'auto') {
      setTargetLanguage(sourceLanguage);
      setSourceLanguage(targetLanguage);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserCheck className="h-5 w-5 text-blue-600" />
          AI Translator Agent
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Brain className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Real-time Translation
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {supportedLanguages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSwapLanguages}
            disabled={sourceLanguage === 'auto'}
            className="flex-shrink-0"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
          
          <Select value={targetLanguage} onValueChange={setTargetLanguage}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {supportedLanguages.filter(lang => lang.code !== 'auto').map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">Source Text</label>
          <Textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Emergency message from caller..."
            className="flex-1 min-h-24 resize-none"
          />
        </div>

        <div className="space-y-2">
          <Button 
            onClick={handleTranslate}
            disabled={isTranslating || !sourceText.trim()}
            className="w-full"
          >
            {isTranslating ? (
              <>
                <Zap className="h-4 w-4 mr-2 animate-pulse" />
                Translating...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Translate Message
              </>
            )}
          </Button>
          
          {isTranslating && (
            <div className="space-y-1">
              <Progress value={translationProgress} className="w-full" />
              <p className="text-xs text-center text-muted-foreground">
                Processing: {translationProgress}%
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">Translated Text</label>
          <Textarea
            value={translatedText}
            onChange={(e) => setTranslatedText(e.target.value)}
            placeholder="AI translation will appear here..."
            className="flex-1 min-h-24 resize-none"
          />
        </div>

        <Button 
          variant="outline"
          className="w-full"
          disabled={!translatedText}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Send to Responder
        </Button>
      </CardContent>
    </Card>
  );
}