'use client';
import { useState } from 'react';
import { Record } from '@/types/Record';
import deleteRecord from '@/app/actions/deleteRecord';
import updateRecord from '@/app/actions/updateRecord';

// Helper function to get category emoji
const getCategoryEmoji = (category: string) => {
  switch (category) {
    case 'Food':
      return '🍔';
    case 'Transportation':
      return '🚗';
    case 'Shopping':
      return '🛒';
    case 'Entertainment':
      return '🎬';
    case 'Bills':
      return '💡';
    case 'Healthcare':
      return '🏥';
    default:
      return '📦';
  }
};

const RecordItem = ({ record }: { record: Record }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteRecord = async (recordId: string) => {
    setIsLoading(true); // Show loading spinner
    const res = await deleteRecord(recordId); // Perform delete operation
    try {
      window.dispatchEvent(new CustomEvent('records:changed'));
    } catch (e) {/* ignore */}
    try {
      window.dispatchEvent(new CustomEvent('budget:changed'));
    } catch (e) {/* ignore */}
    setIsLoading(false); // Hide loading spinner
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(record.text || '');
  const [editAmount, setEditAmount] = useState(record.amount.toString());
  const [editCategory, setEditCategory] = useState(record.category || 'Other');
  const [editDate, setEditDate] = useState(new Date(record.date).toISOString().slice(0,10));

  const handleSaveEdit = async () => {
    setIsLoading(true);
    try {
      const amt = parseFloat(editAmount||'0');
      if (!Number.isFinite(amt) || amt < 0) {
        alert('Amount must be a non-negative number');
        setIsLoading(false);
        return;
      }
      const res = await updateRecord({ id: record.id, text: editText, amount: amt, category: editCategory, date: new Date(editDate).toISOString() });
      if ((res as any).alerts && Array.isArray((res as any).alerts) && (res as any).alerts.length > 0) {
        // show first alert as a browser alert for now
        alert((res as any).alerts.map((a: any) => `${a.type.toUpperCase()}: ${a.message}`).join('\n'));
      }
      setIsEditing(false);
      try { window.dispatchEvent(new CustomEvent('records:changed')); } catch (e) { /* ignore */ }
      try { window.dispatchEvent(new CustomEvent('budget:changed')); } catch (e) { /* ignore */ }
      if ((res as any).alerts && Array.isArray((res as any).alerts) && (res as any).alerts.length > 0) {
        try { window.dispatchEvent(new CustomEvent('notifications:changed')); } catch (e) { /* ignore */ }
      }
    } catch (e) {
      console.error('Failed to update record', e);
      alert('Failed to update record');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine border color based on expense amount
  const getBorderColor = (amount: number) => {
    if (amount > 100) return 'border-red-500'; // High expense
    if (amount > 50) return 'border-yellow-500'; // Medium expense
    return 'border-blue-500'; // Low expense
  };

  return (
    <li
      className={`bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100/50 dark:border-gray-600/50 border-l-4 ${getBorderColor(
        record?.amount
      )} hover:bg-white/80 dark:hover:bg-gray-700/80 relative min-h-[120px] sm:min-h-[140px] flex flex-col justify-between overflow-visible group`}
    >
      {/* Delete button positioned absolutely in top-right corner */}
      <button
        onClick={() => handleDeleteRecord(record.id)}
        className={`absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center shadow-lg hover:shadow-xl border-2 border-white dark:border-gray-700 backdrop-blur-sm transform hover:scale-110 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 ${
          isLoading ? 'cursor-not-allowed scale-100' : ''
        }`}
        aria-label='Delete record'
        disabled={isLoading} // Disable button while loading
        title='Delete expense record'
      >
        {isLoading ? (
          <div className='w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin'></div>
        ) : (
          <svg
            className='w-3 h-3 sm:w-4 sm:h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        )}
      </button>

      {/* Content area with proper spacing */}
      <div className='flex-1 flex flex-col justify-between'>
        <div className='space-y-2 sm:space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide uppercase'>
              {new Date(record?.date).toLocaleDateString()}
            </span>
            <span className='text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100'>
              ₱{record?.amount.toFixed(2)}
            </span>
          </div>

          <div className='flex items-center gap-2'>
            <span className='text-base sm:text-lg'>
              {getCategoryEmoji(record?.category)}
            </span>
            <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
              {record?.category}
            </span>
          </div>
        </div>

        <div className='text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2'>
          {!isEditing ? (
            <p className='truncate break-words line-clamp-2'>{record?.text}</p>
          ) : (
            <div className='space-y-2'>
              <input className='w-full p-1 rounded border' value={editText} onChange={(e)=>setEditText(e.target.value)} />
              <div className='flex gap-2'>
                <input type='date' className='p-1 rounded border' value={editDate} onChange={(e)=>setEditDate(e.target.value)} />
                <select className='p-1 rounded border' value={editCategory} onChange={(e)=>setEditCategory(e.target.value)}>
                  <option>Food</option>
                  <option>Transportation</option>
                  <option>Shopping</option>
                  <option>Entertainment</option>
                  <option>Bills</option>
                  <option>Healthcare</option>
                  <option>Other</option>
                </select>
                <input className='p-1 rounded border w-24' value={editAmount} onChange={(e)=>setEditAmount(e.target.value)} />
              </div>
              <div className='flex gap-2'>
                <button onClick={handleSaveEdit} disabled={isLoading} className='px-2 py-1 bg-indigo-600 text-white rounded'>Save</button>
                <button onClick={()=>setIsEditing(false)} className='px-2 py-1 bg-gray-200 rounded'>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Edit button */}
      <div className='flex items-center gap-2 mt-3'>
        {!isEditing && (
          <button onClick={()=>setIsEditing(true)} className='px-2 py-1 text-xs bg-white dark:bg-gray-700 border rounded'>Edit</button>
        )}
      </div>
    </li>
  );
};

export default RecordItem;