'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Search,
  ChevronDown,
  Layers,
  CalendarDays,
  Target,
  ArrowRightCircle
} from 'lucide-react';

type Allocation = { category: string; amount: number };
type BudgetItem = {
  id: string;
  monthlyTotal: number;
  monthStart: string;
  allocations: Allocation[];
};

export default function BudgetHistory({ budgets = [] }: { budgets: BudgetItem[] }) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ month: string }>;
      const m = customEvent.detail?.month;
      if (m) setSelectedMonth(m);
    };
    window.addEventListener('budget:select', handler);
    return () => window.removeEventListener('budget:select', handler);
  }, []);

  const handleSelectMonth = (monthIso: string) => {
    const month = monthIso.slice(0, 7);
    setSelectedMonth(month);
    window.dispatchEvent(new CustomEvent('budget:select', { detail: { month } }));
  };

  const filteredBudgets = useMemo(() => {
    return (budgets || []).filter(b => {
      if (!b?.monthStart) return false; // Skip items with no date

      const dateStr = new Date(b.monthStart).toLocaleString('default', {
        month: 'long',
        year: 'numeric'
      });
      return dateStr.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [budgets, searchTerm]);
  return (
    <div className="bg-white dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col h-full max-h-[600px]">

      {/* 1. Header & Search Protocol */}
      <div className="p-6 border-b border-slate-50 dark:border-slate-800/50 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-500">
              <History size={16} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Budget Archive
            </h3>
          </div>
          {budgets.length > 0 && (
            <span className="text-[9px] font-black px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md">
              {budgets.length} UNITS
            </span>
          )}
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
          <input
            type="text"
            placeholder="Search timeline..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-[11px] pl-9 pr-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium"
          />
        </div>
      </div>

      {/* 2. Timeline Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {budgets.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 mb-3">
              <CalendarDays size={24} />
            </div>
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">No Logs Detected</h3>
            <p className="text-[10px] text-slate-500 mt-1">Initialize your first budget cycle.</p>
          </div>
        ) : (
          filteredBudgets.map((b) => {
            const monthKey = new Date(b.monthStart).toISOString().slice(0, 7);
            const isSelected = selectedMonth === monthKey;
            const isExpanded = expandedId === b.id;

            return (
              <div
                key={b.id}
                className={`group transition-all rounded-2xl border ${isSelected
                  ? 'border-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-500/5'
                  : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
              >
                <div className="p-3 flex items-center gap-3">
                  {/* Selector Dot */}
                  <button
                    onClick={() => handleSelectMonth(b.monthStart)}
                    className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isSelected
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-indigo-500'
                      }`}
                  >
                    <ArrowRightCircle size={16} />
                  </button>

                  <div
                    className="flex-grow cursor-pointer"
                    onClick={() => handleSelectMonth(b.monthStart)}
                  >
                    <div className="text-xs font-black tracking-tight text-slate-800 dark:text-slate-200 uppercase">
                      {b.monthStart
                        ? new Date(b.monthStart).toLocaleString('default', { month: 'long', year: 'numeric' })
                        : "Unknown Cycle"}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Target size={10} className="text-indigo-500" />
                      ₱{(b.monthlyTotal || 0).toLocaleString()}
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : b.id)}
                    className={`p-2 rounded-lg transition-all ${isExpanded
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                      : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                  >
                    <ChevronDown size={14} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {isExpanded && (
                  <div className="px-3 pb-4 pt-1 animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="bg-white dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800 p-2 space-y-1">
                      <div className="flex items-center gap-2 px-2 py-1 mb-1">
                        <Layers size={10} className="text-slate-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Resource Allocation</span>
                      </div>
                      {b.allocations.map((a) => (
                        <div
                          key={a.category}
                          className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
                        >
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{a.category}</span>
                          <span className="text-[10px] font-black text-slate-800 dark:text-slate-200">
                            ₱{(a.amount || 0).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}