'use client';

import React, { useRef, useState, ChangeEvent, useEffect } from 'react';
import { createPortal } from 'react-dom';
import addExpenseRecord from '@/app/actions/addExpenseRecord';
import { scanReceipt } from '@/app/actions/scanReceipt';
import { suggestCategory } from '@/app/actions/suggestCategory';
import { useToast } from '@/components/ToastProvider';
import { 
  Plus, 
  Camera, 
  Edit3, 
  ChevronLeft, 
  Sparkles, 
  Calendar, 
  Tag, 
  ChevronDown, 
  X, 
  Loader2, 
  ScanLine,
  Wallet
} from 'lucide-react';

// --- Improved Types ---
interface BudgetAlert {
  type: 'warning' | 'info' | 'success';
  message: string;
}

interface ScanData {
  description?: string;
  amount?: string | number;
  category?: string;
}

interface ScanResponse {
  success: boolean;
  data: ScanData | null;
  error: string | null;
}

const resizeImage = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = (height * MAX_WIDTH) / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
      };
    };
    reader.onerror = reject;
  });
};

const getTodayDate = () => new Date().toISOString().split('T')[0];

const AddRecord = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const [view, setView] = useState<'select' | 'form'>('select');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getTodayDate());

  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isCategorizingAI, setIsCategorizingAI] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [scannedPreview, setScannedPreview] = useState<ScanData | null>(null);
  const [ocrProgress, setOcrProgress] = useState<number | null>(null);
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        try { workerRef.current.terminate(); } catch (e) { /* ignore */ }
        workerRef.current = null;
      }
    };
  }, []);

  const handleReceiptCapture = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);

    try {
      const { base64, mimeType } = await resizeImage(file);
      cancelledRef.current = false;

      if (typeof window !== 'undefined' && window.Worker) {
        if (workerRef.current) {
          try { workerRef.current.terminate(); } catch (e) { /* ignore */ }
          workerRef.current = null;
        }

        const worker = new Worker('/workers/tesseract-worker.js');
        workerRef.current = worker;
        setOcrProgress(0);
        setOcrStatus('Initializing OCR');

        worker.onmessage = (ev: MessageEvent) => {
          const msg = ev.data || {};
          if (msg.type === 'progress' && msg.progress) {
            const prog = msg.progress.progress;
            const p = typeof prog === 'number' ? Math.round(Math.max(0, Math.min(1, prog)) * 100) : null;
            if (p !== null) setOcrProgress(p);
            if (msg.progress.status) setOcrStatus(String(msg.progress.status));
          }
        };

        const messagePromise = new Promise<{ text?: string; error?: string; }>((resolve) => {
          const handler = (ev: MessageEvent) => {
            const msg = ev.data || {};
            if (msg.type === 'result' && msg.text) {
              worker.removeEventListener('message', handler as any);
              resolve({ text: msg.text });
            }
            if (msg.type === 'error') {
              worker.removeEventListener('message', handler as any);
              resolve({ error: String(msg.error || 'OCR error') });
            }
          };
          worker.addEventListener('message', handler as any);
        });

        const cancelPromise = new Promise<{ canceled: true }>((resolve) => {
          const interval = setInterval(() => {
            if (cancelledRef.current) {
              clearInterval(interval);
              resolve({ canceled: true });
            }
          }, 150);
        });

        const dataUrl = `data:${mimeType};base64,${base64}`;
        worker.postMessage({ id: Math.random().toString(36).slice(2), dataUrl });

        const raced = await Promise.race([messagePromise, cancelPromise]);

        if ((raced as any).canceled) {
          try { worker.terminate(); } catch (e) { /* ignore */ }
          workerRef.current = null;
          setIsScanning(false);
          setOcrProgress(null);
          setOcrStatus(null);
          return;
        }

        const res = raced as { text?: string; error?: string };
        if (res.text) {
          const text: string = res.text;
          const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
          const descriptionGuess = lines[0] || '';
          let amountGuess: number | undefined;
          for (let i = lines.length - 1; i >= 0; i--) {
            const m = lines[i].match(/(\d{1,3}(?:[,\d]*)(?:[.,]\d{1,2})?)/);
            if (m) {
              const cleaned = m[1].replace(/,/g, '');
              const n = Number(cleaned.replace(',', ''));
              if (!Number.isNaN(n)) { amountGuess = n; break; }
            }
          }

          setScannedPreview({ description: descriptionGuess, amount: amountGuess, category: undefined });
          setShowReviewModal(true);
          setOcrProgress(null);
          setOcrStatus(null);
          try { worker.terminate(); } catch (e) { /* ignore */ }
          workerRef.current = null;
          setIsScanning(false);
          return;
        }
        try { worker.terminate(); } catch (e) { /* ignore */ }
        workerRef.current = null;
      }

      const result = (await scanReceipt(base64, mimeType)) as unknown as ScanResponse;

      if (cancelledRef.current) {
        setIsScanning(false);
        return;
      }

      if (result.success && result.data) {
        setScannedPreview(result.data);
        setShowReviewModal(true);
        setIsScanning(false);
        return;
      }

      throw new Error(result.error || 'Scan failed');
    } catch (err: any) {
      addToast(err.message || 'AI Busy. Manual entry required.', 'warning');
      setView('form');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmScannedData = (data: ScanData) => {
    setDescription(data.description || '');
    setAmount(String(data.amount || ''));
    setCategory(data.category || '');
    addToast('Receipt data applied.', 'info');
    setShowReviewModal(false);
    setScannedPreview(null);
    setView('form');
  };

  const cancelScannedData = () => {
    setShowReviewModal(false);
    setScannedPreview(null);
    setView('form');
  };

  const handleAISuggestCategory = async () => {
    if (!description.trim()) return;
    setIsCategorizingAI(true);
    try {
      const result = await suggestCategory(description);
      if (result.category) {
        const valid = ['Food', 'Transportation', 'Shopping', 'Entertainment', 'Bills', 'Healthcare', 'Other'];
        const matched = valid.find(v => result.category?.toLowerCase().includes(v.toLowerCase()));
        setCategory(matched || 'Other');
        addToast(`Categorized as ${matched || 'Other'}`, 'info');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCategorizingAI(false);
    }
  };

  const clientAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.set('amount', amount);
    formData.set('category', category);
    formData.set('date', date);
    formData.set('text', description);

    try {
      const result = await addExpenseRecord(formData);
      if (result.error) {
        addToast(`Error: ${result.error}`, 'error');
      } else {
        addToast('Transaction recorded', 'success');
        const maybeAlerts = (result.alerts || []) as BudgetAlert[];
        maybeAlerts.forEach(a => addToast(a.message, a.type as 'info' | 'warning' | 'success'));

        setAmount(''); setCategory(''); setDescription(''); setDate(getTodayDate());
        setTimeout(() => setView('select'), 500);

        window.dispatchEvent(new CustomEvent('records:changed'));
        window.dispatchEvent(new CustomEvent('budget:changed'));
        if (maybeAlerts.length > 0) window.dispatchEvent(new CustomEvent('notifications:changed'));
      }
    } catch (err) {
      addToast('Sync failed. Try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const LoadingOverlay = () => {
    if (!isScanning || !mounted) return null;
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6 border border-slate-100 dark:border-slate-800 max-w-sm w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800">
            <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${ocrProgress || 0}%` }} />
          </div>
          <div className="relative">
             <div className="w-20 h-20 border-[6px] border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
             <ScanLine className="absolute inset-0 m-auto text-indigo-500 animate-pulse" size={32} />
          </div>
          <div className="text-center">
            <p className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">Vision Analysis</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2 animate-pulse">{ocrStatus || 'Parsing Elements...'}</p>
          </div>
          <button
            onClick={() => { cancelledRef.current = true; setIsScanning(false); }}
            className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
          >
            Abort Scan
          </button>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className='relative bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800/50 overflow-hidden'>
      <LoadingOverlay />

      {view === 'select' ? (
        <div className="space-y-6 py-4 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">New Entry</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Select Input Method</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <button
              onClick={() => setView('form')}
              className="group flex flex-col items-center justify-center gap-4 p-10 bg-slate-50 dark:bg-slate-800/40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2.5rem] hover:border-indigo-500 hover:bg-white dark:hover:bg-slate-800 transition-all active:scale-95"
            >
              <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-indigo-500 group-hover:text-white transition-all">
                <Edit3 size={28} />
              </div>
              <div className="text-center">
                <span className="block font-black text-[10px] uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors">Manual</span>
                <span className="font-black text-sm text-slate-900 dark:text-white">Type Details</span>
              </div>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="group flex flex-col items-center justify-center gap-4 p-10 bg-indigo-600 rounded-[2.5rem] hover:bg-indigo-700 shadow-2xl shadow-indigo-500/40 transition-all active:scale-95 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles size={80} />
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md transition-all group-hover:scale-110">
                <Camera size={28} className="text-white" />
              </div>
              <div className="text-center relative z-10">
                <span className="block font-black text-[10px] uppercase tracking-widest text-indigo-200">AI Engine</span>
                <span className="font-black text-sm text-white">Scan Receipt</span>
              </div>
            </button>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleReceiptCapture} />
        </div>
      ) : (
        <div className="animate-in slide-in-from-right-8 fade-in duration-500">
          <div className="flex items-center justify-between mb-10">
            <button onClick={() => setView('select')} className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:bg-indigo-600 hover:text-white transition-all">
              <ChevronLeft size={20} strokeWidth={3} />
            </button>
            <h3 className='text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]'>Transaction Details</h3>
            <div className="w-10" />
          </div>

          <form onSubmit={clientAction} className='space-y-6'>
            {/* LABEL INPUT */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                <Tag size={18} />
              </div>
              <input
                type='text'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='Merchant / Service...'
                className='w-full pl-12 pr-28 py-5 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-slate-900 dark:text-white'
                required
              />
              <button
                type="button"
                onClick={handleAISuggestCategory}
                disabled={!description.trim() || isCategorizingAI}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg disabled:opacity-0 transition-all active:scale-95 flex items-center gap-2"
              >
                {isCategorizingAI ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                AI
              </button>
            </div>

            {/* CATEGORY & DATE */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors z-10">
                  <Wallet size={18} />
                </div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className='w-full pl-12 pr-10 py-5 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-[12px] font-black uppercase tracking-wider outline-none focus:border-indigo-500 appearance-none text-slate-900 dark:text-white cursor-pointer relative'
                  required
                >
                  <option value='' disabled>Category</option>
                  <option value='Food'>Food & Dining</option>
                  <option value='Transportation'>Transportation</option>
                  <option value='Shopping'>Shopping</option>
                  <option value='Entertainment'>Entertainment</option>
                  <option value='Bills'>Bills & Utilities</option>
                  <option value='Healthcare'>Healthcare</option>
                  <option value='Other'>Other</option>
                </select>
                <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                  <Calendar size={18} />
                </div>
                <input 
                  type='date' 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  className='w-full pl-14 pr-5 py-5 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-[13px] font-black outline-none focus:border-indigo-500 text-slate-900 dark:text-white' 
                />
              </div>
            </div>

            {/* AMOUNT INPUT */}
            <div className='relative group'>
              <span className='absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300 group-focus-within:text-indigo-500 transition-colors text-3xl'>₱</span>
              <input
                type='number'
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className='w-full pl-14 pr-6 py-7 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-[2rem] text-4xl font-black focus:border-indigo-600 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-200'
                required
              />
            </div>

            <button type='submit' disabled={isLoading} className='group w-full py-6 bg-slate-900 dark:bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3'>
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} strokeWidth={3} />}
              {isLoading ? 'Processing' : 'Log Transaction'}
            </button>
          </form>
        </div>
      )}

      {/* REVIEW MODAL */}
      {showReviewModal && scannedPreview && (
        <ReviewModal 
          data={scannedPreview} 
          onCancel={cancelScannedData} 
          onConfirm={confirmScannedData}
          onUpdate={setScannedPreview}
        />
      )}
    </div>
  );
};

const ReviewModal = ({ data, onCancel, onConfirm, onUpdate }: any) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-in fade-in" onClick={onCancel} />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl p-10 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white">
            <ScanLine size={24} />
          </div>
          <div>
            <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Review Scan</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Verify AI Logic</p>
          </div>
        </div>

        <div className="space-y-5 mb-10">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Merchant</label>
            <input 
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white focus:border-indigo-500 outline-none" 
              value={data.description || ''} 
              onChange={(e) => onUpdate((prev: any) => ({ ...prev, description: e.target.value }))} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300">₱</span>
                <input 
                  type="number" 
                  className="w-full pl-9 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-black text-slate-900 dark:text-white focus:border-indigo-500 outline-none" 
                  value={data.amount ?? ''} 
                  onChange={(e) => onUpdate((prev: any) => ({ ...prev, amount: e.target.value }))} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
              <input 
                className="w-full px-5 py-4 bg-indigo-50 dark:bg-indigo-900/20 border-2 border-transparent rounded-2xl font-black text-xs text-indigo-500 uppercase tracking-widest" 
                value={data.category || 'PENDING...'} 
                readOnly
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={onCancel} className="py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase text-[10px] tracking-widest">Discard</button>
          <button onClick={() => onConfirm(data)} className="py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest">Apply</button>
        </div>
      </div>
    </div>
  );
};

export default AddRecord;