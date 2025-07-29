import { useEffect, useState } from 'react';
import { translateToEnglish, getEDTG } from '../utils/translate';
import { 
  updateSessionContext, 
  generateEscalatingResponse, 
  getSessionContext,
  cleanupOldSessions 
} from '../../../lib/contextMemory';
import { getContextualQuestions } from '../../../lib/operatorSOP';

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
        
        // Apply contextual questioning for smart threat-aware interrogation
        const contextualQuestions = getContextualQuestions({
          history: currentContext.conversationHistory.map(h => h.caller),
          threatWords: Array.from(currentContext.activeThreats || []),
          missingPeople: /missing|gone|disappeared/.test(input.toLowerCase()),
          bloodSeen: /blood/.test(input.toLowerCase()),
          reducedHeadcount: /only (one|two|three)/.test(input.toLowerCase())
        });
        
        // Use contextual question if available and not dispatching
        const finalResponse = !escalationResult.shouldDispatch && contextualQuestions.length > 0 
          ? contextualQuestions[0] 
          : escalationResult.response;
        
        // Update session context with new dialogue
        const updatedContext = updateSessionContext(callerId, input, finalResponse);
        
        // Route to responder if dispatch threshold is met
        if (escalationResult.shouldDispatch && escalationResult.dispatchSummary) {
          setEnglish(escalationResult.dispatchSummary); // Send full dispatch summary to responder
          setEdtg(edtg);
        } else {
          setEnglish(''); // Hold for more information
          setEdtg('');
        }

        // Set operator message for caller display
        console.log('🧠 Setting operator message:', finalResponse);
        setOperatorMessage(finalResponse);
        
        // Handle severe crank call escalation
        if (escalationResult.escalateToAdmin) {
          console.warn('🚨 ADMIN ESCALATION: Severe crank call detected', {
            callerId,
            input,
            escalationLevel: updatedContext.escalationLevel
          });
        }

        // Build dialogue history for comprehensive log
        const newDialogueEntry = {
          caller: input,
          operator: finalResponse
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

        // Enhanced display with SOP analysis
        const crankStatus = escalationResult.crankDetected ? '⚠️ CRANK DETECTED' : '✅ Legitimate Call';
        const adminEscalation = escalationResult.escalateToAdmin ? '🚨 ADMIN NOTIFIED' : '';
        
        const contextTags = [];
        if (detectedKeywords.includes('shark') || detectedKeywords.includes('attack')) contextTags.push('🦈 SHARK THREAT');
        if (detectedKeywords.includes('bleeding') || detectedKeywords.includes('injured')) contextTags.push('🩸 INJURY');
        if (detectedKeywords.includes('stuck') || detectedKeywords.includes('trapped')) contextTags.push('🚧 ENTRAPMENT');
        if (detectedKeywords.includes('drowning') || detectedKeywords.includes('water')) contextTags.push('🌊 WATER EMERGENCY');

        const autoResponse = `
🧠 [Enhanced AI Emergency SOP Analysis]
⏱ EDTG: ${edtg} [LOCKED]
🔍 Context Tags: [${contextTags.join(', ') || 'General Emergency'}]
🧮 Threat Score: ${updatedContext.threatScore}%
📈 Escalation: ${escalationResult.escalationLevel.toUpperCase()}
${crankStatus} ${adminEscalation}

❓ Deductive Question: "${escalationResult.response}"
📡 Responder Routing: ${escalationResult.shouldDispatch ? 'YES - DISPATCHING' : 'NO - GATHERING INFO'}

📞 FULL DIALOGUE LOG:
${dialogueLog}

${responseText}`;

        setLog(autoResponse);
      };
      run();
    }
  }, [input]);

  return (
    <div className="h-full flex flex-col border-2 border-indigo-500 overflow-hidden relative bg-white dark:bg-gray-800" style={{resize: 'both'}}>
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 backdrop-blur-md shadow-sm p-4 border-b border-indigo-200 dark:border-indigo-700">
        <h2 className="text-lg font-bold text-indigo-800 dark:text-indigo-200">🤖 AI Translator</h2>
      </div>
      
      <div className="flex-1 bg-slate-900 p-4 m-4 overflow-y-auto">
        <pre className="whitespace-pre-wrap text-white text-sm font-mono">
          {log || 'Waiting for caller input...'}
        </pre>
      </div>
      

    </div>
  );
}