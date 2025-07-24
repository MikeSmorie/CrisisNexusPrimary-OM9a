import { useState } from 'react';
import { translateFromEnglish } from '../utils/translate';

export function ResponderOutput({ input }: { input: string }) {
  const [language, setLanguage] = useState('Zulu');
  const [output, setOutput] = useState('');
  const [dispatched, setDispatched] = useState(false);
  const [enableTTS, setEnableTTS] = useState(false); // Disabled by default due to poor browser TTS quality

  const handleOutput = async () => {
    const translated = await translateFromEnglish(
      `Crisis received. Help is being dispatched. ${input}`,
      language
    );
    setOutput(translated);
    setDispatched(false);
    // Don't auto-play TTS - let user choose manually
  };

  const handleDispatch = () => {
    setDispatched(true);
    console.log(`[DISPATCH] Message dispatched in ${language}:`, output);
  };

  const speak = (text: string, lang: string) => {
    if (!window.speechSynthesis) {
      console.warn('Speech synthesis not supported');
      return;
    }
    
    const synth = window.speechSynthesis;
    
    // Clear any existing speech
    synth.cancel();
    
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = mapLang(lang);
    
    // Enhance voice quality with optimized settings
    utter.rate = 0.85; // Slower for emergency clarity
    utter.pitch = 1.1; // Slightly higher pitch for urgency but not robotic
    utter.volume = 0.9; // Clear volume
    
    // Wait for voices to load, then select the best available voice
    const selectVoice = () => {
      const voices = synth.getVoices();
      if (voices.length === 0) return;
      
      const targetLang = mapLang(lang).split('-')[0];
      
      // Priority order: Natural > Google > Microsoft > Any matching language
      const preferredVoice = 
        voices.find(voice => voice.lang.startsWith(targetLang) && voice.name.toLowerCase().includes('natural')) ||
        voices.find(voice => voice.lang.startsWith(targetLang) && voice.name.toLowerCase().includes('google')) ||
        voices.find(voice => voice.lang.startsWith(targetLang) && voice.name.toLowerCase().includes('microsoft')) ||
        voices.find(voice => voice.lang.startsWith(targetLang) && !voice.name.toLowerCase().includes('eSpeak')) ||
        voices.find(voice => voice.lang.startsWith(targetLang));
      
      if (preferredVoice) {
        utter.voice = preferredVoice;
        console.log(`Using voice: ${preferredVoice.name} (${preferredVoice.lang})`);
      }
      
      synth.speak(utter);
    };
    
    // Ensure voices are loaded
    if (synth.getVoices().length === 0) {
      synth.addEventListener('voiceschanged', selectVoice, { once: true });
    } else {
      selectVoice();
    }
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

        <div className="mb-4">
          <label className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={enableTTS}
              onChange={(e) => setEnableTTS(e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span>🔊 Show audio playback option (Note: Browser TTS quality varies)</span>
          </label>
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
          {output && enableTTS && (
            <button
              onClick={() => speak(output, language)}
              className="mt-3 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
            >
              🔊 Play Audio
            </button>
          )}
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