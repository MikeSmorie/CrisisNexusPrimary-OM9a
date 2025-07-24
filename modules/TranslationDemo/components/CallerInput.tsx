import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Phone, Languages, AlertTriangle } from 'lucide-react';

export function CallerInput() {
  const [callerMessage, setCallerMessage] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState('medium');

  const emergencyLanguages = [
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

  const handleLanguageDetect = () => {
    // Simulate language detection
    const languages = ['Spanish', 'French', 'German', 'Italian', 'Portuguese'];
    const randomLang = languages[Math.floor(Math.random() * languages.length)];
    setDetectedLanguage(randomLang);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Phone className="h-5 w-5 text-red-600" />
          Caller Input
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Emergency Hotline
          </Badge>
          <Badge 
            variant={urgencyLevel === 'high' ? 'destructive' : urgencyLevel === 'medium' ? 'secondary' : 'outline'}
            className="text-xs"
          >
            {urgencyLevel.toUpperCase()} Priority
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Urgency Level</label>
          <Select value={urgencyLevel} onValueChange={setUrgencyLevel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">Caller Message</label>
          <Textarea
            value={callerMessage}
            onChange={(e) => setCallerMessage(e.target.value)}
            placeholder="Type emergency caller's message in any language..."
            className="flex-1 min-h-32 resize-none"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Language Detection</label>
            <Button
              onClick={handleLanguageDetect}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Languages className="h-3 w-3" />
              Detect
            </Button>
          </div>
          
          {detectedLanguage && (
            <Badge variant="secondary" className="w-full justify-center py-2">
              <Languages className="h-3 w-3 mr-1" />
              Detected: {detectedLanguage}
            </Badge>
          )}

          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Override language detection" />
            </SelectTrigger>
            <SelectContent>
              {emergencyLanguages.map((lang) => (
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

        <Button 
          className="w-full"
          variant={urgencyLevel === 'high' ? 'destructive' : 'default'}
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Process Emergency Call
        </Button>
      </CardContent>
    </Card>
  );
}