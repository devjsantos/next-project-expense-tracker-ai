'use client';

import { useState, useEffect, useCallback } from 'react';
import setMonthlyBudget from '@/app/actions/setMonthlyBudget';
import Toast from './Toast';
import { useToast } from './ToastProvider';
import t from '@/lib/i18n';

/* ================= TYPES ================= */

type Allocation = {
  category: string;
  amount: number;
};

type InitialBudget = {
  month?: string;
  monthlyTotal?: number;
  allocations?: Allocation[];
  budgetAlertThreshold?: number;
  periodType?: 'monthly' | 'weekly' | 'custom';
  periodStart?: string;
  periodEnd?: string;
};

type BudgetApiResponse =
  | { error: string }
  | {
      budget: {
        id?: string;
        monthlyTotal: number;
        allocations: Allocation[];
        budgetAlertThreshold?: number;
        periodType?: 'monthly' | 'weekly' | 'custom';
        periodStart?: string;
        periodEnd?: string;
      };
    };

type BudgetSelectEvent = CustomEvent<{ month?: string }>;

/* ================= CONSTANTS ================= */

const defaultCategories = [
  'Food',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Bills',
  'Healthcare',
  'Other',
];

/* ================= COMPONENT ================= */

export default function BudgetSettings({
  initial,
  onClose,
}: {
  initial?: InitialBudget;
  onClose?: () => void;
}) {
  const [month, setMonth] = useState(initial?.month || '');
  const [monthlyTotal, setMonthlyTotal] = useState(initial?.monthlyTotal || 0);
  const [allocations, setAllocations] = useState<Allocation[]>(
    initial?.allocations ??
      defaultCategories.map(category => ({ category, amount: 0 }))
  );
  const [budgetAlertThreshold, setBudgetAlertThreshold] = useState(
    initial?.budgetAlertThreshold ?? 0.8
  );
  const [periodType, setPeriodType] = useState<
    'monthly' | 'weekly' | 'custom'
  >(initial?.periodType || 'monthly');
  const [periodStart, setPeriodStart] = useState<string | null>(
    initial?.periodStart || null
  );
  const [periodEnd, setPeriodEnd] = useState<string | null>(
    initial?.periodEnd || null
  );
  const [localToast, setLocalToast] = useState<{
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
  } | null>(null);

  const { addToast } = useToast();
  const [isLoadingBudget, setIsLoadingBudget] = useState(false);
  const [existingBudgetId, setExistingBudgetId] = useState<string | null>(null);

  /* ================= DERIVED ================= */

  const allocationSum = allocations.reduce((sum, a) => sum + a.amount, 0);
  const allocationWarning = allocationSum > monthlyTotal;

  /* ================= VALIDATION ================= */

  const isValid = () => {
    if (periodType === 'monthly' && (!month || monthlyTotal <= 0)) return false;
    if (periodType === 'weekly' && (!periodStart || monthlyTotal <= 0))
      return false;
    if (periodType === 'custom') {
      if (!periodStart || !periodEnd || monthlyTotal <= 0) return false;
      if (new Date(periodEnd) < new Date(periodStart)) return false;
    }
    if (allocations.some(a => a.amount < 0)) return false;
    return budgetAlertThreshold >= 0.5 && budgetAlertThreshold <= 0.8;
  };

  /* ================= SUBMIT ================= */

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isValid()) {
      setLocalToast({
        message: 'Please fix validation errors before saving.',
        type: 'error',
      });
      return;
    }

    if (allocationWarning) {
      setLocalToast({
        message: 'Total allocations exceed monthly budget!',
        type: 'warning',
      });
      return;
    }

    if (existingBudgetId) {
      const ok = window.confirm(
        'A budget already exists for this period. Overwrite it?'
      );
      if (!ok) return;
    }

    const form = new FormData();
    form.set('periodType', periodType);
    if (periodType === 'monthly') form.set('month', month);
    if (periodStart) form.set('periodStart', periodStart);
    if (periodEnd) form.set('periodEnd', periodEnd);
    form.set('monthlyTotal', monthlyTotal.toString());
    form.set('allocations', JSON.stringify(allocations));
    form.set('budgetAlertThreshold', budgetAlertThreshold.toString());

    setIsLoadingBudget(true);

    const res = (await setMonthlyBudget(form)) as BudgetApiResponse;

    if ('error' in res) {
      setLocalToast({ message: t('failedSave'), type: 'error' });
      setIsLoadingBudget(false);
      return;
    }

    const when =
      periodType === 'monthly'
        ? month
        : periodType === 'weekly'
        ? periodStart
        : `${periodStart} - ${periodEnd}`;

    setLocalToast({ message: t('budgetSaved'), type: 'success' });
    addToast({
      message: `Budget saved (${when}): ₱${monthlyTotal.toFixed(2)}`,
      type: 'success',
    });

    window.dispatchEvent(new CustomEvent('budget:changed'));

    await fetchBudget();
    setIsLoadingBudget(false);

    onClose?.();
  };

  /* ================= FETCH ================= */

  const fetchBudget = useCallback(async () => {
    if (!month) return;

    setIsLoadingBudget(true);

    try {
      const res = await fetch(`/api/budget?month=${month}`);
      const data = await res.json();

      if (data?.budget) {
        setExistingBudgetId(data.budget.id ?? null);
        setMonthlyTotal(data.budget.monthlyTotal ?? 0);
        setAllocations(
          data.budget.allocations ??
            defaultCategories.map(category => ({
              category,
              amount: 0,
            }))
        );
        setBudgetAlertThreshold(data.budget.budgetAlertThreshold ?? 0.8);
        setPeriodType(data.budget.periodType ?? 'monthly');
        setPeriodStart(data.budget.periodStart?.slice(0, 10) ?? null);
        setPeriodEnd(data.budget.periodEnd?.slice(0, 10) ?? null);
      } else {
        setExistingBudgetId(null);
      }
    } finally {
      setIsLoadingBudget(false);
    }
  }, [month]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  /* ================= EVENTS ================= */

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as BudgetSelectEvent;
      if (custom.detail?.month) setMonth(custom.detail.month);
    };

    window.addEventListener('budget:select', handler);
    return () => window.removeEventListener('budget:select', handler);
  }, []);

  /* ================= HELPERS ================= */

  const reset = () => {
    setMonthlyTotal(0);
    setAllocations(
      defaultCategories.map(category => ({ category, amount: 0 }))
    );
    setBudgetAlertThreshold(0.8);
    setPeriodType('monthly');
    setPeriodStart(null);
    setPeriodEnd(null);
  };

  /* ================= JSX ================= */

  return (
    <div>
      <form
        onSubmit={submit}
        className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
      >
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          type="number"
          value={monthlyTotal}
          onChange={e => setMonthlyTotal(Number(e.target.value))}
          className="w-full border p-2 rounded"
        />

        <button
          type="submit"
          disabled={isLoadingBudget}
          className="px-4 py-2 bg-indigo-600 text-white rounded"
        >
          {isLoadingBudget ? 'Saving...' : 'Save Budget'}
        </button>

        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 bg-gray-300 rounded"
        >
          Reset
        </button>
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
