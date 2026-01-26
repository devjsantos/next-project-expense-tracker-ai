'use client';
import { useRef, useState, ChangeEvent, useEffect } from 'react';
import { createPortal } from 'react-dom';
import addExpenseRecord from '@/app/actions/addExpenseRecord';
import { scanReceipt } from '@/app/actions/scanReceipt';
import getBudgets from '@/app/actions/getBudgets';
import { getRecords } from '@/app/actions/getRecords';
import { calculateBudgetAlerts, Budget, Expense } from '@/lib/budget';

/* --- Helper: Resize Image for faster AI processing --- */
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

const getTodayDate = () => {
  const local = new Date();
  return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`;
};

const AddRecord = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Separate audio refs for success and failure
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);

  const [amount, setAmount] = useState<string>('');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'success' | 'error' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getTodayDate());
  const [isScanning, setIsScanning] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [history, setHistory] = useState<Expense[]>([]);

  useEffect(() => {
    setMounted(true);
    // Initialize sounds
    successAudioRef.current = new Audio('/sounds/success.mp3');
    errorAudioRef.current = new Audio('/sounds/error.mp3');

    const loadBudgetData = async () => {
      try {
        const bRes = await getBudgets();
        const hRes = await getRecords();
        if (bRes && 'budgets' in bRes) setBudgets(bRes.budgets as Budget[]);
        if (hRes && 'records' in hRes) setHistory(hRes.records as unknown as Expense[]);
      } catch (err) {
        console.error("Data load error", err);
      }
    };
    loadBudgetData();
  }, []);

  const handleReceiptCapture = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setAlertMessage(null);

    try {
      // 1. Resize on client (avoids timeouts on large photos)
      const { base64, mimeType } = await resizeImage(file);

      // 2. Scan with optimized base64
      const result = await scanReceipt(base64, mimeType);

      if (result.success && result.data) {
        successAudioRef.current?.play().catch(() => { });

        setDescription(result.data.description || '');
        setAmount(String(result.data.amount || ''));
        setCategory(result.data.category || '');

        const currentMonth = new Date().toISOString().substring(0, 7);
        const activeBudget = budgets.find(b => b.monthStart.startsWith(currentMonth)) || null;

        const newExpense: Expense = {
          amount: result.data.amount,
          category: result.data.category,
          date: new Date().toISOString()
        };

        const budgetAlerts = calculateBudgetAlerts(history, activeBudget, newExpense);

        if (budgetAlerts.length > 0) {
          errorAudioRef.current?.play().catch(() => { });
          setAlertMessage(`⚠️ ${budgetAlerts.map(a => a.message).join(' | ')}`);
          setAlertType('error');
        } else {
          setAlertMessage('Receipt scanned successfully!');
          setAlertType('success');
        }
      } else {
        errorAudioRef.current?.play().catch(() => { });
        setAlertMessage(result.error || 'Could not read receipt');
        setAlertType('error');
      }
    } catch (err) {
      errorAudioRef.current?.play().catch(() => { });
      setAlertMessage('Scanning failed. AI service might be busy.');
      setAlertType('error');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clientAction = async (formData: FormData) => {
    setIsLoading(true);
    setAlertMessage(null);
    const numAmt = parseFloat(amount);

    if (isNaN(numAmt) || numAmt < 0) {
      setAlertMessage('Invalid amount');
      setAlertType('error');
      setIsLoading(false);
      return;
    }

    formData.set('amount', String(numAmt));
    formData.set('category', category);
    formData.set('date', date);
    formData.set('description', description);

    const result = await addExpenseRecord(formData);
    if (result.error) {
      errorAudioRef.current?.play().catch(() => { });
      setAlertMessage(`Error: ${result.error}`);
      setAlertType('error');
    } else {
      successAudioRef.current?.play().catch(() => { });
      setAlertMessage('Expense saved successfully!');
      setAlertType('success');
      formRef.current?.reset();
      setAmount(''); setCategory(''); setDescription(''); setDate(getTodayDate());
      window.dispatchEvent(new CustomEvent('records:changed'));
    }
    setIsLoading(false);
  };

  // Inside AddRecord Component...

  const LoadingOverlay = () => {
    if (!isScanning || !mounted) return null;
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gray-900/70 backdrop-blur-md">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 max-w-xs w-full">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl">📄</span>
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">SmartJuan AI Reading</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Extracting totals and checking your budget status...
            </p>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className='relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-100/50 dark:border-gray-700/50'>
      <LoadingOverlay />
      <div className='flex justify-between items-start mb-6'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white'>💳</div>
          <h3 className='text-xl font-bold'>Add Expense</h3>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning || isLoading}
          className="flex flex-col items-center gap-1 group disabled:opacity-50"
        >
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">📸</div>
          <span className="text-[10px] font-bold text-gray-400">SCAN</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleReceiptCapture}
        />
      </div>

      <form ref={formRef} onSubmit={(e) => { e.preventDefault(); void clientAction(new FormData(formRef.current!)); }} className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <input
            type='text'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder='Merchant'
            className='w-full px-3 py-2.5 bg-white dark:bg-gray-800 border-2 rounded-xl text-sm'
            required
          />
          <input
            type='date'
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className='w-full px-3 py-2.5 bg-white dark:bg-gray-800 border-2 rounded-xl text-sm'
          />
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className='w-full px-3 py-2.5 bg-white dark:bg-gray-800 border-2 rounded-xl text-sm'
            required
          >
            <option value='' disabled>Category</option>
            <option value='Food'>Food</option>
            <option value='Transportation'>Transpo</option>
            <option value='Bills'>Bills</option>
            <option value='Shopping'>Shopping</option>
            <option value='Other'>Other</option>
          </select>
          <div className='relative'>
            <span className='absolute left-3 top-1/2 -translate-y-1/2'>₱</span>
            <input
              type='number'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className='w-full pl-7 pr-3 py-2.5 bg-white dark:bg-gray-800 border-2 rounded-xl text-sm font-bold'
              required
            />
          </div>
        </div>
        <button
          type='submit'
          disabled={isLoading || isScanning}
          className='w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 transition-all'
        >
          {isLoading ? 'Saving...' : 'Add Expense'}
        </button>
      </form>

      {alertMessage && (
        <div className={`mt-4 p-3 rounded-xl text-sm font-medium border-l-4 ${alertType === 'success' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'
          }`}>
          {alertMessage}
        </div>
      )}
    </div>
  );
};

export default AddRecord;