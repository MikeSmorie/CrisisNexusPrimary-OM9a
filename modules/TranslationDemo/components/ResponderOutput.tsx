import { useState } from 'react';
import { translateFromEnglish } from '../utils/translate';

export function ResponderOutput({ input }: { input: string }) {
  const [language, setLanguage] = useState('Zulu');
  const [output, setOutput] = useState('');

  const handleOutput = async () => {
    const translated = await translateFromEnglish(
      `Crisis received. Help is being dispatched. ${input}`,
      language
    );
    setOutput(translated);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">🧑‍🚒 Responder Output</h2>
      <label className="block mb-2">Select responder language:</label>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      >
        {["Zulu", "Xhosa", "Afrikaans", "Tswana", "Sotho", "Venda", "Tsonga", "Swati", "Ndebele", "Northern Sotho", "English"].map((lang) => (
          <option key={lang}>{lang}</option>
        ))}
      </select>
      <button
        className="px-4 py-2 bg-purple-600 text-white rounded"
        onClick={handleOutput}
      >
        Translate Response
      </button>
      <div className="mt-2 p-2 border rounded bg-gray-50 text-sm whitespace-pre-wrap">{output}</div>
    </div>
  );
}