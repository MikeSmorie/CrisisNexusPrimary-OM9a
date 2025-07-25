import { useEffect, useState } from 'react';
import { translateToEnglish, getEDTG } from '../utils/translate';
import { classifyIntent, generateAcknowledgement } from '../../../lib/classifyIntent';
import { handleIntent } from '../../../lib/intentRouter';

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

  useEffect(() => {
    if (input) {
      const run = async () => {
        const english = await translateToEnglish(input);
        const edtg = getEDTG();
        const result = classifyIntent(english);
        
        // Use intent router for emergency confirmation logic
        const intentResponse = handleIntent(result.type.toUpperCase(), result.confidence, english);
        const routeToResponder = intentResponse.routeToResponder || false;
        
        // Only route confirmed emergency content to ResponderOutput
        if (routeToResponder) {
          setEnglish(english);
          setEdtg(edtg);
        } else {
          setEnglish(''); // Clear responder output for non-emergencies
          setEdtg('');
        }

        const intentEmoji = {
          'emergency': '🚨',
          'greeting': '👋',
          'noise': '🔇',
          'unknown': '❓'
        };

        let responseText = '';
        if (intentResponse.intent === 'CONFIRM_EMERGENCY') {
          responseText = `⚠️ Confirmation Required: "${intentResponse.message}"\n⛔ Awaiting confirmation before routing to responder.`;
        } else if (routeToResponder) {
          responseText = '📌 Requesting location, callback, time of incident, injury status, and caller role...\n📡 Routing to appropriate emergency channel...';
        } else {
          const acknowledgement = generateAcknowledgement(result.type, result.confidence);
          responseText = `💬 Caller Acknowledgement: "${acknowledgement}"\n⛔ Held for Clarification - AI needs clearer emergency information before routing.`;
        }

        const autoResponse = `
🧠 [AI Agent Log]
Raw Input: "${input}"
Translated: "${english}"
⏱ EDTG: ${edtg}
Intent: 🧠 ${result.type.toUpperCase()} (${Math.round(result.confidence * 100)}%)
Decision: ${routeToResponder ? '📡 Routed to Responder' : intentResponse.intent === 'CONFIRM_EMERGENCY' ? '⚠️ Awaiting Confirmation' : '⛔ Held for Clarification'}
${responseText}`;
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