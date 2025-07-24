import { useState } from 'react';
import { translateToEnglish, getEDTG } from '../utils/translate';

export function AgentTranslator({ input }: { input: string }) {
  const [log, setLog] = useState('');

  const handleTranslate = async () => {
    const english = await translateToEnglish(input);
    const edtg = getEDTG();
    setLog(`🧠 English Translation: ${english}\n📌 EDTG: ${edtg}`);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">🤖 AI Agent</h2>
      <p className="mb-2 text-sm italic text-gray-600">Logs all input in English + EDTG code</p>
      <button
        className="mb-2 px-4 py-2 bg-green-600 text-white rounded"
        onClick={handleTranslate}
      >
        Translate Input
      </button>
      <pre className="bg-gray-100 p-2 rounded whitespace-pre-wrap">{log}</pre>
    </div>
  );
}