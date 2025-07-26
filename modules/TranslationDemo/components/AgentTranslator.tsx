import { useEffect, useState } from 'react';
import { translateToEnglish, getEDTG } from '../utils/translate';
import { classifyIntent, generateAcknowledgement } from '../../../lib/classifyIntent';
import { handleIntent } from '../../../lib/intentRouter';
import { generateIntelligentResponse, type DialogueState } from '../../../lib/emergencyDialogueEngine';

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
  const [dialogueState, setDialogueState] = useState<DialogueState>({
    stage: 'initial',
    threatLevel: 0,
    context: { responses: [] }
  });

  useEffect(() => {
    if (input) {
      const run = async () => {
        const english = await translateToEnglish(input);
        // CRITICAL: EDTG must be captured ONCE per event and never change
        const edtg = getEDTG();
        
        // Use intelligent dialogue engine for progressive threat assessment
        const dialogueResult = generateIntelligentResponse(dialogueState, input);
        setDialogueState(dialogueResult.newState);
        
        // Route to responder if dispatch threshold is met
        if (dialogueResult.shouldDispatch) {
          setEnglish(english);
          setEdtg(edtg);
        } else {
          setEnglish(''); // Hold for more information
          setEdtg('');
        }

        // Set operator message for caller display
        console.log('🧠 Setting operator message:', dialogueResult.response);
        setOperatorMessage(dialogueResult.response);

        // Build dialogue history for comprehensive log
        const newDialogueEntry = {
          caller: input,
          operator: dialogueResult.response
        };
        
        const updatedHistory = [...dialogueHistory, newDialogueEntry];
        setDialogueHistory(updatedHistory);

        // Build dialogue log display
        const dialogueLog = updatedHistory.map((entry, idx) => 
          `Caller: ${entry.caller}\nOperator: ${entry.operator}`
        ).join('\n\n');

        // Generate response based on dialogue engine
        let responseText = '';
        if (dialogueResult.shouldDispatch) {
          responseText = `🚨 EMERGENCY DISPATCH INITIATED\n📡 ${dialogueResult.dispatchSummary}`;
        } else {
          responseText = `📊 Threat Assessment: Building context (${dialogueResult.newState.threatLevel}% confidence)\n🔄 Gathering additional information from caller`;
        }

        const autoResponse = `
🧠 [Emergency Dialogue Engine]
⏱ EDTG: ${edtg} [LOCKED]
🎯 Threat Level: ${dialogueResult.newState.threatLevel}% (Stage: ${dialogueResult.newState.stage})
📍 Context: ${dialogueResult.newState.context.location || 'Unknown'} | Person at risk: ${dialogueResult.newState.context.personInDanger ? 'Yes' : 'Unknown'}
Decision: ${dialogueResult.shouldDispatch ? '🚨 EMERGENCY DISPATCHED' : '🔄 Gathering Critical Information'}

📞 FULL DIALOGUE LOG:
${dialogueLog}

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