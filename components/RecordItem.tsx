'use client';

import { useState } from 'react';
import { Record as MyExpenseRecord } from '@/types/Record';
import deleteRecord from '@/app/actions/deleteRecord';
import updateRecord from '@/app/actions/updateRecord';
import { useToast } from '@/components/ToastProvider';

interface RecordItemProps {
  record: MyExpenseRecord;
  isManageMode: boolean;
  onRefresh: () => void;
}

const RecordItem = ({ record, isManageMode, onRefresh }: RecordItemProps) => {
  const { addToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [editData, setEditData] = useState({
    text: record.text,
    amount: record.amount.toString(),
    category: record.category,
    date: new Date(record.date).toISOString().split('T')[0]
  });

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this?')) return;

    setIsDeleting(true);
    try {
      const result = await deleteRecord(record.id);

      if (result?.error) {
        // FIX: Using a type guard or string coercion to satisfy TypeScript
        const errorObj = result.error as any;
        const errorMessage = errorObj?.message || String(result.error);
        addToast(errorMessage, 'error');
      } else {
        addToast('Record deleted successfully', 'success');
        onRefresh();
        window.dispatchEvent(new CustomEvent('budget:changed'));
      }
    } catch (err) {
      addToast('Failed to delete record', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const payload = {
        id: record.id,
        text: editData.text.trim(),
        amount: parseFloat(editData.amount),
        category: editData.category,
        date: new Date(editData.date).toISOString(),
      };

      if (isNaN(payload.amount) || payload.amount <= 0) {
        addToast("Please enter a valid amount greater than 0", 'warning');
        setIsUpdating(false);
        return;
      }

      const result = await updateRecord(payload);

      if (result?.error) {
        // FIX: Safe error extraction
        const errorObj = result.error as any;
        const msg = errorObj?.message || String(result.error);
        addToast(`Update Failed: ${msg}`, 'error');
      } else {
        addToast('Updated successfully!', 'success');
        setIsEditModalOpen(false);
        onRefresh();

        window.dispatchEvent(new CustomEvent('records:changed'));
        window.dispatchEvent(new CustomEvent('budget:changed'));

        if (result.alerts && result.alerts.length > 0) {
          result.alerts.forEach((alertItem: any) => {
            addToast(alertItem.message, alertItem.type as any);
          });
        }
      }
    } catch (err) {
      addToast("Connection error. Try again.", 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // ... rest of your return JSX remains the same ...
  return (
    <>
      {/* Transaction Row */}
      <div className="group flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 rounded-2xl transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center text-lg shadow-sm">
            {getCategoryEmoji(record.category)}
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white text-sm">{record.text}</h4>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {new Date(record.date).toLocaleDateString()} • {record.category}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isManageMode ? (
            <span className="font-black text-gray-900 dark:text-white">
              ₱{Number(record.amount).toLocaleString()}
            </span>
          ) : (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
              >
                ✏️
              </button>
              <button
                disabled={isDeleting}
                onClick={handleDelete}
                className="p-2.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all"
              >
                {isDeleting ? '...' : '🗑️'}
              </button>
            </div>
          )}
        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md p-6 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-6 tracking-tighter">Edit Record</h3>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Description</label>
                <input
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white focus:border-indigo-500 outline-none"
                  value={editData.text}
                  onChange={e => setEditData({ ...editData, text: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Category</label>
                  <select
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl font-bold text-sm text-gray-900 dark:text-white"
                    value={editData.category}
                    onChange={e => setEditData({ ...editData, category: e.target.value })}
                  >
                    <option value="Food">Food</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Bills">Bills</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Amount</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white"
                    value={editData.amount}
                    onChange={e => setEditData({ ...editData, amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const getCategoryEmoji = (cat: string) => {
  const emojis: { [key: string]: string } = {
    'Food': '🍔', 'Transportation': '🚗', 'Shopping': '🛒', 'Bills': '💡',
    'Entertainment': '🎬', 'Healthcare': '🏥', 'Other': '📦'
  };
  return emojis[cat] || '💰';
};

export default RecordItem;