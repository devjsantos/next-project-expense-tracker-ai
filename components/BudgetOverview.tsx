"use client";

import { useEffect, useState, useCallback } from "react";
import BudgetSettings from "./BudgetSettings";
import { useToast } from "./ToastProvider";
import {
  FileSpreadsheet,
  Settings2,
  Calendar,
  Wallet,
  Activity,
  Timer,
  ArrowUpRight,
  ChevronRight,
  X
} from "lucide-react";

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

export default function BudgetOverview({ month }: { month?: string }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BudgetData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { addToast } = useToast();

  const fetchStatus = useCallback(async () => {
    try {
      const q = month ? `?month=${encodeURIComponent(month)}` : "";
      const res = await fetch(`/api/budget/status${q}`);
      if (!res.ok) throw new Error("Fetch failed");
      setData(await res.json());
    } catch (e) {
      addToast("Failed to sync your budget", "error");
    } finally {
      setLoading(false);
    }
  }, [month, addToast]);

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

  const handleExportCSV = async () => {
    addToast("Preparing report...", "loading");
    try {
      const q = month ? `?month=${encodeURIComponent(month)}` : "";
      const res = await fetch(`/api/budget/export${q}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SmartJuan-Summary-${month || 'current'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      addToast("Report downloaded", "success");
    } catch (e) {
      addToast("Export failed", "error");
    }
  };

  if (loading) return (
    <div className="p-8 bg-white dark:bg-slate-950 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center space-y-3">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Loading...</p>
    </div>
  );

  if (!data) return null;

  const percent = data.percentUsed ?? 0;
  const isOver = percent > 0.9;

  return (
    <div className="bg-white dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">

      {/* 1. COMPACT HEADER */}
      <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Calendar size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase dark:text-white leading-tight">Budget Tracker</h3>
            <p className="text-[10px] font-bold text-indigo-500">
              {(() => {
                if (!data.monthStart) return "Idle";
                const dateString = data.monthStart.split('-').length === 2 ? `${data.monthStart}-01` : data.monthStart;
                const d = new Date(dateString);
                return isNaN(d.getTime()) ? "Active" : d.toLocaleString('default', { month: 'short', year: 'numeric' });
              })()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-100 transition-all">
            <FileSpreadsheet size={16} />
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all">
            <Settings2 size={14} /> Set Limits
          </button>
        </div>
      </div>

      {/* 2. COMPACT METRICS GRID */}
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          
          {/* Main Utilization - Now sleeker */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 flex flex-col justify-center">
            <div className="flex justify-between items-end mb-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Monthly Usage</p>
                <h4 className={`text-2xl font-black ${isOver ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                  {Math.round(percent * 100)}%
                </h4>
              </div>
              <div className="text-[9px] font-bold text-slate-400 pb-1">
                ₱{data.totalSpent.toLocaleString()} / ₱{(data.budget?.monthlyTotal || 0).toLocaleString()}
              </div>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${isOver ? 'bg-red-500' : 'bg-indigo-500'}`}
                style={{ width: `${Math.min(percent * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Quick Stats - Condensed into a smaller grid */}
          <div className="lg:col-span-2 grid grid-cols-3 gap-3">
            {[
              { label: 'Available', val: `₱${(data.remaining || 0).toLocaleString()}`, color: 'text-emerald-500' },
              { label: 'Daily Cap', val: `₱${(data.dailyAverage || 0).toFixed(0)}`, color: 'text-indigo-500' },
              { label: 'Days Left', val: data.daysLeft ?? 0, color: 'text-amber-500' }
            ].map((stat, i) => (
              <div key={i} className="p-3 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 flex flex-col justify-center text-center">
                <p className="text-[8px] font-black uppercase tracking-tighter text-slate-400 mb-1 leading-none">{stat.label}</p>
                <p className={`text-xs font-black ${stat.color} truncate`}>{stat.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 3. CATEGORY MATRIX - Smaller cards, multi-column */}
        {data.perCategory.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center gap-3 mb-4 opacity-50">
              <span className="text-[8px] font-black uppercase tracking-[0.3em] whitespace-nowrap text-slate-400">Spending Breakdown</span>
              <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {data.perCategory.map((c) => {
                const used = c.allocated > 0 ? Math.min(1, c.spent / c.allocated) : 0;
                return (
                  <div key={c.category} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-transparent hover:border-indigo-500/20 transition-all">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-tight text-slate-600 dark:text-slate-400 truncate pr-2">{c.category}</span>
                      <span className={`text-[9px] font-bold ${used > 0.9 ? 'text-red-500' : 'text-indigo-500'}`}>{Math.round(used * 100)}%</span>
                    </div>
                    <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-1">
                      <div
                        className={`h-full transition-all duration-700 ${used > 0.9 ? 'bg-red-400' : 'bg-indigo-500'}`}
                        style={{ width: `${used * 100}%` }}
                      />
                    </div>
                    <p className="text-[8px] font-bold text-slate-400 tracking-tight">₱{c.spent.toLocaleString()} spent</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-950 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-widest">Adjust Budget</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"><X size={18} /></button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <BudgetSettings initial={{ month }} onClose={() => { setShowModal(false); fetchStatus(); }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}