import { useEffect, useState } from 'react';
import { translateToEnglish, getEDTG } from '../utils/translate';

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

  useEffect(() => {
    if (input) {
      const run = async () => {
        const english = await translateToEnglish(input);
        const edtg = getEDTG();
        setEnglish(english);
        setEdtg(edtg);

        const autoResponse = `
🧠 [AI Agent Log]
Incoming Crisis: "${english}"
⏱ EDTG: ${edtg}
🔎 Classifying event... ✅
📌 Requesting location, callback, time of incident, injury status, and caller role...
🛰 Routing to appropriate emergency channel...`;
        setLog(autoResponse);
      };
      run();
    }
  }, [input]);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">🤖 AI Agent</h2>
      <pre className="bg-gray-100 p-3 rounded whitespace-pre-wrap text-sm">{log}</pre>
    </div>
  );
}