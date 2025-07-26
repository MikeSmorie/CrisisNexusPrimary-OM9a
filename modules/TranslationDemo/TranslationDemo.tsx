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
      {/* Three-column layout with proper sizing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 h-full w-full overflow-hidden">
        {/* Caller Input */}
        <div className="h-full max-h-full overflow-hidden">
          <CallerInput onInput={setCallerMessage} operatorMessage={operatorMessage} />
        </div>

        {/* Agent Translator */}
        <div className="h-full max-h-full overflow-hidden">
          <AgentTranslator
            input={callerMessage}
            setEnglish={setEnglishTranslation}
            setEdtg={setEdtgCode}
            setOperatorMessage={setOperatorMessage}
          />
        </div>

        {/* Responder Output */}
        <div className="h-full max-h-full overflow-hidden">
          <ResponderOutput input={englishTranslation} edtg={edtgCode} />
        </div>
      </div>
    </div>
  );
}