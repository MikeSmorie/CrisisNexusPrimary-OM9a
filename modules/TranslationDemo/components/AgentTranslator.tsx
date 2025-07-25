import { useEffect, useState } from 'react';
import { translateToEnglish, getEDTG } from '../utils/translate';

export function AgentTranslator({
  input,
  setEnglish,
  setEdtg,
}: {
  input: string;
  setEnglish: (val: string) => void;
  setEdtg: (val: string) => void;
}) {
  const [log, setLog] = useState('');
  
  // Intent classifier function
  const classifyIntent = (text: string): 'emergency' | 'greeting' | 'unclear' => {
    const lowerText = text.toLowerCase();
    
    // Non-emergency greetings/tests
    const greetingPatterns = [
      'hello', 'hi', 'hey', 'can you hear me', 'is this working', 
      'test', 'testing', '123', 'check', 'mic check'
    ];
    
    // Emergency keywords
    const emergencyPatterns = [
      'fire', 'accident', 'injury', 'hurt', 'bleeding', 'emergency', 'help',
      'drowning', 'fell', 'cliff', 'flood', 'violence', 'attack', 'crash',
      'stuck', 'trapped', 'medical', 'ambulance', 'police', 'hospital'
    ];
    
    if (greetingPatterns.some(pattern => lowerText.includes(pattern))) {
      return 'greeting';
    }
    
    if (emergencyPatterns.some(pattern => lowerText.includes(pattern))) {
      return 'emergency';
    }
    
    return 'unclear';
  };

  useEffect(() => {
    if (input) {
      const run = async () => {
        const english = await translateToEnglish(input);
        const edtg = getEDTG();
        const intent = classifyIntent(english);
        
        // Only route emergency content to ResponderOutput
        if (intent === 'emergency') {
          setEnglish(english);
          setEdtg(edtg);
        } else {
          setEnglish(''); // Clear responder output for non-emergencies
          setEdtg('');
        }

        const intentEmoji = {
          'emergency': '🚨',
          'greeting': '👋',
          'unclear': '❓'
        };

        const autoResponse = `
🧠 [AI Agent Log]
Raw Input: "${input}"
Translated: "${english}"
⏱ EDTG: ${edtg}
🔍 Interpreted Intent: ${intentEmoji[intent]} ${intent.toUpperCase()}
${intent === 'emergency' ? 
  '📌 Requesting location, callback, time of incident, injury status, and caller role...\n🛰 Routing to appropriate emergency channel...' : 
  intent === 'greeting' ? 
  '✋ Non-emergency greeting detected. Awaiting actual emergency report.' :
  '❓ Intent unclear. Please provide more specific emergency information.'
}`;
        setLog(autoResponse);
      };
      run();
    }
  }, [input]);

  return (
    <div className="h-full flex flex-col border-2 border-indigo-500 rounded-2xl">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 backdrop-blur-md shadow-sm p-4 rounded-t-2xl border-b border-indigo-200 dark:border-indigo-700">
        <h2 className="text-lg font-bold text-indigo-800 dark:text-indigo-200">🤖 AI Translator</h2>
      </div>
      
      <div className="bg-slate-900 rounded-lg p-4 overflow-auto max-h-[calc(100vh-200px)] m-4">
        <pre className="whitespace-pre-wrap text-white text-sm font-mono">
          {log || 'Waiting for caller input...'}
        </pre>
      </div>
    </div>
  );
}