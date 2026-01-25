'use client';

import React from 'react';

type Allocation = { category: string; amount: number };
type BudgetItem = {
  id: string;
  monthlyTotal: number;
  monthStart: string;
  allocations: Allocation[];
};

export default function BudgetHistory({ budgets }: { budgets: BudgetItem[] }) {
  const [selectedMonth, setSelectedMonth] = React.useState<string | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  // 🟢 Always call hooks at the top
 React.useEffect(() => {
    const handler = (e: Event) => {
      try {
        const m = (e as CustomEvent)?.detail?.month;
        if (m) setSelectedMonth(m);
      } catch {
        // ignore error
      }
    };
    window.addEventListener('budget:select', handler as EventListener);
    return () => window.removeEventListener('budget:select', handler as EventListener);
  }, []);

  function selectMonth(monthIso: string) {
    const month = monthIso.slice(0, 7);
    setSelectedMonth(month);
    try {
      window.dispatchEvent(new CustomEvent('budget:select', { detail: { month } }));
    } catch (_e) {
      console.error(_e);
    }
  }

  // Early return for empty budgets
  if (!budgets || budgets.length === 0)
    return (
      <div className="p-4 bg-white/80 dark:bg-gray-800/80 rounded-lg shadow">
        <h3 className="text-sm font-semibold mb-2">Budget History</h3>
        <div className="text-xs text-gray-500">No budgets yet.</div>
      </div>
    );

  return (
    <div className="p-4 bg-white/80 dark:bg-gray-800/80 rounded-lg shadow">
      <h3 className="text-sm font-semibold mb-2">Budget History</h3>
      <div className="space-y-2">
        {budgets.map((b) => {
          const monthKey = new Date(b.monthStart).toISOString().slice(0, 7);
          const isSelected = selectedMonth === monthKey;
          const isExpanded = expandedId === b.id;

          return (
            <div
              key={b.id}
              className={`p-2 rounded ${
                isSelected
                  ? 'ring-2 ring-indigo-300 dark:ring-indigo-600 bg-indigo-50/40'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-900/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">
                    {new Date(b.monthStart).toLocaleString(undefined, {
                      year: 'numeric',
                      month: 'long',
                    })}
                  </div>
                  <div className="text-xs text-gray-500">
                    Total: {b.monthlyTotal.toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => selectMonth(b.monthStart)}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : b.id)}
                    className="text-xs text-gray-600 hover:underline"
                  >
                    {isExpanded ? 'Hide' : 'Allocations'}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-2 text-xs text-gray-700 dark:text-gray-200">
                  <div className="font-semibold mb-1">Allocations</div>
                  <div className="grid grid-cols-2 gap-2">
                    {b.allocations.map((a) => (
                      <div
                        key={a.category}
                        className="flex items-center justify-between bg-white/60 dark:bg-gray-800/60 rounded px-2 py-1"
                      >
                        <div className="text-sm">{a.category}</div>
                        <div className="text-sm font-medium">{a.amount.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
