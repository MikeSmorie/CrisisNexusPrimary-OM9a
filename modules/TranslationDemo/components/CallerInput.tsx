import { useState, useRef } from 'react';

const presets = [
  "Someone is drowning at the beach near Muizenberg.",
  "My girlfriend just fell off a cliff at Lion's Head.",
  "Floodwaters are rising fast in my neighborhood.",
  "Lightning struck a tree that fell on a car with people inside.",
  "There's a violent protest and a fire being started near the municipal office.",
];

export function CallerInput({ onInput, operatorMessage }: { onInput: (text: string) => void; operatorMessage?: string }) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [recording, setRecording] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState('auto');
  const recognitionRef = useRef<any>(null);

  const handleSelectPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setText(e.target.value);
    onInput(e.target.value);
  };

  const startRecording = async () => {
    try {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognitionRef.current = recognition;
      
      // Set language based on user selection
      const langMap: Record<string, string> = {
        'auto': 'en-US',
        'English': 'en-US',
        'Afrikaans': 'af-ZA',
        'Zulu': 'zu-ZA',
        'Xhosa': 'xh-ZA',
        'Sotho': 'st-ZA'
      };
      recognition.lang = langMap[voiceLanguage] || 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = true; // Keep listening until stopped
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setText(transcript);
        // Auto-submit voice input immediately when speech ends
        if (event.results[event.results.length - 1].isFinal) {
          setTimeout(() => {
            onInput(transcript);
            setText(''); // Clear input after submission
          }, 500); // Small delay for better UX
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setRecording(false);
      };
      
      recognition.onend = () => {
        setRecording(false);
        // Ensure voice input is submitted when recording ends
        if (text) {
          onInput(text);
          setText(''); // Clear input after submission
        }
      };
      
      setRecording(true);
      recognition.start();
    } catch (e) {
      alert('Voice input not supported in this browser.');
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setRecording(false);
    if (text) {
      onInput(text);
      setText(''); // Clear input after submission
    }
  };

  // Debug: Log operator message
  console.log('📞 Caller received operator message:', operatorMessage);

  return (
    <div className="h-full flex flex-col border-2 border-blue-400 rounded-lg resize overflow-auto min-h-[400px]">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 backdrop-blur-md shadow-sm p-4 rounded-t-lg border-b border-blue-200 dark:border-blue-700">
        <h2 className="text-lg font-bold text-blue-800 dark:text-blue-200">📞 Victim Caller</h2>
      </div>
      
      <div className="flex-1 flex flex-col p-4">

      {/* Operator Dialogue Display */}
      {operatorMessage && (
        <div className="mb-4 bg-blue-900/30 border border-blue-500 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-blue-300 font-bold text-sm whitespace-nowrap">📞 Operator:</span>
            <span className="text-white text-sm leading-relaxed">{operatorMessage}</span>
          </div>
        </div>
      )}
      
      {/* Debug: Show if operatorMessage exists */}
      {!operatorMessage && (
        <div className="mb-4 bg-gray-700/50 border border-gray-600 rounded-lg p-3">
          <div className="text-gray-400 text-xs italic">
            Waiting for operator response...
          </div>
        </div>
      )}

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
            onClick={() => {
              onInput(text);
              setText(''); // Clear input after submission
            }}
          >
            Submit Message
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Language selector for voice input */}
          <div className="mb-4 w-full max-w-xs">
            <label className="block mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">Voice Language:</label>
            <select
              value={voiceLanguage}
              onChange={(e) => setVoiceLanguage(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="auto">Auto Detect</option>
              <option value="English">English</option>
              <option value="Afrikaans">Afrikaans</option>
              <option value="Zulu">Zulu</option>
              <option value="Xhosa">Xhosa</option>
              <option value="Sotho">Sotho</option>
            </select>
          </div>
          
          {!recording ? (
            <button
              className="px-6 py-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-all shadow-lg"
              onClick={startRecording}
            >
              🎤 Start Voice Input
            </button>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="px-6 py-4 rounded-lg bg-red-600 text-white font-medium animate-pulse shadow-lg">
                🔴 Recording... Speak your emergency
              </div>
              <button
                className="px-6 py-3 rounded-lg bg-red-700 hover:bg-red-800 text-white font-medium transition-all shadow-lg"
                onClick={stopRecording}
              >
                ⏹️ Stop & Submit
              </button>
            </div>
          )}
          {text && (
            <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 rounded-lg border border-green-300 dark:border-green-600 text-sm text-gray-900 dark:text-gray-100">
              <strong>✅ Captured & Auto-Submitted:</strong> {text}
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
    </div>
  );
}