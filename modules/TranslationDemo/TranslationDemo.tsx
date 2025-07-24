import { useState } from 'react';
import { CallerInput } from './components/CallerInput';
import { AgentTranslator } from './components/AgentTranslator';
import { ResponderOutput } from './components/ResponderOutput';
import { AnimatedCard } from './components/AnimatedCard';

export default function TranslationDemo() {
  const [callerMessage, setCallerMessage] = useState('');
  const [englishTranslation, setEnglishTranslation] = useState('');
  const [edtgCode, setEdtgCode] = useState('');

  return (
    <div className="flex flex-col md:flex-row h-full gap-2 p-2 bg-slate-50 dark:bg-slate-900">
      <AnimatedCard>
        <CallerInput onInput={setCallerMessage} />
      </AnimatedCard>

      <AnimatedCard>
        <AgentTranslator
          input={callerMessage}
          setEnglish={setEnglishTranslation}
          setEdtg={setEdtgCode}
        />
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-200">📋 Crisis Triage Checklist</h3>
          <ul className="text-sm list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
            <li>📍 Exact location of the crisis?</li>
            <li>📞 Callback number?</li>
            <li>⏰ Time of occurrence?</li>
            <li>🩺 Injured parties involved?</li>
            <li>🧍 Caller role (bystander, victim, responder)?</li>
          </ul>
        </div>
      </AnimatedCard>

      <AnimatedCard>
        <ResponderOutput input={englishTranslation} />
      </AnimatedCard>
    </div>
  );
}