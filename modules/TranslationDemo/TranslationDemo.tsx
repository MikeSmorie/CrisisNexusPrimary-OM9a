import { CallerInput } from './components/CallerInput';
import { AgentTranslator } from './components/AgentTranslator';
import { ResponderOutput } from './components/ResponderOutput';

export default function TranslationDemo() {
  return (
    <div className="h-full max-w-full overflow-hidden">
      <div className="flex h-full">
        <div className="flex-1 border-r border-gray-200 dark:border-gray-800 p-4 min-w-0">
          <CallerInput />
        </div>
        <div className="flex-1 border-r border-gray-200 dark:border-gray-800 p-4 min-w-0">
          <AgentTranslator />
        </div>
        <div className="flex-1 p-4 min-w-0">
          <ResponderOutput />
        </div>
      </div>
    </div>
  );
}