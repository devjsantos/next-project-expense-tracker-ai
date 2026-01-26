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

interface ScanResponse {
  success: boolean;
  data: {
    description?: string;
    amount?: string | number;
    category?: string;
  } | null;
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleReceiptCapture = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);

    try {
      const { base64, mimeType } = await resizeImage(file);
      const result = (await scanReceipt(base64, mimeType)) as unknown as ScanResponse;

      if (result.success && result.data) {
        setView('form');
        setDescription(result.data.description || '');
        setAmount(String(result.data.amount || ''));
        setCategory(result.data.category || '');
        addToast('AI successfully read your receipt!', 'success');
      } else {
        throw new Error(result.error || 'Scan failed');
      }
    } catch (err: any) {
      addToast(err.message || 'AI Busy. Please fill details manually.', 'warning');
      setView('form');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
        // 1. Show Main Success Toast
        addToast('Expense added successfully!', 'success');

        // 2. Handle AI/Budget Alerts via Toasts
        const maybeAlerts = (result.alerts || []) as BudgetAlert[];
        maybeAlerts.forEach(a => {
          // Explicitly mapping 'info' | 'warning' | 'success' to our toast types
          addToast(a.message, a.type as 'info' | 'warning' | 'success');
        });

        // 3. Reset UI
        setAmount(''); setCategory(''); setDescription(''); setDate(getTodayDate());
        setTimeout(() => setView('select'), 500);

        // 4. Refresh Data
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
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4 border border-gray-100 dark:border-gray-700">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-black text-gray-900 dark:text-white uppercase tracking-tighter">AI Vision Scanning...</p>
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
    </div>
  );
};

export default AddRecord;