'use client';
import { useState } from 'react';
import setMonthlyBudget from '@/app/actions/setMonthlyBudget';
import Toast from './Toast';
import t from '@/lib/i18n';
import { useEffect, useCallback } from 'react';

const defaultCategories = ['Food','Transportation','Entertainment','Shopping','Bills','Healthcare','Other'];

export default function BudgetSettings({ initial }: { initial?: { month?: string; monthlyTotal?: number; allocations?: { category: string; amount: number }[] } }){
  const [month, setMonth] = useState(initial?.month || '');
  const [monthlyTotal, setMonthlyTotal] = useState(initial?.monthlyTotal || 0);
  const [allocations, setAllocations] = useState(initial?.allocations || defaultCategories.map((c)=>({ category: c, amount: 0 })));
  const [toast, setToast] = useState<{ message: string; type?: 'success'|'error'|'info'|'warning' } | null>(null);
  const [isLoadingBudget, setIsLoadingBudget] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData();
    form.set('month', month);
    form.set('monthlyTotal', monthlyTotal.toString());
    form.set('allocations', JSON.stringify(allocations));
    const res = await setMonthlyBudget(form) as { error?: string } | { budget?: { monthlyTotal: number; allocations: { category: string; amount: number }[] } };
    if ('error' in res && res.error) {
      setToast({ message: t('failedSave'), type: 'error' });
    } else {
      setToast({ message: t('budgetSaved'), type: 'success' });
      // re-fetch the saved budget to ensure UI is up-to-date
      await fetchBudget();
    }
  };

  // fetcher used by useEffect and after save
  const fetchBudget = useCallback(async () => {
    if (!month) return;
  setIsLoadingBudget(true);
    try {
      const res = await fetch(`/api/budget?month=${month}`);
      const data = await res.json();
      if (data && data.budget) {
        setMonthlyTotal(data.budget.monthlyTotal || 0);
        setAllocations(data.budget.allocations || defaultCategories.map((c)=>({ category: c, amount: 0 })));
      } else {
        // reset to defaults when no budget
        setMonthlyTotal(0);
        setAllocations(defaultCategories.map((c)=>({ category: c, amount: 0 })));
      }
    } catch (e) {
      console.error('Failed to fetch budget', e);
    } finally {
      // ensure minimum 2 seconds loading to mimic slow network
      setTimeout(()=>{
        setIsLoadingBudget(false);
      }, 2000);
    }
  },[month]);

  // compute dirty: any change vs initial
  const isDirty = () => {
    if (!initial) return true;
    if ((initial.month && initial.month !== month) || (initial.monthlyTotal || 0) !== (monthlyTotal || 0)) return true;
    const inits = initial.allocations || defaultCategories.map(c=>({ category: c, amount: 0 }));
    for (let i = 0; i < allocations.length; i++) {
      if ((allocations[i]?.amount || 0) !== (inits[i]?.amount || 0)) return true;
    }
    return false;
  };

  // auto-fetch existing budget when month changes
  useEffect(()=>{
    fetchBudget();
  },[fetchBudget]);

  return (
    <div>
      <form onSubmit={submit} className='space-y-4 p-4 bg-white/80 dark:bg-gray-800/80 rounded-lg shadow-md'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          <div>
            <label className='block text-sm font-medium'>Month</label>
            <div className='flex items-center gap-2'>
              <input type='month' value={month} onChange={(e)=>setMonth(e.target.value)} className='w-full rounded-md p-2 border' required />
              {isLoadingBudget && (
                <svg className='w-6 h-6 animate-spin' viewBox='0 0 50 50' aria-hidden>
                  <circle cx='25' cy='25' r='20' fill='none' stroke='currentColor' strokeWidth='5' strokeOpacity='0.2' className='text-gray-300 dark:text-gray-600' />
                  <path d='M45 25a20 20 0 00-20-20' stroke='currentColor' strokeWidth='5' strokeLinecap='round' className='text-indigo-500' />
                </svg>
              )}
            </div>
          </div>
          <div>
            <label className='block text-sm font-medium'>Monthly total</label>
            <input type='number' value={monthlyTotal||''} onChange={(e)=>setMonthlyTotal(parseFloat(e.target.value||'0'))} className='w-full rounded-md p-2 border' min={0} step='0.01' />
          </div>
        </div>

        <div className='space-y-2'>
          <h4 className='text-sm font-semibold'>Per-category allocations</h4>
          {allocations.map((a,i)=> (
            <div key={a.category} className='flex gap-2'>
              <div className='w-40'>{a.category}</div>
              <input type='number' value={a.amount||''} onChange={(e)=>{ const val = parseFloat(e.target.value||'0'); setAllocations(prev=>{ const copy = [...prev]; copy[i] = { ...copy[i], amount: val }; return copy; })}} className='flex-1 rounded-md p-1 border' min={0} step='0.01' />
            </div>
          ))}
        </div>

        <div className='pt-2'>
          <button disabled={isLoadingBudget || !isDirty()} className={`px-4 py-2 rounded ${isLoadingBudget || !isDirty() ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600'} text-white`}>
            {isLoadingBudget ? 'Loading...' : 'Save budget'}
          </button>
        </div>
      </form>
      {toast && <Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  );
}
