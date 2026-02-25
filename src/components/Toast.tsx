'use client';
import { useEffect, useState } from 'react';
import { Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose }: { message: string; type?: 'info'|'success'|'warning'|'error'; onClose?: ()=>void }){
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { 
      setShow(false); 
      if (onClose) onClose(); 
    }, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-right-5 fade-in duration-300">
      <div className="flex items-center gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-4 pr-6 rounded-2xl shadow-2xl">
        {type === 'success' ? <CheckCircle2 className="text-emerald-500" size={18} /> : 
         type === 'error' ? <XCircle className="text-red-500" size={18} /> : 
         type === 'warning' ? <AlertTriangle className="text-amber-500" size={18} /> : 
         <Info className="text-indigo-500" size={18} />}
        
        <p className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
          {message}
        </p>
      </div>
    </div>
  );
}