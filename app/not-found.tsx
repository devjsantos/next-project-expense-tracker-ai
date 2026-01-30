import Link from 'next/link';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-center items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Animated Icon Container */}
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full" />
          <div className="relative bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-8 rounded-[3rem] shadow-2xl">
            <FileQuestion size={64} className="text-indigo-500 animate-bounce-subtle" />
          </div>
          
          {/* Floating "404" Badge */}
          <div className="absolute -top-2 -right-2 bg-slate-900 dark:bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-xl">
            Error 404
          </div>
        </div>

        {/* Text Content */}
        <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">
          Lost in the <span className="text-indigo-500">System?</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-10 leading-relaxed uppercase tracking-wide">
          The page you are looking for has been moved, deleted, or never existed in this financial timeline.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/"
            className="flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Home size={16} /> Return Home
          </Link>
          
          <Link 
            href="/dashboard"
            className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <ArrowLeft size={16} /> Dashboard
          </Link>
        </div>

        {/* Decorative Grid Background Element */}
        <div className="mt-12 opacity-10 dark:opacity-5">
          <p className="font-black text-[80px] leading-none select-none">SMARTJUAN</p>
        </div>
      </div>
    </div>
  );
}