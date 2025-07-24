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
    speak(translated, language);
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
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-200">🧑‍🚒 Responder Output</h2>
      
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">Select responder language:</label>
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
        Translate & Speak Response
      </button>

      <div className="flex-1 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 overflow-auto">
        <div className="text-sm whitespace-pre-wrap text-gray-900 dark:text-gray-100 leading-relaxed">
          {output || 'Translated response will appear here...'}
        </div>
      </div>
    </div>
  );
}