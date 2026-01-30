'use client';

import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-white dark:bg-slate-950">
      
      {/* 1. Top Loading Banner (Global Progress) */}
      <div className="fixed top-0 left-0 right-0 h-1 z-[120] overflow-hidden bg-slate-100 dark:bg-slate-900">
        <div className="h-full bg-indigo-600 animate-loading-bar shadow-[0_0_15px_rgba(79,70,229,0.5)]" />
      </div>

      {/* 2. Neural Ambient Glow (Matches ToastProvider) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 dark:bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />

      {/* 3. Central Content */}
      <div className="relative flex flex-col items-center">
        
        {/* Logo Container with Orbit Effect */}
        <div className="relative group mb-10">
          {/* Rotating Border Orbit */}
          <div className="absolute -inset-4 border-2 border-dashed border-indigo-500/30 rounded-[3rem] animate-spin-slow" />
          <div className="absolute -inset-2 border border-indigo-500/10 rounded-[2.5rem]" />
          
          <div className="relative w-28 h-28 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden">
            <Image 
              src="/logo/logo.png" 
              alt="SmartJuan Logo" 
              width={70} 
              height={70}
              className="object-contain animate-bounce-subtle z-10"
              priority
            />
            
            {/* Tech Scanning Line Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent h-1/2 w-full animate-scan-line z-20" />
          </div>
        </div>

        {/* Branding & Status */}
        <div className="flex flex-col items-center text-center">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.5em] mb-2 ml-[0.5em]">
            SmartJuan<span className="text-indigo-500">AI</span>
          </h2>
          <div className="h-[2px] w-12 bg-indigo-500 rounded-full mb-6" />
          
          {/* Glass Status Pill */}
          <div className="flex items-center gap-3 px-6 py-2.5 bg-slate-100/50 dark:bg-white/5 backdrop-blur-md border border-slate-200/50 dark:border-white/10 rounded-2xl shadow-xl">
            <Loader2 size={16} className="animate-spin text-indigo-500 dark:text-indigo-400" />
            <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-[0.2em]">
              Initializing Neural Links
            </span>
          </div>

          <p className="mt-4 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] animate-pulse">
            Secure Financial Intelligence
          </p>
        </div>
      </div>

      {/* 4. Background Decor */}
      <div className="absolute bottom-10 left-0 right-0 text-center">
        <p className="text-[8px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.5em] ml-[0.5em]">
          v2.0 Protocol Active
        </p>
      </div>
    </div>
  );
}