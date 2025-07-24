import { useState } from 'react';

const presets = [
  "Someone is drowning at the beach near Muizenberg.",
  "My girlfriend just fell off a cliff at Lion's Head.",
  "Floodwaters are rising fast in my neighborhood.",
  "Lightning struck a tree that fell on a car with people inside.",
  "There's a violent protest and a fire being started near the municipal office.",
];

export function CallerInput({ onInput }: { onInput: (text: string) => void }) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [recording, setRecording] = useState(false);

  const handleSelectPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setText(e.target.value);
    onInput(e.target.value);
  };

  const handleMicInput = async () => {
    try {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setText(transcript);
        onInput(transcript);
        setRecording(false);
      };
      recognition.onerror = () => setRecording(false);
      setRecording(true);
      recognition.start();
    } catch (e) {
      alert('Voice input not supported in this browser.');
      setRecording(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-200">📞 Caller Input</h2>

      <div className="mb-4">
        <label className="mr-3 text-sm font-medium text-slate-600 dark:text-slate-400">Mode:</label>
        <button
          className={`px-3 py-2 rounded-lg mr-2 transition-colors ${mode === 'text' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          onClick={() => setMode('text')}
        >
          Text
        </button>
        <button
          className={`px-3 py-2 rounded-lg transition-colors ${mode === 'voice' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          onClick={() => setMode('voice')}
        >
          Voice
        </button>
      </div>

      {mode === 'text' ? (
        <div className="flex-1 flex flex-col">
          <textarea
            placeholder="Type your emergency message..."
            className="flex-1 p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-500 dark:placeholder-gray-400"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            onClick={() => onInput(text)}
          >
            Submit Message
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center">
          <button
            className={`px-6 py-4 rounded-lg text-white font-medium transition-all shadow-lg ${recording ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-green-600 hover:bg-green-700'}`}
            onClick={handleMicInput}
          >
            {recording ? 'Listening...' : '🎤 Start Voice Input'}
          </button>
          {text && (
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-gray-100">
              <strong>Captured:</strong> {text}
            </div>
          )}
        </div>
      )}

      <div className="mt-4">
        <label className="block mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">📚 Demo Crisis Scenarios:</label>
        <select
          className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value=""
          onChange={handleSelectPreset}
        >
          <option value="">— Select a scenario —</option>
          {presets.map((p, idx) => (
            <option key={idx} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}