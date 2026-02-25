'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Loader2, CheckCircle2, XCircle, Info, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

type ToastType = 'info' | 'success' | 'warning' | 'error' | 'loading';
type ToastItem = { id: string; message: string; type: ToastType };

const ToastContext = createContext<{ 
  addToast: (message: any, type?: ToastType) => void;
  clearToasts: () => void;
} | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const clearToasts = useCallback(() => setToasts([]), []);

  const addToast = useCallback((message: any, type: ToastType = 'info') => {
    const id = String(Date.now()) + Math.random().toString(16).slice(2);
    
    let finalMessage = typeof message === 'object' && message !== null 
      ? message.message || JSON.stringify(message) 
      : String(message);

    setToasts((prevToasts) => {
      if (type !== 'loading') {
        const filtered = prevToasts.filter(t => t.type !== 'loading');
        return [...filtered, { id, message: finalMessage, type }];
      }
      return [{ id, message: finalMessage, type }];
    });

    if (type !== 'loading') {
      setTimeout(() => {
        setToasts((s) => s.filter((x) => x.id !== id));
      }, 4000);
    }
  }, []);

  const loadingToast = toasts.find(t => t.type === 'loading');

  return (
    <ToastContext.Provider value={{ addToast, clearToasts }}>
      {children}
      
      {/* 1. FRIENDLY LOADING OVERLAY */}
      {loadingToast && (
        <div 
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-2xl animate-in fade-in duration-500 pointer-events-auto"
          onDoubleClick={clearToasts}
        >
          
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />

          <div className="relative flex flex-col items-center">
            
            {/* Logo Container */}
            <div className="relative group">
              <div className="absolute -inset-4 border-2 border-dashed border-indigo-500/30 rounded-[3rem] animate-spin-slow" />
              <div className="absolute -inset-2 border border-indigo-500/10 rounded-[2.5rem]" />
              
              <div className="relative w-28 h-28 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_0_50px_-12px_rgba(79,70,229,0.5)] border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden">
                <Image 
                  src="/logo/logo.png" 
                  alt="SmartJuan Logo" 
                  width={70} 
                  height={70} 
                  className="z-10 animate-bounce-subtle"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/10 to-transparent h-1/2 w-full animate-scan-line z-20" />
              </div>
            </div>

            {/* Friendly Branding */}
            <div className="mt-10 text-center">
              <h2 className="text-sm font-black text-white uppercase tracking-[0.5em] mb-2 drop-shadow-md">
                SmartJuan<span className="text-indigo-500">AI</span>
              </h2>
              <div className="h-[2px] w-12 bg-indigo-500 mx-auto rounded-full mb-6" />
            </div>

            {/* Status Pill */}
            <div className="flex items-center gap-3 px-8 py-3 bg-white/10 backdrop-blur-md border border-white/10 text-white rounded-2xl shadow-2xl">
              <Loader2 size={18} className="animate-spin text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                {loadingToast.message}
              </span>
            </div>

            {/* Sub-label: Friendlier Wording */}
            <p className="mt-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
              Securing your connection...
            </p>
          </div>
        </div>
      )}

      {/* 2. MINI TOASTS */}
      <div className='fixed bottom-10 left-1/2 -translate-x-1/2 z-[9998] flex flex-col gap-3 w-full max-w-sm px-6 pointer-events-none'>
        {toasts.filter(t => t.type !== 'loading').map((t) => (
          <div 
            key={t.id} 
            className={`
              pointer-events-auto flex items-center gap-4 px-6 py-4 
              rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl border
              animate-in slide-in-from-bottom-10 fade-in duration-500
              ${t.type === 'success' ? 'bg-emerald-600/90 border-emerald-400/50 text-white' : 
                t.type === 'error' ? 'bg-red-600/90 border-red-400/50 text-white' : 
                'bg-slate-900/90 border-slate-700/50 text-white'}
            `}
          >
            <div className="bg-white/20 p-2 rounded-xl">
              {t.type === 'success' ? <ShieldCheck size={20} /> : 
               t.type === 'error' ? <XCircle size={20} /> : <Info size={20} />}
            </div>
            
            <div className="flex flex-col gap-0.5">
              <p className="text-[11px] font-black uppercase tracking-wider">
                {t.type === 'success' ? 'All set!' : t.type === 'error' ? 'Oops!' : 'Note'}
              </p>
              <p className="text-[10px] font-medium opacity-90 tracking-wide flex-1">
                {t.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}