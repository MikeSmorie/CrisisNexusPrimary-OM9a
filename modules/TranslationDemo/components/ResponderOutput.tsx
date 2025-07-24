import { useState } from 'react';
import { translateFromEnglish } from '../utils/translate';

export function ResponderOutput({ input }: { input: string }) {
  const [language, setLanguage] = useState('Zulu');
  const [output, setOutput] = useState('');
  const [dispatched, setDispatched] = useState(false);

  const handleOutput = async () => {
    const translated = await translateFromEnglish(
      `Crisis received. Help is being dispatched. ${input}`,
      language
    );
    setOutput(translated);
    setDispatched(false);
    speak(translated, language);
  };

  const handleDispatch = () => {
    setDispatched(true);
    console.log(`[DISPATCH] Message dispatched in ${language}:`, output);
  };

  const speak = (text: string, lang: string) => {
    const synth = window.speechSynthesis;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = mapLang(lang);
    synth.speak(utter);
  };

  const mapLang = (lang: string) => {
    const mapping: Record<string, string> = {
      English: 'en-US',
      Afrikaans: 'af-ZA',
      Zulu: 'zu-ZA',
      Xhosa: 'xh-ZA',
      Sotho: 'st-ZA',
      Tswana: 'tn-ZA',
      Venda: 've-ZA',
      Tsonga: 'ts-ZA',
      Swati: 'ss-ZA',
      Ndebele: 'nr-ZA',
      'Northern Sotho': 'nso-ZA',
    };
    return mapping[lang] || 'en-US';
  };

  const languageOptions = ["Zulu", "Xhosa", "Afrikaans", "Tswana", "Sotho", "Venda", "Tsonga", "Swati", "Ndebele", "Northern Sotho", "English"];

  return (
    <div className="h-full flex flex-col border-2 border-purple-400 rounded-2xl">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 backdrop-blur-md shadow-sm p-4 rounded-t-2xl border-b border-purple-200 dark:border-purple-700">
        <h2 className="text-lg font-bold text-purple-800 dark:text-purple-200">🧑‍🚒 Responder View</h2>
      </div>
      
      <div className="flex-1 flex flex-col p-4">
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">Responder language:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {languageOptions.map((lang) => (
              <option key={lang}>{lang}</option>
            ))}
          </select>
        </div>

        <button
          className="mb-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleOutput}
          disabled={!input}
        >
          Translate & Preview
        </button>

        <div className="flex-1 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 overflow-auto mb-4">
          <div className="text-sm whitespace-pre-wrap text-gray-900 dark:text-gray-100 leading-relaxed">
            {output || 'Translated response will appear here...'}
          </div>
        </div>

        {output && (
          <div className="mt-auto">
            <button
              className="w-full py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors shadow-md font-semibold"
              onClick={handleDispatch}
            >
              🚨 Dispatch to Responder
            </button>
            {dispatched && (
              <p className="mt-3 text-green-700 dark:text-green-400 text-sm font-semibold text-center">
                ✅ Message dispatched and logged successfully.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}