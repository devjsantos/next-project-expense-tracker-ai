'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import setMonthlyBudget from '@/app/actions/setMonthlyBudget';
import { useToast } from './ToastProvider';
import { Save, AlertCircle, Coins } from 'lucide-react';

/* ================= TYPES ================= */
interface Allocation { category: string; amount: number; }
interface InitialBudget { month?: string; monthlyTotal?: number; allocations?: Allocation[]; }

// This fixes your "Cannot find name LocalToastState" error
interface LocalToastState {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

const defaultCategories = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Other'];

export default function BudgetSettings({ initial, onClose }: { initial?: InitialBudget; onClose?: () => void }) {
  const [month, setMonth] = useState(initial?.month || new Date().toISOString().slice(0, 7));
  const [monthlyTotal, setMonthlyTotal] = useState(initial?.monthlyTotal || 0);
  const [allocations, setAllocations] = useState<Allocation[]>(
    initial?.allocations ?? defaultCategories.map(category => ({ category, amount: 0 }))
  );
  
  const [isLoadingBudget, setIsLoadingBudget] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // useToast from your provider
  const { addToast } = useToast();

  const displayMonth = useMemo(() => {
    if (!month) return "Select Month";
    const date = new Date(month + "-02");
    return isNaN(date.getTime()) ? "Invalid" : date.toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [month]);

  const allocationSum = allocations.reduce((sum, a) => sum + a.amount, 0);
  const remainingToAllocate = monthlyTotal - allocationSum;
  const isOverAllocated = allocationSum > monthlyTotal;

  const fetchBudget = useCallback(async () => {
    if (!month) return;
    setIsLoadingBudget(true);
    try {
      const res = await fetch(`/api/budget/status?month=${month}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      if (data?.budget) {
        setMonthlyTotal(data.budget.monthlyTotal || 0);
        if (data.perCategory) {
          setAllocations(data.perCategory.map((pc: any) => ({
            category: pc.category,
            amount: pc.allocated
          })));
        }
      }
    } catch (err) {
      console.error("Fetch error:", err);
      addToast('Failed to load budget configuration', 'error');
    } finally {
      setIsLoadingBudget(false);
    }
  }, [month, addToast]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  const handleAllocationChange = (index: number, value: string) => {
    const val = parseFloat(value) || 0;
    setAllocations(prev => {
      const next = [...prev];
      next[index] = { ...next[index], amount: val };
      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (monthlyTotal <= 0) {
      addToast('Please set a budget higher than ₱0', 'warning');
      return;
    }

    addToast('Saving your budget limits...', 'loading');
    setIsProcessing(true);

    const form = new FormData();
    form.set('month', month);
    form.set('monthlyTotal', monthlyTotal.toString());
    form.set('allocations', JSON.stringify(allocations));
    form.set('periodType', 'monthly');

    try {
      const res = await setMonthlyBudget(form);
      if (res && 'error' in res) {
        addToast('Could not save budget. Try again.', 'error');
      } else {
        addToast(`Budget for ${displayMonth} is ready!`, 'success');
        window.dispatchEvent(new CustomEvent('budget:changed'));
        if (onClose) onClose();
      }
    } catch {
      addToast('Connection error. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={submit} className="space-y-5">
        
        {/* 1. TOP BAR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 font-bold text-xs outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
            <span className="text-[10px] font-black uppercase text-slate-400 truncate">Editing {displayMonth}</span>
          </div>

          <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${isOverAllocated ? 'bg-red-500/10 border-red-200' : 'bg-emerald-500/10 border-emerald-200'}`}>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Left to Plan:</span>
            <div className="flex items-center gap-2">
               <span className={`text-sm font-black ${isOverAllocated ? 'text-red-600' : 'text-emerald-600'}`}>
                ₱{remainingToAllocate.toLocaleString()}
              </span>
              {isOverAllocated && <AlertCircle size={14} className="text-red-500 animate-pulse" />}
            </div>
          </div>
        </div>

        {/* 2. MAIN BUDGET INPUT */}
        <div className="px-1">
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Monthly Goal</label>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-indigo-500 group-focus-within:scale-110 transition-transform">₱</span>
            <input
              type="number"
              step="0.01"
              value={monthlyTotal || ''}
              onChange={e => setMonthlyTotal(parseFloat(e.target.value) || 0)}
              className="w-full pl-10 pr-4 py-4 bg-white dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-black text-xl focus:border-indigo-500 outline-none transition-all"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* 3. CATEGORY ALLOCATION */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Coins size={14} className="text-indigo-500" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category Allocation</h3>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
            {allocations.map((a, i) => (
              <div key={a.category} className="p-3 bg-white dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-indigo-500/30 transition-all">
                <span className="block text-[9px] font-black text-slate-400 uppercase mb-2 truncate">{a.category}</span>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">₱</span>
                  <input
                    type="number"
                    step="0.01"
                    value={a.amount || ''}
                    onChange={e => handleAllocationChange(i, e.target.value)}
                    className="w-full pl-5 pr-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-transparent focus:border-indigo-500 rounded-lg outline-none font-bold text-right transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. ACTIONS */}
        <div className="flex gap-3 pt-4 border-t border-slate-50 dark:border-slate-800">
          <button
            type="button"
            onClick={() => onClose?.()}
            className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isProcessing || isOverAllocated}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
          >
            <Save size={14} />
            {isProcessing ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}