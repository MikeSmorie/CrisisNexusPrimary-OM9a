import { useState } from 'react';
import { CallerInput } from './components/CallerInput';
import { AgentTranslator } from './components/AgentTranslator';
import { ResponderOutput } from './components/ResponderOutput';

export default function TranslationDemo() {
  const [callerMessage, setCallerMessage] = useState('');
  const [englishTranslation, setEnglishTranslation] = useState('');
  const [edtgCode, setEdtgCode] = useState('');

  return (
    <div className="flex h-full">
      <div className="w-1/3 border-r p-4">
        <CallerInput onInput={setCallerMessage} />
      </div>
      <div className="w-1/3 border-r p-4">
        <AgentTranslator
          input={callerMessage}
          setEnglish={setEnglishTranslation}
          setEdtg={setEdtgCode}
        />
        <div className="mt-4">
          <h3 className="font-semibold mb-2">📋 Crisis Triage Checklist</h3>
          <ul className="text-sm list-disc list-inside text-gray-700 space-y-1">
            <li>📍 What is the exact location of the crisis?</li>
            <li>📞 What is your phone number or callback contact?</li>
            <li>⏰ When did this occur?</li>
            <li>🩺 Are there any injured persons?</li>
            <li>🆘 What is your name and role (bystander, responder, victim)?</li>
          </ul>
        </div>
      </div>
      <div className="w-1/3 p-4">
        <ResponderOutput input={englishTranslation} />
      </div>
    </div>
  );
}