'use client';

import { useRef, useState, ChangeEvent, useEffect } from 'react';
import { createPortal } from 'react-dom';
import addExpenseRecord from '@/app/actions/addExpenseRecord';
import { scanReceipt } from '@/app/actions/scanReceipt';
import { suggestCategory } from '@/app/actions/suggestCategory';
import { useToast } from '@/components/ToastProvider';

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

      // reset cancellation flag
      cancelledRef.current = false;

      // Try client-side OCR first (web worker). If it fails, fallback to server AI scan.
      if (typeof window !== 'undefined' && window.Worker) {
        if (workerRef.current) {
          try { workerRef.current.terminate(); } catch (e) { /* ignore */ }
          workerRef.current = null;
        }

        const worker = new Worker('/workers/tesseract-worker.js');
        workerRef.current = worker;
        setOcrProgress(0);
        setOcrStatus('Starting OCR');

        // update progress messages live
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
          // Cancelled by user
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

        // Worker failed or returned error; terminate and fallback to server
        try { worker.terminate(); } catch (e) { /* ignore */ }
        workerRef.current = null;
      }

      // If we reach here, client OCR did not produce results — call server scan as fallback
      const result = (await scanReceipt(base64, mimeType)) as unknown as ScanResponse;

      if (cancelledRef.current) {
        // user cancelled while server request was in-flight
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
      addToast(err.message || 'AI Busy. Please fill details manually.', 'warning');
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
    addToast('Parsed receipt applied — please verify and save.', 'info');
    setShowReviewModal(false);
    setScannedPreview(null);
    setView('form');
  };

  const cancelScannedData = () => {
    setShowReviewModal(false);
    setScannedPreview(null);
    setView('form');
    addToast('You can fill details manually.', 'info');
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
        addToast('Expense added successfully!', 'success');
        const maybeAlerts = (result.alerts || []) as BudgetAlert[];
        maybeAlerts.forEach(a => {
          addToast(a.message, a.type as 'info' | 'warning' | 'success');
        });

        setAmount(''); setCategory(''); setDescription(''); setDate(getTodayDate());
        setTimeout(() => setView('select'), 500);

        window.dispatchEvent(new CustomEvent('records:changed'));
        window.dispatchEvent(new CustomEvent('budget:changed'));
        if (maybeAlerts.length > 0) window.dispatchEvent(new CustomEvent('notifications:changed'));
      }
    } catch (err) {
      addToast('Server error. Try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const LoadingOverlay = () => {
    if (!isScanning || !mounted) return null;
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-[1.5rem] shadow-2xl flex flex-col items-center gap-4 border border-gray-100 dark:border-gray-700 max-w-sm w-full">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-black text-gray-900 dark:text-white uppercase tracking-tighter">AI Vision Scanning...</p>
          {ocrStatus && <p className="text-sm text-gray-500 mt-2">{ocrStatus}</p>}
          {ocrProgress !== null && (
            <div className="w-full mt-4">
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="h-2 bg-indigo-600" style={{ width: `${ocrProgress}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">{ocrProgress}%</p>
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => {
                if (workerRef.current) {
                  try { workerRef.current.terminate(); } catch (e) { /* ignore */ }
                  workerRef.current = null;
                }
                setIsScanning(false);
                setOcrProgress(null);
                setOcrStatus(null);
                addToast('OCR cancelled', 'info');
              }}
              className="px-3 py-2 rounded-xl bg-gray-100"
            >
              Cancel OCR
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className='relative bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden'>
      <LoadingOverlay />

      {view === 'select' ? (
        <div className="space-y-4 py-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setView('form')}
              className="flex flex-col items-center justify-center gap-3 p-8 bg-gray-50/50 dark:bg-gray-800/30 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[2rem] hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group"
            >
              <span className="text-4xl">✏️</span>
              <div className="text-center">
                <span className="block font-black text-[10px] uppercase tracking-widest text-gray-400 group-hover:text-indigo-600">Manual Entry</span>
                <span className="font-bold text-sm text-gray-900 dark:text-white">Type Details</span>
              </div>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 p-8 bg-indigo-600 rounded-[2rem] hover:bg-indigo-700 shadow-xl shadow-indigo-500/40 transition-all group active:scale-95"
            >
              <span className="text-4xl">📸</span>
              <div className="text-center">
                <span className="block font-black text-[10px] uppercase tracking-widest text-indigo-200">AI Scanner</span>
                <span className="font-bold text-sm text-white">Scan Receipt</span>
              </div>
            </button>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleReceiptCapture} />
        </div>
      ) : (
        <div className="animate-in slide-in-from-right-4 fade-in duration-300">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setView('select')} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500 hover:text-indigo-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h3 className='text-xs font-black text-gray-400 uppercase tracking-[0.2em]'>Expense Details</h3>
            <div className="w-9" />
          </div>

          <form onSubmit={clientAction} className='space-y-4'>
            <div className="relative group">
              <input
                type='text'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='Merchant name...'
                className='w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl font-bold focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400 text-gray-900 dark:text-white'
                required
              />
              <button
                type="button"
                onClick={handleAISuggestCategory}
                disabled={!description.trim() || isCategorizingAI}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black shadow-lg disabled:opacity-0 transition-all active:scale-90"
              >
                {isCategorizingAI ? '...' : '✨ AI CAT'}
              </button>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className='w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 appearance-none text-gray-900 dark:text-white'
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
              <input 
                type='date' 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                className='w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 text-gray-900 dark:text-white' 
              />
            </div>

            <div className='relative'>
              <span className='absolute left-4 top-1/2 -translate-y-1/2 font-black text-indigo-600 text-2xl'>₱</span>
              <input
                type='number'
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className='w-full pl-12 pr-4 py-5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl text-3xl font-black focus:border-indigo-600 outline-none transition-all text-gray-900 dark:text-white'
                required
              />
            </div>

            <button type='submit' disabled={isLoading} className='w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-500/30 active:scale-[0.98] transition-all disabled:opacity-50'>
              {isLoading ? 'Processing...' : 'Save Expense'}
            </button>
          </form>
        </div>
      )}

      {/* Review Modal for OCR/AI parsed receipt */}
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

// Sub-component to isolate the 'null' check logic and keep code clean
const ReviewModal = ({ 
  data, 
  onCancel, 
  onConfirm,
  onUpdate 
}: { 
  data: ScanData; 
  onCancel: () => void; 
  onConfirm: (d: ScanData) => void;
  onUpdate: React.Dispatch<React.SetStateAction<ScanData | null>>;
}) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 border border-gray-100 dark:border-gray-800">
        <h4 className="text-lg font-black mb-3">Review Parsed Receipt</h4>
        <p className="text-sm text-gray-500 mb-4">The AI/OCR parsed these fields — please verify before saving.</p>

        <div className="space-y-3 mb-4">
          <label className="block text-xs font-bold uppercase text-gray-500">Description</label>
          <input 
            className="w-full px-3 py-2 rounded-xl border" 
            defaultValue={data.description || ''} 
            onChange={(e) => onUpdate(prev => prev ? { ...prev, description: e.target.value } : prev)} 
          />

          <label className="block text-xs font-bold uppercase text-gray-500">Amount</label>
          <input 
            type="number" 
            step="any" 
            className="w-full px-3 py-2 rounded-xl border" 
            defaultValue={data.amount ?? ''} 
            onChange={(e) => onUpdate(prev => prev ? { ...prev, amount: e.target.value ? Number(e.target.value) : undefined } : prev)} 
          />

          <label className="block text-xs font-bold uppercase text-gray-500">Category</label>
          <input 
            className="w-full px-3 py-2 rounded-xl border" 
            defaultValue={data.category || ''} 
            onChange={(e) => onUpdate(prev => prev ? { ...prev, category: e.target.value } : prev)} 
          />
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl bg-gray-100">Cancel</button>
          <button onClick={() => onConfirm(data)} className="px-4 py-2 rounded-xl bg-indigo-600 text-white">Apply</button>
        </div>
      </div>
    </div>
  );
};

export default AddRecord;