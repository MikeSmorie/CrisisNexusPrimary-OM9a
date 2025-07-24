import TranslationDemo from '../../../modules/TranslationDemo/TranslationDemo';

export default function TranslationDemoPage() {
  return (
    <div className="space-y-6 max-w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight truncate">Translation Demo</h1>
        </div>
      </div>
      
      <div className="h-[calc(100vh-200px)]">
        <TranslationDemo />
      </div>
    </div>
  );
}