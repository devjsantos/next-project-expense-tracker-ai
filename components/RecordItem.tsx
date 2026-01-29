'use client';

import React, { useState } from 'react';
import { Record as MyExpenseRecord } from '@/types/Record';
import deleteRecord from '@/app/actions/deleteRecord';
import updateRecord from '@/app/actions/updateRecord';
import { useToast } from '@/components/ToastProvider';
import { 
  Pencil, 
  Trash2, 
  Calendar, 
  Tag, 
  X, 
  Check, 
  Loader2, 
  Utensils, 
  Car, 
  ShoppingBag, 
  Lightbulb, 
  Film, 
  HeartPulse, 
  Package, 
  Wallet 
} from 'lucide-react';

/* ================= TYPES ================= */

interface BudgetAlert {
  type: 'warning' | 'info' | 'success';
  message: string;
}

interface RecordItemProps {
  record: MyExpenseRecord;
  isManageMode: boolean;
  onRefresh: () => void;
}

/* ================= COMPONENT ================= */

const RecordItem = ({ record, isManageMode, onRefresh }: RecordItemProps) => {
  const { addToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [editData, setEditData] = useState({
    text: record.text,
    amount: record.amount.toString(),
    date: new Date(record.date).toISOString().split('T')[0]
  });

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this?')) return;

    setIsDeleting(true);
    try {
      const result = await deleteRecord(record.id);
      if (result?.error) {
        addToast(String(result.error), 'error');
      } else {
        addToast('Record removed', 'success');
        onRefresh();
        window.dispatchEvent(new CustomEvent('budget:changed'));
      }
    } catch {
      addToast('Failed to delete', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const parsedAmount = parseFloat(editData.amount);
      const payload = {
        id: record.id,
        text: editData.text.trim(),
        amount: parsedAmount,
        category: record.category,
        date: new Date(editData.date).toISOString(),
      };

      if (isNaN(payload.amount) || payload.amount <= 0) {
        addToast("Enter a valid amount", 'warning');
        setIsUpdating(false);
        return;
      }

      const result = await updateRecord(payload);

      if (result?.error) {
        addToast(`Error: ${result.error}`, 'error');
      } else {
        addToast('Changes saved', 'success');
        setIsEditModalOpen(false);
        onRefresh();
        window.dispatchEvent(new CustomEvent('records:changed'));
        window.dispatchEvent(new CustomEvent('budget:changed'));

        if (result.alerts) {
          (result.alerts as BudgetAlert[]).forEach((alert) => addToast(alert.message, alert.type));
        }
      }
    } catch {
      addToast("Connection error", 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="group relative p-4 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 rounded-[2rem] transition-all duration-300 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col gap-3 overflow-hidden">
        
        {/* DATE - TOP RIGHT (Small Text) */}
        <div className="absolute top-4 right-5 flex items-center gap-1">
           <Calendar size={10} className="text-slate-300" />
           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
             {new Date(record.date).toLocaleDateString()}
           </span>
        </div>

        <div className="flex items-start gap-4">
          {/* CATEGORY ICON */}
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center shrink-0 shadow-sm border border-slate-100 dark:border-slate-600 transition-transform group-hover:scale-110">
            {getCategoryIcon(record.category)}
          </div>

          {/* CONTENT STACK */}
          <div className="flex-1 min-w-0 pr-12">
            {/* Description (Top) */}
            <h4 className="font-black text-slate-900 dark:text-white text-sm tracking-tight truncate uppercase leading-tight mb-2">
              {record.text}
            </h4>
            
            {/* Category & Amount Row (Bottom) */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-lg shrink-0">
                <Tag size={10} className="text-indigo-500" />
                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                  {record.category}
                </span>
              </div>
              
              {!isManageMode && (
                <div className="shrink-0">
                  <span className="font-black text-slate-900 dark:text-white text-base tracking-tighter">
                    ₱{Number(record.amount).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MANAGE MODE ACTIONS (Shown below on mobile/edit mode) */}
        {isManageMode && (
          <div className="flex items-center gap-2 mt-1 pt-3 border-t border-slate-100 dark:border-slate-700/50 animate-in fade-in slide-in-from-top-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
            >
              <Pencil size={12} /> Edit
            </button>
            <button
              disabled={isDeleting}
              onClick={handleDelete}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95"
            >
              {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              Delete
            </button>
          </div>
        )}
      </div>

      {/* EDIT MODAL remains the same */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setIsEditModalOpen(false)} />
          
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Modify</h3>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1">Transaction # {record.id.slice(-4)}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Label</label>
                <div className="relative">
                  <Pencil size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-all"
                    value={editData.text}
                    onChange={e => setEditData({ ...editData, text: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Group</label>
                  <div className="w-full p-4 bg-slate-100 dark:bg-slate-800/80 border-2 border-transparent rounded-2xl font-black text-[11px] text-slate-500 flex items-center gap-2 opacity-60">
                    <Tag size={12} /> {record.category}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">₱</span>
                    <input
                      type="number"
                      step="any"
                      className="w-full pl-9 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-black text-slate-900 dark:text-white focus:border-indigo-500 outline-none transition-all"
                      value={editData.amount}
                      onChange={e => setEditData({ ...editData, amount: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-[2] py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {isUpdating ? 'Saving...' : 'Confirm Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const getCategoryIcon = (cat: string): React.ReactNode => {
  const iconProps = { size: 20, className: "text-indigo-500" };
  const icons: Record<string, React.ReactNode> = {
    'Food': <Utensils {...iconProps} />,
    'Transportation': <Car {...iconProps} />,
    'Shopping': <ShoppingBag {...iconProps} />,
    'Bills': <Lightbulb {...iconProps} />,
    'Entertainment': <Film {...iconProps} />,
    'Healthcare': <HeartPulse {...iconProps} />,
    'Other': <Package {...iconProps} />
  };
  return icons[cat] || <Wallet {...iconProps} />;
};

export default RecordItem;