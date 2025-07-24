import TranslationDemo from '../../../modules/TranslationDemo/TranslationDemo';

export default function TranslationDemoPage() {
  return (
    <div className="h-full flex flex-col max-w-full bg-slate-50">
      <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 truncate">
            CrisisNexus Translation Demo
          </h1>
          <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Live Demo</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        <TranslationDemo />
      </div>
    </div>
  );
}