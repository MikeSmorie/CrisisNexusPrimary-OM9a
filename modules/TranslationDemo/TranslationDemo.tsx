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
    <div className="h-full w-full max-w-none bg-slate-50 dark:bg-slate-900">
      {/* Responsive grid layout - stacks on mobile, side-by-side on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 h-full w-full">
        {/* Caller Input - Full width on mobile, 1/3 on desktop */}
        <div className="w-full min-h-[400px] lg:min-h-full">
          <AnimatedCard>
            <CallerInput onInput={setCallerMessage} />
          </AnimatedCard>
        </div>

        {/* Agent Translator - Full width on mobile, 1/3 on desktop */}
        <div className="w-full min-h-[400px] lg:min-h-full">
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
        </div>

        {/* Responder Output - Full width on mobile, 1/3 on desktop */}
        <div className="w-full min-h-[400px] lg:min-h-full">
          <AnimatedCard>
            <ResponderOutput input={englishTranslation} />
          </AnimatedCard>
        </div>
      </div>
    </div>
  );
}