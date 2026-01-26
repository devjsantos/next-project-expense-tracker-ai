"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import BudgetSettings from "./BudgetSettings";

type PerCat = { category: string; allocated: number; spent: number };

interface BudgetData {
  monthStart: string;
  budget: { monthlyTotal: number } | null;
  totalSpent: number;
  remaining: number;
  percentUsed: number;
  dailyAverage: number;
  daysLeft: number;
  perCategory: PerCat[];
}

interface BudgetOverviewProps {
  month?: string;
}

export default function BudgetOverview({ month }: BudgetOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BudgetData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const q = month ? `?month=${encodeURIComponent(month)}` : "";
      const res = await fetch(`/api/budget/status${q}`);
      if (!res.ok) throw new Error("Failed to fetch budget status");
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Failed to fetch budget status", error);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    const handler = () => fetchStatus();
    window.addEventListener("records:changed", handler);
    window.addEventListener("budget:changed", handler);
    return () => {
      window.removeEventListener("records:changed", handler);
      window.removeEventListener("budget:changed", handler);
    };
  }, [fetchStatus]);

  // Modal focus trap & Escape key
  useEffect(() => {
    if (!showModal || !modalRef.current) return;
    const node = modalRef.current;
    const focusable = node.querySelectorAll<HTMLElement>("a, button, input, select, textarea, [tabindex]:not([tabindex='-1'])");
    if (focusable.length) focusable[0].focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false);
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showModal]);

  const handleExportCSV = async () => {
    try {
      const q = month ? `?month=${encodeURIComponent(month)}` : "";
      const res = await fetch(`/api/budget/export${q}`);
      if (!res.ok) throw new Error("Export failed");
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Clean filename logic
      const fileName = `SmartJuanPeso-Budget-${month || new Date().toISOString().slice(0, 7)}.csv`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed", error);
      alert("Failed to generate CSV export. Please try again.");
    }
  };

  if (loading) return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse text-center">
      <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Loading budget data...</p>
    </div>
  );

  if (!data) return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
      <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No budget data found</p>
    </div>
  );

  const budget = data.budget;
  const percent = data.percentUsed ?? 0;
  const pctText = `${Math.round(percent * 100)}%`;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      {/* Header & Primary Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Monthly Budget</h3>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
            {(() => {
              if (!data.monthStart) return "No Date";
              const dateStr = data.monthStart.length === 7 ? `${data.monthStart}-01` : data.monthStart;
              const date = new Date(dateStr);
              return isNaN(date.getTime()) ? "Select Month" : date.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' });
            })()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-xs border border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 transition-all"
          >
            <span>📥</span> Export CSV
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
          >
            Manage
          </button>
        </div>
      </div>

      {/* Main Stats Card */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Budget</p>
          <p className="text-xl font-black text-gray-900 dark:text-white">
            {budget ? `₱${Number(budget.monthlyTotal).toLocaleString()}` : "₱0.00"}
          </p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Spent</p>
          <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">
            ₱{Number(data.totalSpent).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-end mb-2">
          <span className="text-[10px] font-black text-gray-400 uppercase">Usage Progress</span>
          <span className={`text-sm font-black ${percent > 0.9 ? 'text-red-500' : 'text-indigo-600'}`}>{pctText}</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden border-4 border-gray-50 dark:border-gray-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${percent > 0.9 ? 'bg-red-500' : 'bg-gradient-to-r from-indigo-500 to-teal-400'}`}
            style={{ width: `${Math.min(percent * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-2 py-4 border-t border-gray-100 dark:border-gray-700">
        <div className="text-center">
          <p className="text-[9px] font-black text-gray-400 uppercase">Remaining</p>
          <p className="text-xs font-bold text-gray-900 dark:text-white">₱{data.remaining.toFixed(0)}</p>
        </div>
        <div className="text-center border-x border-gray-100 dark:border-gray-700">
          <p className="text-[9px] font-black text-gray-400 uppercase">Daily Avg</p>
          <p className="text-xs font-bold text-gray-900 dark:text-white">₱{data.dailyAverage.toFixed(0)}</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] font-black text-gray-400 uppercase">Days Left</p>
          <p className="text-xs font-bold text-gray-900 dark:text-white">{data.daysLeft}</p>
        </div>
      </div>

      {/* Category Breakdown */}
      {Array.isArray(data.perCategory) && data.perCategory.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Category Breakdown</h4>
          <div className="space-y-4">
            {data.perCategory.map((c) => {
              const used = c.allocated > 0 ? Math.min(1, c.spent / c.allocated) : 0;
              return (
                <div key={c.category}>
                  <div className="flex justify-between text-[11px] font-bold mb-1.5">
                    <span className="text-gray-700 dark:text-gray-300">{c.category}</span>
                    <span className="text-gray-400">
                      ₱{c.spent.toFixed(0)} <span className="text-[9px] opacity-50">/ ₱{c.allocated.toFixed(0)}</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                    <div 
                      className={`h-full rounded-full ${used > 0.9 ? 'bg-red-400' : 'bg-indigo-400'}`} 
                      style={{ width: `${used * 100}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal for Budget Settings */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in zoom-in-95" ref={modalRef} role="dialog">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Configure Budget</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-2 transition-colors">
                ✕
              </button>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <BudgetSettings
                initial={{ month: month }}
                onClose={() => {
                  setShowModal(false);
                  fetchStatus(); // Refresh data after closing
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}