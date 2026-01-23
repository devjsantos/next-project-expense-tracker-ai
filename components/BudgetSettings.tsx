'use client';
import { useState, useEffect, useCallback } from 'react';
import setMonthlyBudget from '@/app/actions/setMonthlyBudget';
import Toast from './Toast';
import { useToast } from './ToastProvider';
import t from '@/lib/i18n';

const defaultCategories = ['Food','Transportation','Entertainment','Shopping','Bills','Healthcare','Other'];

export default function BudgetSettings({ initial, onClose }: { initial?: { month?: string; monthlyTotal?: number; allocations?: { category: string; amount: number }[]; budgetAlertThreshold?: number; periodType?: string; periodStart?: string; periodEnd?: string }, onClose?: () => void }) {
  const [month, setMonth] = useState(initial?.month || '');
  const [monthlyTotal, setMonthlyTotal] = useState(initial?.monthlyTotal || 0);
  const [allocations, setAllocations] = useState(initial?.allocations || defaultCategories.map((c)=>({ category: c, amount: 0 })));
  const [budgetAlertThreshold, setBudgetAlertThreshold] = useState(initial?.budgetAlertThreshold ?? 0.8);
  const [periodType, setPeriodType] = useState<string>(initial?.periodType || 'monthly'); // 'monthly' | 'weekly' | 'custom'
  const [periodStart, setPeriodStart] = useState<string | null>(initial?.periodStart || null); // YYYY-MM-DD
  const [periodEnd, setPeriodEnd] = useState<string | null>(initial?.periodEnd || null); // YYYY-MM-DD
  const [localToast, setLocalToast] = useState<{ message: string; type?: 'success'|'error'|'info'|'warning' } | null>(null);
  const { addToast } = useToast();
  const [isLoadingBudget, setIsLoadingBudget] = useState(false);
  const [existingBudgetId, setExistingBudgetId] = useState<string | null>(null);

  // Calculate sum of allocations
  const allocationSum = allocations.reduce((sum, a) => sum + (a.amount || 0), 0);

  // Validation
  const isValid = () => {
    if (periodType === 'monthly') {
      if (!month || monthlyTotal <= 0) return false;
    } else if (periodType === 'weekly') {
      if (!periodStart || monthlyTotal <= 0) return false;
    } else if (periodType === 'custom') {
      if (!periodStart || !periodEnd || monthlyTotal <= 0) return false;
      if (new Date(periodEnd) < new Date(periodStart)) return false;
    }
    if (allocations.some(a => a.amount < 0)) return false;
    if (budgetAlertThreshold < 0.5 || budgetAlertThreshold > 0.8) return false;
    return true;
  };

  // Warn if allocations exceed monthly total
  const allocationWarning = allocationSum > monthlyTotal;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid()) {
      setLocalToast({ message: 'Please fix validation errors before saving.', type: 'error' });
      return;
    }
    if (allocationWarning) {
      setLocalToast({ message: 'Total allocations exceed monthly budget!', type: 'warning' });
      return;
    }
    // If a budget already exists for this month, confirm overwrite
    if (existingBudgetId && isDirty()) {
      const ok = window.confirm('A budget already exists for this month. Saving will overwrite it. Continue?');
      if (!ok) return;
    }
    const form = new FormData();
    form.set('periodType', periodType);
    if (periodType === 'monthly') form.set('month', month);
    if (periodType === 'weekly' || periodType === 'custom') {
      if (periodStart) form.set('periodStart', periodStart);
      if (periodEnd) form.set('periodEnd', periodEnd);
    }
    form.set('monthlyTotal', monthlyTotal.toString());
    form.set('allocations', JSON.stringify(allocations));
    form.set('budgetAlertThreshold', budgetAlertThreshold.toString());
    const res = await setMonthlyBudget(form) as { error?: string } | { budget?: { monthlyTotal: number; allocations: { category: string; amount: number }[] } };
    if ('error' in res && res.error) {
      setLocalToast({ message: t('failedSave'), type: 'error' });
    } else {
      // show local toast
      setLocalToast({ message: t('budgetSaved'), type: 'success' });
      try { window.dispatchEvent(new CustomEvent('budget:changed')); } catch (e) { /* ignore */ }
      // global toast
      try {
        const b = (res as any).budget;
        const when = periodType === 'monthly' ? month : periodType === 'weekly' ? periodStart : `${periodStart} - ${periodEnd}`;
        const msg = `Budget saved (${when}): ₱${Number(monthlyTotal).toFixed(2)}`;
        addToast({ message: msg, type: 'success' });
      } catch (e) {
        // ignore if toast provider not available
      }
      await fetchBudget();
      // close modal if provided
      try { onClose && onClose(); } catch (e) {}
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
        setExistingBudgetId(data.budget.id || null);
        setMonthlyTotal(data.budget.monthlyTotal || 0);
        setAllocations(data.budget.allocations || defaultCategories.map((c)=>({ category: c, amount: 0 })));
        setBudgetAlertThreshold(data.budget.budgetAlertThreshold ?? 0.8);
        setPeriodType(data.budget.periodType || 'monthly');
        setPeriodStart(data.budget.periodStart ? data.budget.periodStart.slice(0,10) : null);
        setPeriodEnd(data.budget.periodEnd ? data.budget.periodEnd.slice(0,10) : null);
      } else {
        setExistingBudgetId(null);
        setMonthlyTotal(0);
        setAllocations(defaultCategories.map((c)=>({ category: c, amount: 0 })));
        setBudgetAlertThreshold(0.8);
      }
    } catch (e) {
      console.error('Failed to fetch budget', e);
    } finally {
      setTimeout(()=>{ setIsLoadingBudget(false); }, 1000);
    }
  },[month]);

  useEffect(()=>{ fetchBudget(); },[fetchBudget]);

  // listen for budget selection events from BudgetHistory
  useEffect(() => {
    const handler = (e: any) => {
      try {
        const m = e?.detail?.month;
        if (m) setMonth(m);
      } catch (err) { /* ignore */ }
    };
    window.addEventListener('budget:select', handler as EventListener);
    return () => window.removeEventListener('budget:select', handler as EventListener);
  }, []);

  // Reset to defaults
  const reset = () => {
    setMonthlyTotal(0);
    setAllocations(defaultCategories.map((c)=>({ category: c, amount: 0 })));
    setBudgetAlertThreshold(0.8);
    setPeriodType('monthly');
    setPeriodStart(null);
    setPeriodEnd(null);
  };

  // Dirty check
  const isDirty = () => {
    if (!initial) return true;
    if ((initial.month && initial.month !== month) || (initial.monthlyTotal || 0) !== (monthlyTotal || 0)) return true;
    const inits = initial.allocations || defaultCategories.map(c=>({ category: c, amount: 0 }));
    for (let i = 0; i < allocations.length; i++) {
      if ((allocations[i]?.amount || 0) !== (inits[i]?.amount || 0)) return true;
    }
    if ((initial.budgetAlertThreshold ?? 0.8) !== budgetAlertThreshold) return true;
    return false;
  };

  return (
    <div>
      <form onSubmit={submit} className='space-y-4 p-4 bg-white/80 dark:bg-gray-800/80 rounded-lg shadow-md'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          <div>
            <label className='block text-sm font-medium'>Month</label>
            <select value={periodType} onChange={e=>setPeriodType(e.target.value)} className='w-full rounded-md p-2 border mb-2'>
              <option value='monthly'>Monthly</option>
              <option value='weekly'>Weekly</option>
              <option value='custom'>Custom</option>
            </select>
            {periodType === 'monthly' && (
              <input type='month' value={month} onChange={(e)=>setMonth(e.target.value)} className='w-full rounded-md p-2 border' required />
            )}
            {/* small hint explaining behavior */}
            <div className='text-xs text-gray-500 mt-2'>
              {periodType === 'monthly' && 'Monthly budgets cover the selected calendar month.'}
              {periodType === 'weekly' && 'Weekly budgets start on the selected date and run for 7 days.'}
              {periodType === 'custom' && 'Custom budgets allow any start and end date; expenses within that range are counted.'}
            </div>
            {periodType === 'weekly' && (
              <input type='date' value={periodStart||''} onChange={(e)=>setPeriodStart(e.target.value)} className='w-full rounded-md p-2 border' required />
            )}
            {periodType === 'custom' && (
              <div className='flex gap-2'>
                <input type='date' value={periodStart||''} onChange={(e)=>setPeriodStart(e.target.value)} className='w-full rounded-md p-2 border' required />
                <input type='date' value={periodEnd||''} onChange={(e)=>setPeriodEnd(e.target.value)} className='w-full rounded-md p-2 border' required />
              </div>
            )}
          </div>
          <div>
            <label className='block text-sm font-medium'>Monthly total</label>
            <input type='number' value={monthlyTotal||''} onChange={(e)=>setMonthlyTotal(parseFloat(e.target.value||'0'))} className='w-full rounded-md p-2 border' min={1} step='0.01' />
          </div>
        </div>
        <div>
          <label className='block text-sm font-medium'>Budget alert threshold</label>
          <select
            value={budgetAlertThreshold}
            onChange={e => setBudgetAlertThreshold(parseFloat(e.target.value))}
            className='w-full rounded-md p-2 border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'
          >
            {[0.5,0.6,0.7,0.8].map(pct => (
              <option key={pct} value={pct}>{Math.round(pct*100)}% (Email alert when spending reaches this % of monthly budget)</option>
            ))}
          </select>
        </div>
        <div className='space-y-2'>
          <h4 className='text-sm font-semibold'>Per-category allocations</h4>
          {allocations.map((a,i)=> (
            <div key={a.category} className='flex gap-2'>
              <div className='w-40'>{a.category}</div>
              <input
                type='number'
                value={a.amount||''}
                onChange={(e)=>{
                  const val = parseFloat(e.target.value||'0');
                  setAllocations(prev=>{
                    const copy = [...prev];
                    copy[i] = { ...copy[i], amount: val };
                    return copy;
                  });
                }}
                className={`flex-1 rounded-md p-1 border ${a.amount < 0 ? 'border-red-500' : ''}`}
                min={0}
                step='0.01'
              />
            </div>
          ))}
          <div className='text-xs mt-2'>
            <span className={allocationWarning ? 'text-red-600 font-bold' : 'text-gray-600'}>
              Total allocations: {allocationSum.toFixed(2)} / {monthlyTotal.toFixed(2)}
              {allocationWarning && ' (Over budget!)'}
            </span>
          </div>
        </div>
        <div className='flex gap-2 pt-2'>
          <button
            disabled={isLoadingBudget || !isDirty() || !isValid()}
            className={`px-4 py-2 rounded ${isLoadingBudget || !isDirty() || !isValid() ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600'} text-white`}
          >
            {isLoadingBudget ? 'Loading...' : 'Save budget'}
          </button>
          <button type="button" onClick={reset} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100">Reset</button>
        </div>
      </form>
      {localToast && <Toast message={localToast.message} type={localToast.type} onClose={()=>setLocalToast(null)} />}
    </div>
  );
}