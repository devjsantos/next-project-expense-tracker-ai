'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastItem = { id: string; message: string; type?: 'info'|'success'|'warning'|'error' };

const ToastContext = createContext<{ addToast: (t: Omit<ToastItem,'id'>)=>void } | undefined>(undefined);

export function useToast(){
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export default function ToastProvider({ children }:{ children: React.ReactNode }){
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((t: Omit<ToastItem,'id'>) => {
    const id = String(Date.now()) + Math.random().toString(16).slice(2);
    setToasts((s)=>[...s, { id, ...t }]);
    // remove after 2s
    setTimeout(()=> setToasts((s)=>s.filter(x=>x.id!==id)), 2000);
  },[]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className='fixed top-4 right-4 z-50 flex flex-col gap-2'>
        {toasts.map(t=> (
          <div key={t.id} className={`max-w-sm px-4 py-2 rounded shadow-lg text-white ${t.type==='success'? 'bg-green-600' : t.type==='warning'? 'bg-yellow-500' : t.type==='error'? 'bg-red-600' : 'bg-blue-600'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
