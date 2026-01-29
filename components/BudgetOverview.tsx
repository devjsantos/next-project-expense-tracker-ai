"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import BudgetSettings from "./BudgetSettings";
import {
  Download,
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
  const modalRef = useRef<HTMLDivElement | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const q = month ? `?month=${encodeURIComponent(month)}` : "";
      const res = await fetch(`/api/budget/status${q}`);
      if (!res.ok) throw new Error("Fetch failed");
      setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // Global Event Listeners
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
    try {
      const q = month ? `?month=${encodeURIComponent(month)}` : "";
      const res = await fetch(`/api/budget/export${q}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SJP-Analytics-${month || 'current'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert("Export failed."); }
  };

  if (loading) return (
    <div className="p-12 bg-white dark:bg-slate-950 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center space-y-4">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Syncing Neural Data...</p>
    </div>
  );

  if (!data) return null;

  const percent = data.percentUsed ?? 0;
  const isOver = percent > 0.9;

  return (
    <div className="bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-indigo-500/5 overflow-hidden">

      {/* 1. Header Section */}
      <div className="p-8 pb-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Calendar size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tighter uppercase dark:text-white">Budget Protocol</h3>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
              {data.monthStart ? new Date(data.monthStart + "-01").toLocaleString('default', { month: 'long', year: 'numeric' }) : "System Idle"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-indigo-500 rounded-xl transition-colors border border-slate-100 dark:border-slate-700">
            <Download size={18} />
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
            <Settings2 size={14} /> Configure
          </button>
        </div>
      </div>

      {/* 2. Primary Metrics Hub */}
      <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Expenditure Progress Ring-style UI */}
        <div className="md:col-span-2 p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Current Utilization</p>
              <h4 className={`text-4xl font-black tracking-tighter ${isOver ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                {Math.round(percent * 100)}%
              </h4>
            </div>
            <div className={`p-2 rounded-lg ${isOver ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
              <Activity size={20} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-out ${isOver ? 'bg-red-500' : 'bg-indigo-500'}`}
                style={{ width: `${Math.min(percent * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span>Spent: ₱{data.totalSpent.toLocaleString()}</span>
              <span>Limit: ₱{data.budget?.monthlyTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 gap-4">
          {[
            {
              label: 'Liquidity Left',
              // Add (data.remaining || 0)
              val: `₱${(data.remaining || 0).toLocaleString()}`,
              icon: <Wallet size={14} />,
              color: 'text-emerald-500'
            },
            {
              label: 'Burn Rate / Day',
              // Add (data.dailyAverage || 0)
              val: `₱${(data.dailyAverage || 0).toFixed(0)}`,
              icon: <ArrowUpRight size={14} />,
              color: 'text-indigo-500'
            },
            {
              label: 'Cycle Days Left',
              // Add fallback for daysLeft too just in case
              val: data.daysLeft ?? 0,
              icon: <Timer size={14} />,
              color: 'text-amber-500'
            }
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <p className="font-bold text-slate-900 dark:text-white">{stat.val}</p>
              </div>
              <div className={`${stat.color} opacity-80`}>{stat.icon}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Neural Category Matrix */}
      {data.perCategory.length > 0 && (
        <div className="px-8 pb-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Category Matrix</span>
            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.perCategory.map((c) => {
              const used = c.allocated > 0 ? Math.min(1, c.spent / c.allocated) : 0;
              return (
                <div key={c.category} className="group p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-transparent hover:border-indigo-500/30 transition-all">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">{c.category}</span>
                    <ChevronRight size={12} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-bold text-slate-500">₱{c.spent.toLocaleString()}</span>
                    <span className="text-[9px] font-black text-slate-400">Target: ₱{c.allocated.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ${used > 0.9 ? 'bg-red-400' : 'bg-indigo-500'}`}
                      style={{ width: `${used * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Configuration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40 animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-950 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-3xl overflow-hidden" ref={modalRef}>
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="text-xl font-black uppercase tracking-tighter italic">System Config</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <BudgetSettings initial={{ month }} onClose={() => { setShowModal(false); fetchStatus(); }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}