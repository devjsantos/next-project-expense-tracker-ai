'use client';

import React, { useState, useEffect } from 'react';

type Allocation = { category: string; amount: number };
type BudgetItem = {
  id: string;
  monthlyTotal: number;
  monthStart: string;
  allocations: Allocation[];
};

export default function BudgetHistory({ budgets }: { budgets: BudgetItem[] }) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Sync with global budget selection events
  useEffect(() => {
    const handler = (e: Event) => {
      const m = (e as CustomEvent)?.detail?.month;
      if (m) setSelectedMonth(m);
    };
    window.addEventListener('budget:select', handler as EventListener);
    return () => window.removeEventListener('budget:select', handler as EventListener);
  }, []);

  const handleSelectMonth = (monthIso: string) => {
    const month = monthIso.slice(0, 7); // Format: YYYY-MM
    setSelectedMonth(month);
    
    // Dispatch to global listeners (BudgetOverview & BudgetSettings)
    window.dispatchEvent(new CustomEvent('budget:select', { 
      detail: { month } 
    }));
  };

  // Filter budgets based on search (Future-proofing for long history)
  const filteredBudgets = budgets.filter(b => {
    const dateStr = new Date(b.monthStart).toLocaleString('default', { month: 'long', year: 'numeric' });
    return dateStr.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (!budgets || budgets.length === 0) {
    return (
      <div className="p-6 bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
        <div className="text-3xl mb-2">📅</div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Budget History</h3>
        <p className="text-xs text-gray-500 mt-1">No historical data found. Set your first budget to start tracking!</p>
      </div>
    );
  }

  return (
    <div className="p-5 bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
          Budget History
        </h3>
        <span className="text-[10px] font-medium px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 rounded-full">
          Last {budgets.length} Months
        </span>
      </div>

      {/* Search Bar - Scalability feature */}
      <div className="mb-4">
        <input 
          type="text"
          placeholder="Search months..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
        />
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
        {filteredBudgets.map((b) => {
          const monthKey = new Date(b.monthStart).toISOString().slice(0, 7);
          const isSelected = selectedMonth === monthKey;
          const isExpanded = expandedId === b.id;

          return (
            <div
              key={b.id}
              className={`transition-all duration-200 rounded-xl border ${
                isSelected
                  ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-900/10'
                  : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-900/40'
              }`}
            >
              <div className="p-3 flex items-center justify-between">
                <div 
                  className="cursor-pointer flex-grow" 
                  onClick={() => handleSelectMonth(b.monthStart)}
                >
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {new Date(b.monthStart).toLocaleString('default', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    Total: ₱{b.monthlyTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : b.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isExpanded 
                        ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600' 
                        : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title="View Allocations"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Collapsible Allocations */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 animate-in slide-in-from-top-2 duration-200">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-2">
                    Allocation Breakdown
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {b.allocations.map((a) => (
                      <div
                        key={a.category}
                        className="flex items-center justify-between bg-white/40 dark:bg-black/20 rounded-lg px-2.5 py-1.5 border border-gray-100/50 dark:border-gray-700/50"
                      >
                        <span className="text-xs text-gray-600 dark:text-gray-300">{a.category}</span>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                          ₱{a.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
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