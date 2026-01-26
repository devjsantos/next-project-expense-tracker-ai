'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'info' | 'success' | 'warning' | 'error';
type ToastItem = { id: string; message: string; type: ToastType };

const ToastContext = createContext<{ 
  addToast: (message: any, type?: ToastType) => void 
} | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: any, type: ToastType = 'info') => {
    const id = String(Date.now()) + Math.random().toString(16).slice(2);
    
    // SAFETY CHECK: If message is an object (like {message, type}), extract the string
    let finalMessage = "";
    if (typeof message === 'object' && message !== null) {
      finalMessage = message.message || JSON.stringify(message);
    } else {
      finalMessage = String(message);
    }

    setToasts((s) => [...s, { id, message: finalMessage, type }]);
    
    setTimeout(() => {
      setToasts((s) => s.filter((x) => x.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      
      <div className='fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 w-full max-w-md px-4 pointer-events-none'>
        {toasts.map((t) => (
          <div 
            key={t.id} 
            className={`
              pointer-events-auto flex items-center justify-center text-center px-6 py-4 
              rounded-2xl shadow-2xl text-white font-black uppercase text-xs tracking-widest 
              animate-in slide-in-from-bottom-5 fade-in duration-300
              ${t.type === 'success' ? 'bg-green-600' : 
                t.type === 'warning' ? 'bg-amber-500' : 
                t.type === 'error' ? 'bg-red-600' : 'bg-indigo-600'}
            `}
          >
            {t.type === 'success' && <span className="mr-2">✅</span>}
            {t.type === 'warning' && <span className="mr-2">⚠️</span>}
            {t.type === 'error' && <span className="mr-2">❌</span>}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}