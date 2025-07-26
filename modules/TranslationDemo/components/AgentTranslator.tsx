import { useEffect, useState } from 'react';
import { translateToEnglish, getEDTG } from '../utils/translate';
import { 
  updateSessionContext, 
  generateEscalatingResponse, 
  getSessionContext,
  cleanupOldSessions 
} from '../../../lib/contextMemory';

export function AgentTranslator({
  input,
  setEnglish,
  setEdtg,
  setOperatorMessage,
}: {
  input: string;
  setEnglish: (val: string) => void;
  setEdtg: (val: string) => void;
  setOperatorMessage: (val: string) => void;
}) {
  const [log, setLog] = useState('');
  const [dialogueHistory, setDialogueHistory] = useState<Array<{caller: string, operator: string}>>([]);
  const callerId = 'caller-session-1'; // In production, this would be unique per caller

  useEffect(() => {
    if (input) {
      const run = async () => {
        // Clean up old sessions periodically
        cleanupOldSessions();
        
        const english = await translateToEnglish(input);
        // CRITICAL: EDTG must be captured ONCE per event and never change
        const edtg = getEDTG();
        
        // Get current session context
        const currentContext = getSessionContext(callerId);
        
        // Generate intelligent escalating response
        const escalationResult = generateEscalatingResponse(currentContext, input);
        
        // Update session context with new dialogue
        const updatedContext = updateSessionContext(callerId, input, escalationResult.response);
        
        // Route to responder if dispatch threshold is met
        if (escalationResult.shouldDispatch) {
          setEnglish(english);
          setEdtg(edtg);
        } else {
          setEnglish(''); // Hold for more information
          setEdtg('');
        }

        // Set operator message for caller display
        console.log('🧠 Setting operator message:', escalationResult.response);
        setOperatorMessage(escalationResult.response);

        // Build dialogue history for comprehensive log
        const newDialogueEntry = {
          caller: input,
          operator: escalationResult.response
        };
        
        const updatedHistory = [...dialogueHistory, newDialogueEntry];
        setDialogueHistory(updatedHistory);

        // Build dialogue log display
        const dialogueLog = updatedHistory.map((entry, idx) => 
          `Caller: ${entry.caller}\nOperator: ${entry.operator}`
        ).join('\n\n');

        // Generate enhanced response display
        const detectedKeywords = Array.from(updatedContext.mentionedKeywords);
        let responseText = '';
        if (escalationResult.shouldDispatch) {
          responseText = `🚨 EMERGENCY DISPATCH INITIATED\n📡 Responders notified based on threat assessment`;
        } else {
          responseText = `🔄 Escalation Level: ${escalationResult.escalationLevel.toUpperCase()}\n📊 Continuing intelligent assessment`;
        }

        const autoResponse = `
🧠 [AI Agent Log]
⏱ EDTG: ${edtg} [LOCKED]
🔍 Detected Keywords: [${detectedKeywords.join(', ') || 'None'}]
🧮 Threat Score: ${updatedContext.threatScore}%
📈 Escalation Level: ${escalationResult.escalationLevel.toUpperCase()}
🗣️ Operator Response: "${escalationResult.response}"
📡 Routed to Responder: ${escalationResult.shouldDispatch ? '✅' : '❌'}

📞 FULL DIALOGUE LOG:
${dialogueLog}

${responseText}`;

        setLog(autoResponse);
      };
      run();
    }
  }, [input]);

  return (
    <div className="h-full flex flex-col border-2 border-indigo-500 resize overflow-auto min-h-[400px] relative bg-white dark:bg-gray-800">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 backdrop-blur-md shadow-sm p-4 border-b border-indigo-200 dark:border-indigo-700">
        <h2 className="text-lg font-bold text-indigo-800 dark:text-indigo-200">🤖 AI Translator</h2>
      </div>
      
      <div className="flex-1 bg-slate-900 p-4 overflow-auto m-4 min-h-[300px]">
        <pre className="whitespace-pre-wrap text-white text-sm font-mono">
          {log || 'Waiting for caller input...'}
        </pre>
      </div>
      
      {/* Resize Handle */}
      <div className="absolute bottom-0 right-0 w-4 h-4 bg-indigo-500 cursor-se-resize opacity-50 hover:opacity-100 transition-opacity"></div>
    </div>
  );
}