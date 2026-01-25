'use client';
import { useRef, useState, ChangeEvent } from 'react';
import addExpenseRecord from '@/app/actions/addExpenseRecord';
import { suggestCategory } from '@/app/actions/suggestCategory';
import { scanReceipt } from '@/app/actions/scanReceipt';
import { useToast } from '@/components/ToastProvider';

const getTodayDate = () => {
  const local = new Date();
  const year = local.getFullYear();
  const month = String(local.getMonth() + 1).padStart(2, '0');
  const day = String(local.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const AddRecord = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [amount, setAmount] = useState<string>('');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'success' | 'error' | null>(null);
  const [alertsList, setAlertsList] = useState<{ type: 'warning' | 'info' | 'success'; message: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getTodayDate());
  const [isScanning, setIsScanning] = useState(false);
  const { addToast } = useToast();

  const handleReceiptCapture = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setAlertMessage('AI reading receipt...');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const result = await scanReceipt(formData);

      if (result.success && result.data) {
        setDescription(result.data.description);
        setAmount(String(result.data.amount));
        setCategory(result.data.category);
        setAlertMessage('Receipt scanned! Check the details below.');
        setAlertType('success');
      } else {
        setAlertMessage(result.error || 'Could not read receipt');
        setAlertType('error');
      }
    } catch (err) {
      setAlertMessage('System error scanning receipt');
      setAlertType('error');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  const clientAction = async (formData: FormData) => {
    setIsLoading(true);
    setAlertMessage(null);

    const numericAmount = amount === '' ? 0 : parseFloat(amount);
    if (!Number.isFinite(numericAmount) || numericAmount < 0) {
      setAlertMessage('Amount must be a non-negative number');
      setAlertType('error');
      setIsLoading(false);
      return;
    }

    formData.set('amount', String(numericAmount));
    formData.set('category', category);
    formData.set('date', date);

    const result = await addExpenseRecord(formData);

    if (result.error) {
      setAlertMessage(`Error: ${result.error}`);
      setAlertType('error');
    } else {
      setAlertMessage('Expense record added successfully!');
      setAlertType('success');
      formRef.current?.reset();
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(getTodayDate());

      try { window.dispatchEvent(new CustomEvent('records:changed')); } catch { }
    }
    setIsLoading(false);
  };

  return (
    <div className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-100/50 dark:border-gray-700/50'>
      <div className='flex justify-between items-start mb-6'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 bg-gradient-to-br from-indigo-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg'>
            <span className='text-white text-lg'>💳</span>
          </div>
          <div>
            <h3 className='text-xl font-bold text-gray-900 dark:text-gray-100'>Add Expense</h3>
            <p className='text-xs text-gray-500'>Snap a photo or type it in</p>
          </div>
        </div>

        {/* Camera Trigger */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          className="flex flex-col items-center gap-1 group"
        >
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-inner">
            {isScanning ? (
              <div className='w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin'></div>
            ) : (
              <span className="text-xl">📸</span>
            )}
          </div>
          <span className="text-[10px] font-bold text-gray-500 group-hover:text-indigo-500">SCAN</span>
        </button>

        {/* Hidden File Input for Camera */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          capture="environment"
          onChange={handleReceiptCapture}
        />
      </div>

      <form
        ref={formRef}
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(formRef.current!);
          clientAction(formData);
        }}
        className='space-y-6'
      >
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl border border-gray-100 dark:border-gray-800'>
          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-gray-700 dark:text-gray-300'>Description</label>
            <input
              type='text'
              name='text'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='What did you buy?'
              className='w-full px-3 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm'
              required
            />
          </div>

          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-gray-700 dark:text-gray-300'>Date</label>
            <input
              type='date'
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onClick={(e) => { try { (e.target as HTMLInputElement).showPicker(); } catch { } }}
              className='w-full px-3 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm'
            />
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl border border-gray-100 dark:border-gray-800'>
          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-gray-700 dark:text-gray-300'>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className='w-full px-3 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm'
              required
            >
              <option value='' disabled>Select...</option>
              <option value='Food'>🍔 Food</option>
              <option value='Transportation'>🚗 Transpo</option>
              <option value='Bills'>💡 Bills</option>
              <option value='Shopping'>🛒 Shopping</option>
              <option value='Other'>📦 Other</option>
            </select>
          </div>

          <div className='space-y-1.5'>
            <label className='text-xs font-semibold text-gray-700 dark:text-gray-300'>Amount</label>
            <div className='relative'>
              <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'>₱</span>
              <input
                type='number'
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className='w-full pl-7 pr-3 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold'
                required
              />
            </div>
          </div>
        </div>

        <button
          type='submit'
          disabled={isLoading || isScanning}
          className='w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-xl font-bold shadow-lg disabled:opacity-50'
        >
          {isLoading ? 'Saving...' : 'Add Expense'}
        </button>
      </form>

      {alertMessage && (
        <div className={`mt-4 p-3 rounded-xl text-sm font-medium border-l-4 ${alertType === 'success' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-red-50 border-red-500 text-red-700'
          }`}>
          {alertMessage}
        </div>
      )}
    </div>
  );
};

export default AddRecord;