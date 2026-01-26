'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import setMonthlyBudget from '@/app/actions/setMonthlyBudget';
import Toast from './Toast';
import { useToast } from './ToastProvider';

/* ================= TYPES ================= */
interface Allocation {
  category: string;
  amount: number;
}

interface InitialBudget {
  month?: string;
  monthlyTotal?: number;
  allocations?: Allocation[];
}

interface LocalToastState {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

// Added specific interface for API responses to avoid 'any'
interface BudgetApiResponse {
  budget?: {
    monthlyTotal: number;
    allocations: Allocation[];
  };
  error?: string;
}

/* ================= CONSTANTS ================= */
const defaultCategories = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Other'];

export default function BudgetSettings({ initial, onClose }: { initial?: InitialBudget; onClose?: () => void }) {
  const [month, setMonth] = useState(initial?.month || new Date().toISOString().slice(0, 7));
  const [monthlyTotal, setMonthlyTotal] = useState(initial?.monthlyTotal || 0);
  const [allocations, setAllocations] = useState<Allocation[]>(
    initial?.allocations ?? defaultCategories.map(category => ({ category, amount: 0 }))
  );
  
  const { addToast } = useToast();
  const [isLoadingBudget, setIsLoadingBudget] = useState(false);
  const [localToast, setLocalToast] = useState<LocalToastState | null>(null);

  // Human-readable month display
  const displayMonth = useMemo(() => {
    return new Date(month + "-02").toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [month]);

  const allocationSum = allocations.reduce((sum, a) => sum + a.amount, 0);
  const remainingToAllocate = monthlyTotal - allocationSum;
  const isOverAllocated = allocationSum > monthlyTotal;

  const fetchBudget = useCallback(async () => {
    if (!month) return;
    setIsLoadingBudget(true);
    try {
      const res = await fetch(`/api/budget?month=${month}`);
      const data: BudgetApiResponse = await res.json(); // Fixed: Added explicit type
      if (data?.budget) {
        setMonthlyTotal(data.budget.monthlyTotal || 0);
        setAllocations(data.budget.allocations || defaultCategories.map(c => ({ category: c, amount: 0 })));
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setIsLoadingBudget(false);
    }
  }, [month]);

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
      setLocalToast({ message: 'Please set a valid total budget.', type: 'error' });
      return;
    }

    const form = new FormData();
    form.set('month', month);
    form.set('monthlyTotal', monthlyTotal.toString());
    form.set('allocations', JSON.stringify(allocations));
    form.set('periodType', 'monthly');

    setIsLoadingBudget(true);
    try {
      const res = await setMonthlyBudget(form);
      if (res && 'error' in res) {
        addToast({ message: 'Error saving budget', type: 'error' });
      } else {
        addToast({ message: `Budget for ${displayMonth} updated!`, type: 'success' });
        window.dispatchEvent(new CustomEvent('budget:changed'));
        if (onClose) onClose(); // Fixed: Proper function call instead of expression
      }
    } catch {
      addToast({ message: 'Database communication error', type: 'error' });
    } finally {
      setIsLoadingBudget(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={submit} className="space-y-6">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
          <label className="block text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
            Target Month
          </label>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="w-full sm:w-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 font-medium focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Editing: <span className="text-indigo-600">{displayMonth}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total Monthly Budget</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
              <input
                type="number"
                step="0.01"
                value={monthlyTotal || ''}
                onChange={e => setMonthlyTotal(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className={`p-4 rounded-xl border flex flex-col justify-center ${isOverAllocated ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <span className="text-xs font-bold uppercase text-gray-500">Remaining to Allocate</span>
            <span className={`text-xl font-bold ${isOverAllocated ? 'text-red-600' : 'text-emerald-600'}`}>
              ₱{remainingToAllocate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Category Breakdown</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allocations.map((a, i) => (
              <div key={a.category} className="p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl flex items-center justify-between gap-2 shadow-sm">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate">{a.category}</span>
                <div className="relative w-28">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">₱</span>
                  <input
                    type="number"
                    step="0.01"
                    value={a.amount || ''}
                    onChange={e => handleAllocationChange(i, e.target.value)}
                    className="w-full pl-5 pr-2 py-1 text-sm bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-indigo-500 rounded-md outline-none text-right"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            type="submit"
            disabled={isLoadingBudget || isOverAllocated}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold rounded-xl transition-all shadow-lg"
          >
            {isLoadingBudget ? 'Processing...' : 'Save Monthly Budget'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>

      {localToast && (
        <Toast 
          message={localToast.message} 
          type={localToast.type} 
          onClose={() => setLocalToast(null)} 
        />
      )}
    </div>
  );
}