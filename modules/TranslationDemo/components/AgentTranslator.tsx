import { useEffect, useState } from 'react';
import { translateToEnglish, getEDTG } from '../utils/translate';
import { classifyIntent, generateAcknowledgement } from '../../../lib/classifyIntent';
import { handleIntent } from '../../../lib/intentRouter';
import { generateIntelligentResponse, type DialogueState } from '../../../lib/emergencyDialogueEngine';

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
  const [dialogueState, setDialogueState] = useState<DialogueState>({
    stage: 'initial',
    threatLevel: 0,
    context: { responses: [] }
  });

  useEffect(() => {
    if (input) {
      const run = async () => {
        const english = await translateToEnglish(input);
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

        // Generate response based on dialogue engine
        let responseText = '';
        if (dialogueResult.shouldDispatch) {
          responseText = `🚨 EMERGENCY DISPATCH INITIATED\n📡 ${dialogueResult.dispatchSummary}\n💬 AI Response: "${dialogueResult.response}"`;
        } else {
          responseText = `💬 AI Dialogue: "${dialogueResult.response}"\n📊 Threat Assessment: Building context (${dialogueResult.newState.threatLevel}% confidence)`;
        }

        const autoResponse = `
🧠 [Emergency Dialogue Engine]
Raw Input: "${input}"
Translated: "${english}"
⏱ EDTG: ${edtg}
🎯 Threat Level: ${dialogueResult.newState.threatLevel}% (Stage: ${dialogueResult.newState.stage})
📍 Context: ${dialogueResult.newState.context.location || 'Unknown'} | Person at risk: ${dialogueResult.newState.context.personInDanger ? 'Yes' : 'Unknown'}
Decision: ${dialogueResult.shouldDispatch ? '🚨 EMERGENCY DISPATCHED' : '🔄 Gathering Critical Information'}
${responseText}`;
        setLog(autoResponse);
      };
      run();
    }
  }, [input, dialogueState]);

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