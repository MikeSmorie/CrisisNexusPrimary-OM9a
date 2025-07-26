import TranslationDemo from '../../../modules/TranslationDemo/TranslationDemo';

export default function TranslationDemoPage() {
  return (
    <div className="h-screen w-screen max-w-none bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Compact header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 min-h-[60px]">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-200 truncate">
            CrisisNexus Translation Demo
          </h1>
          <span className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">Live Demo</span>
        </div>
      </div>
      
      {/* Full height translation demo - no overflow constraint */}
      <div className="h-[calc(100vh-60px)] w-full">
        <TranslationDemo />
      </div>
    </div>
  );
}