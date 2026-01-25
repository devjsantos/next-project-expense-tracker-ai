'use client';

import { useState } from 'react';
import { Record } from '@/types/Record';
import deleteRecord from '@/app/actions/deleteRecord';
import updateRecord from '@/app/actions/updateRecord';

/* ================= TYPES ================= */

type AlertType = 'info' | 'warning' | 'error' | 'success';

interface Alert {
  type: AlertType;
  message: string;
}

interface UpdateRecordResult {
  alerts?: Alert[];
}

/* ============== HELPERS ================= */

const getCategoryEmoji = (category: string): string => {
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

const getBorderColor = (amount: number): string => {
  if (amount > 100) return 'border-red-500';
  if (amount > 50) return 'border-yellow-500';
  return 'border-blue-500';
};

/* ============== COMPONENT ================= */

const RecordItem = ({ record }: { record: Record }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [editText, setEditText] = useState(record.text ?? '');
  const [editAmount, setEditAmount] = useState(record.amount.toString());
  const [editCategory, setEditCategory] = useState(record.category ?? 'Other');
  const [editDate, setEditDate] = useState(
    new Date(record.date).toISOString().slice(0, 10)
  );

  /* ============== ACTIONS ================= */

  const handleDeleteRecord = async (recordId: string) => {
    setIsLoading(true);

    await deleteRecord(recordId);

    window.dispatchEvent(new CustomEvent('records:changed'));
    window.dispatchEvent(new CustomEvent('budget:changed'));

    setIsLoading(false);
  };

  const handleSaveEdit = async () => {
    setIsLoading(true);

    const amount = Number(editAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      alert('Amount must be a non-negative number');
      setIsLoading(false);
      return;
    }

    try {
      const result = (await updateRecord({
        id: record.id,
        text: editText,
        amount,
        category: editCategory,
        date: new Date(editDate).toISOString(),
      })) as UpdateRecordResult;

      if (result.alerts?.length) {
        alert(
          result.alerts
            .map(a => `${a.type.toUpperCase()}: ${a.message}`)
            .join('\n')
        );

        window.dispatchEvent(new CustomEvent('notifications:changed'));
      }

      setIsEditing(false);
      window.dispatchEvent(new CustomEvent('records:changed'));
      window.dispatchEvent(new CustomEvent('budget:changed'));
    } catch {
      alert('Failed to update record');
    } finally {
      setIsLoading(false);
    }
  };

  /* ============== UI ================= */

  return (
    <li
      className={`bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100/50 dark:border-gray-600/50 border-l-4 ${getBorderColor(
        record.amount
      )} relative min-h-[120px] sm:min-h-[140px] flex flex-col justify-between`}
    >
      {/* Delete */}
      <button
        onClick={() => handleDeleteRecord(record.id)}
        disabled={isLoading}
        aria-label="Delete record"
        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg hover:scale-110 transition"
      >
        {isLoading ? (
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          '✕'
        )}
      </button>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-500">
          <span>{new Date(record.date).toLocaleDateString()}</span>
          <span className="font-bold text-gray-900 dark:text-gray-100">
            ₱{record.amount.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span>{getCategoryEmoji(record.category)}</span>
          <span className="text-sm">{record.category}</span>
        </div>

        {!isEditing ? (
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {record.text}
          </p>
        ) : (
          <div className="space-y-2">
            <input
              className="w-full p-1 border rounded"
              value={editText}
              onChange={e => setEditText(e.target.value)}
            />

            <div className="flex gap-2">
              <input
                type="date"
                className="p-1 border rounded"
                value={editDate}
                onChange={e => setEditDate(e.target.value)}
              />

              <select
                className="p-1 border rounded"
                value={editCategory}
                onChange={e => setEditCategory(e.target.value)}
              >
                {[
                  'Food',
                  'Transportation',
                  'Shopping',
                  'Entertainment',
                  'Bills',
                  'Healthcare',
                  'Other',
                ].map(cat => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>

              <input
                className="p-1 border rounded w-24"
                value={editAmount}
                onChange={e => setEditAmount(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={isLoading}
                className="px-3 py-1 bg-indigo-600 text-white rounded"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 bg-gray-200 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {!isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          className="mt-3 text-xs border rounded px-2 py-1"
        >
          Edit
        </button>
      )}
    </li>
  );
};

export default RecordItem;
