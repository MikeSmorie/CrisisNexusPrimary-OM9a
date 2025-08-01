import { useState, useEffect } from 'react';
import { translateFromEnglish } from '../utils/translate';

export function ResponderOutput({ input, edtg }: { input: string; edtg?: string }) {
  const [language, setLanguage] = useState('Zulu');
  const [output, setOutput] = useState('');
  const [dispatched, setDispatched] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Automatically process when input or language changes (only for emergencies)
  useEffect(() => {
    if (input && input.trim() !== '') {
      setDispatched(false); // Reset dispatch state when language changes
      handleAutoDispatch();
    } else {
      // Clear output if no emergency input
      setOutput('');
      setDispatched(false);
    }
  }, [input, language]);

  const handleAutoDispatch = async () => {
    setIsProcessing(true);
    const message = `Emergency response dispatched. Location and details: ${input}`;
    
    try {
      let translatedMessage;
      if (language === 'English') {
        translatedMessage = message;
      } else {
        translatedMessage = await translateFromEnglish(message, language);
      }
      
      setOutput(translatedMessage);
      
      // Auto-dispatch after translation
      setTimeout(() => {
        setDispatched(true);
        console.log(`[AUTO-DISPATCH] Emergency dispatched in ${language}:`, translatedMessage);
      }, 1000);
      
    } catch (error) {
      console.error('Translation error:', error);
      setOutput('Error processing emergency dispatch');
    } finally {
      setIsProcessing(false);
    }
  };





  const languageOptions = ["Zulu", "Xhosa", "Afrikaans", "Tswana", "Sotho", "Venda", "Tsonga", "Swati", "Ndebele", "Northern Sotho", "English"];

  return (
    <div className="h-full flex flex-col border-2 border-purple-400 overflow-hidden relative bg-white dark:bg-gray-800" style={{resize: 'both'}}>
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 backdrop-blur-md shadow-sm p-4 border-b border-purple-200 dark:border-purple-700">
        <h2 className="text-lg font-bold text-purple-800 dark:text-purple-200">🧑‍🚒 Responder View</h2>
      </div>
      
      <div className="flex-1 flex flex-col p-4 min-h-0">
        <div className="mb-4 flex-shrink-0">
          <label className="block mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">Emergency responder language preference:</label>
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

        {isProcessing && (
          <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg flex-shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-yellow-800 dark:text-yellow-200 text-sm">Processing emergency dispatch...</span>
            </div>
          </div>
        )}

        <div className="flex-1 bg-slate-900 p-4 mb-4 overflow-y-auto">
          <pre className="whitespace-pre-wrap text-white text-sm font-mono">
            {output || (input ? '⛔ Content held for clarification - requires clearer emergency information' : 'Awaiting emergency dispatch...')}
          </pre>
        </div>

        {dispatched && (
          <div className="flex-shrink-0">
            <div className="w-full py-3 bg-green-700 text-white rounded-lg shadow-md font-semibold text-center">
              ✅ Emergency Dispatched Successfully
            </div>
            <p className="mt-3 text-green-700 dark:text-green-400 text-sm font-medium text-center">
              Response team notified in {language}
            </p>
          </div>
        )}
      </div>
      

    </div>
  );
}