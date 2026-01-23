'use client';
import { useRef, useState } from 'react';
import addExpenseRecord from '@/app/actions/addExpenseRecord';
import { suggestCategory } from '@/app/actions/suggestCategory';
import { useToast } from '@/components/ToastProvider';

const AddRecord = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const [amount, setAmount] = useState<string>(''); 
  const [alertMessage, setAlertMessage] = useState<string | null>(null); 
  const [alertType, setAlertType] = useState<'success' | 'error' | null>(null); 
  const [alertsList, setAlertsList] = useState<{ type: 'warning' | 'info' | 'success'; message: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false); 
  const [category, setCategory] = useState(''); 
  const [description, setDescription] = useState(''); 
  const [isCategorizingAI, setIsCategorizingAI] = useState(false); 
  const { addToast } = useToast();

  const clientAction = async (formData: FormData) => {
    setIsLoading(true);
    setAlertMessage(null);

    // Validate amount
    const numericAmount = amount === '' ? 0 : parseFloat(amount);
    if (!Number.isFinite(numericAmount) || numericAmount < 0) {
      setAlertMessage('Amount must be a non-negative number');
      setAlertType('error');
      setIsLoading(false);
      return;
    }
    formData.set('amount', String(numericAmount));
    formData.set('category', category);

    const result = await addExpenseRecord(formData);

    if (result.error) {
      setAlertMessage(`Error: ${result.error}`);
      setAlertType('error');
    } else {
      setAlertMessage('Expense record added successfully!');
      setAlertType('success');
      try { addToast?.({ message: 'Expense added', type: 'success' }); } catch {}

      const maybeAlerts = result.alerts ?? [];
      setAlertsList(Array.isArray(maybeAlerts) ? maybeAlerts : []);

      // show toasts for any generated alerts
      try {
        (maybeAlerts || []).forEach((a: { type: string; message: string }) => {
          try { addToast?.({ message: a.message, type: a.type === 'warning' ? 'warning' : 'info' }); } catch {}
        });
      } catch {}

      formRef.current?.reset();
      setAmount('');
      setCategory('');
      setDescription('');

      // Dispatch global events without unused `e`
      try { window.dispatchEvent(new CustomEvent('records:changed')); } catch {}
      try { window.dispatchEvent(new CustomEvent('budget:changed')); } catch {}
      if (maybeAlerts.length > 0) {
        try { window.dispatchEvent(new CustomEvent('notifications:changed')); } catch {}
      }
    }

    setIsLoading(false);
  };

  const handleAISuggestCategory = async () => {
    if (!description.trim()) {
      setAlertMessage('Please enter a description first');
      setAlertType('error');
      return;
    }

    setIsCategorizingAI(true);
    setAlertMessage(null);

    try {
      const result = await suggestCategory(description);
      if (result.error) {
        setAlertMessage(`AI Suggestion: ${result.error}`);
        setAlertType('error');
      } else {
        setCategory(result.category);
        setAlertMessage(`AI suggested category: ${result.category}`);
        setAlertType('success');
      }
    } catch {
      setAlertMessage('Failed to get AI category suggestion');
      setAlertType('error');
    } finally {
      setIsCategorizingAI(false);
    }
  };

  return (
    <div className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-100/50 dark:border-gray-700/50 hover:shadow-2xl'>
      {/* Header */}
      <div className='flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6'>
        <div className='w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 via-blue-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg'>
          <span className='text-white text-sm sm:text-lg'>💳</span>
        </div>
        <div>
          <h3 className='text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight'>
            Add New Expense
          </h3>
          <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>
            Track your spending with AI assistance
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        ref={formRef}
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(formRef.current!);
          clientAction(formData);
        }}
        className='space-y-6 sm:space-y-8'
      >
        {/* Description & Date */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 dark:from-indigo-900/10 dark:to-blue-900/10 rounded-xl border border-indigo-100/50 dark:border-indigo-800/50'>
          {/* Description */}
          <div className='space-y-1.5'>
            <label htmlFor='text' className='flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 tracking-wide'>
              <span className='w-1.5 h-1.5 bg-indigo-500 rounded-full'></span>
              Expense Description
            </label>
            <div className='relative'>
              <input
                type='text'
                id='text'
                name='text'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='Coffee, groceries, gas...'
                className='w-full pl-3 pr-12 sm:pr-14 py-2.5 bg-white/70 dark:bg-gray-800/70 border-2 border-gray-200/80 dark:border-gray-600/80 rounded-xl focus:ring-2 focus:ring-indigo-500/30 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm shadow-sm hover:shadow-md transition-all duration-200'
                required
              />
              <button
                type='button'
                onClick={handleAISuggestCategory}
                disabled={isCategorizingAI || !description.trim()}
                className='absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-7 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-lg text-xs font-medium flex items-center justify-center shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-200'
                title='AI Category Suggestion'
              >
                {isCategorizingAI ? (
                  <div className='w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin'></div>
                ) : (
                  <span className='text-xs'>✨</span>
                )}
              </button>
            </div>
          </div>

          {/* Date */}
          <div className='space-y-1.5'>
            <label htmlFor='date' className='flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 tracking-wide'>
              <span className='w-1.5 h-1.5 bg-blue-500 rounded-full'></span>
              Expense Date
            </label>
            <input
              type='date'
              name='date'
              id='date'
              required
              onFocus={(e) => e.target.showPicker()}
              className='w-full px-3 py-2.5 bg-white/70 dark:bg-gray-800/70 border-2 border-gray-200/80 dark:border-gray-600/80 rounded-xl focus:ring-2 focus:ring-indigo-500/30 text-gray-900 dark:text-gray-100 text-sm shadow-sm hover:shadow-md transition-all duration-200'
            />
          </div>
        </div>

        {/* Category & Amount */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl border border-blue-100/50 dark:border-blue-800/50'>
          {/* Category */}
          <div className='space-y-1.5'>
            <label htmlFor='category' className='flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 tracking-wide'>
              <span className='w-1.5 h-1.5 bg-blue-500 rounded-full'></span>
              Category
              <span className='text-xs text-gray-400 dark:text-gray-500 ml-2 font-normal hidden sm:inline'>
                Use the ✨ button above for AI suggestions
              </span>
            </label>
            <select
              id='category'
              name='category'
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className='w-full px-3 py-2.5 bg-white/70 dark:bg-gray-800/70 border-2 border-gray-200/80 dark:border-gray-600/80 rounded-xl text-gray-900 dark:text-gray-100 cursor-pointer text-sm shadow-sm hover:shadow-md transition-all duration-200'
            >
              <option value='' disabled>Select category...</option>
              <option value='Food'>🍔 Food & Dining</option>
              <option value='Transportation'>🚗 Transportation</option>
              <option value='Shopping'>🛒 Shopping</option>
              <option value='Entertainment'>🎬 Entertainment</option>
              <option value='Bills'>💡 Bills & Utilities</option>
              <option value='Healthcare'>🏥 Healthcare</option>
              <option value='Other'>📦 Other</option>
            </select>
          </div>

          {/* Amount */}
          <div className='space-y-1.5'>
            <label htmlFor='amount' className='flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 tracking-wide'>
              <span className='w-1.5 h-1.5 bg-blue-500 rounded-full'></span>
              Amount
            </label>
            <div className='relative'>
              <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium text-sm'>₱</span>
              <input
                type='number'
                name='amount'
                id='amount'
                min='0'
                max='100000'
                step='1'
                value={amount}
                onFocus={() => { if (amount === '0') setAmount(''); }}
                onBlur={(e) => { if (!e.target.value) setAmount(''); }}
                onChange={(e) => setAmount(e.target.value)}
                required
                className='w-full pl-6 pr-3 py-2.5 bg-white/70 dark:bg-gray-800/70 border-2 border-gray-200/80 dark:border-gray-600/80 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200'
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type='submit'
          disabled={isLoading}
          className='w-full relative overflow-hidden bg-gradient-to-r from-indigo-600 via-blue-500 to-teal-500 hover:from-indigo-700 hover:via-blue-600 hover:to-teal-600 text-white px-4 py-3 sm:px-5 sm:py-4 rounded-xl font-semibold shadow-xl hover:shadow-2xl group transition-all duration-300 border-2 border-transparent hover:border-white/20 text-sm sm:text-base'
        >
          <div className='relative flex items-center justify-center gap-2'>
            {isLoading ? (
              <>
                <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin'></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span className='text-lg'>💫</span>
                <span>Add Expense</span>
              </>
            )}
          </div>
        </button>
      </form>

      {/* Alerts */}
      {alertMessage && (
        <div className={`mt-4 p-3 rounded-xl border-l-4 backdrop-blur-sm ${
          alertType === 'success'
            ? 'bg-blue-50/80 dark:bg-blue-900/20 border-l-blue-500 text-blue-800 dark:text-blue-200'
            : 'bg-red-50/80 dark:bg-red-900/20 border-l-red-500 text-red-800 dark:text-red-200'
        }`}>
          <div className='flex items-center gap-2'>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              alertType === 'success' ? 'bg-blue-100 dark:bg-blue-800' : 'bg-red-100 dark:bg-red-800'
            }`}>
              <span className='text-sm'>{alertType === 'success' ? '✅' : '⚠️'}</span>
            </div>
            <p className='font-medium text-sm'>{alertMessage}</p>
          </div>
        </div>
      )}

      {/* Budget alerts */}
      {alertsList.length > 0 && (
        <div className='mt-4 space-y-2'>
          {alertsList.map((a, i) => (
            <div key={i} className='p-3 rounded-md border bg-yellow-50 text-yellow-800'>
              <div className='font-semibold'>{a.type.toUpperCase()}</div>
              <div className='text-sm'>{a.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddRecord;
