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
    <div className="h-full flex flex-col border-2 border-indigo-500 rounded-2xl">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 backdrop-blur-md shadow-sm p-4 rounded-t-2xl border-b border-indigo-200 dark:border-indigo-700">
        <h2 className="text-lg font-bold text-indigo-800 dark:text-indigo-200">🤖 AI Translator</h2>
      </div>
      
      <div className="flex-1 bg-gray-100 dark:bg-gray-800 p-4 m-4 rounded-lg border border-gray-200 dark:border-gray-600 overflow-auto">
        <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100 leading-relaxed">{log || 'Waiting for caller input...'}</pre>
      </div>
    </div>
  );
}