import { useState } from 'react';
import { CallerInput } from './components/CallerInput';
import { AgentTranslator } from './components/AgentTranslator';
import { ResponderOutput } from './components/ResponderOutput';


export default function TranslationDemo() {
  const [callerMessage, setCallerMessage] = useState('');
  const [englishTranslation, setEnglishTranslation] = useState('');
  const [edtgCode, setEdtgCode] = useState('');
  const [operatorMessage, setOperatorMessage] = useState('');

  return (
    <div className="h-full w-full max-w-none bg-slate-50 dark:bg-slate-900">
      {/* Flexible layout for resizable windows */}
      <div className="flex flex-col lg:flex-row gap-4 p-4 h-full w-full">
        {/* Caller Input - Fully resizable */}
        <div className="flex-1 min-w-0 min-h-[400px]">
          <CallerInput onInput={setCallerMessage} operatorMessage={operatorMessage} />
        </div>

        {/* Agent Translator - Fully resizable */}
        <div className="flex-1 min-w-0 min-h-[400px]">
          <AgentTranslator
            input={callerMessage}
            setEnglish={setEnglishTranslation}
            setEdtg={setEdtgCode}
            setOperatorMessage={setOperatorMessage}
          />
        </div>

        {/* Responder Output - Fully resizable */}
        <div className="flex-1 min-w-0 min-h-[400px]">
          <ResponderOutput input={englishTranslation} edtg={edtgCode} />
        </div>
      </div>
    </div>
  );
}