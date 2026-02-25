'use client';

import React from 'react';
import {
  BarChart3, TrendingUp, TrendingDown,
  AlertCircle, Zap, Activity, CalendarDays,
  ArrowUpRight, Target
} from 'lucide-react';

interface ExpenseStatsProps {
  userRecordResult?: { record?: number; daysWithRecords?: number };
  rangeResult?: { bestExpense?: number; worstExpense?: number };
  forecast?: {
    safeToSpend?: number;
    remainingBudget?: number;
    upcomingRecurringTotal?: number;
    monthlyTotal?: number;
    totalSpent?: number;
  };
}

const ExpenseStats = ({
  userRecordResult = {},
  rangeResult = {},
  forecast = {}
}: ExpenseStatsProps) => {
  const { record = 0, daysWithRecords = 1 } = userRecordResult;
  const { bestExpense = 0, worstExpense = 0 } = rangeResult;
  const {
    safeToSpend = 0,
    upcomingRecurringTotal = 0,
    monthlyTotal = 0,
    totalSpent = 0
  } = forecast;

  const validDays = daysWithRecords > 0 ? daysWithRecords : 1;
  const averageExpense = record / validDays;

  const totalCommitted = totalSpent + upcomingRecurringTotal;
  const isOverBudget = totalCommitted > monthlyTotal && monthlyTotal > 0;

  const spentPercent = monthlyTotal > 0 ? (totalSpent / monthlyTotal) * 100 : 0;
  const billsPercent = monthlyTotal > 0 ? (upcomingRecurringTotal / monthlyTotal) * 100 : 0;
  const utilization = Math.min(spentPercent + billsPercent, 100);

  return (
    <div className='bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-[2.5rem] shadow-2xl border border-slate-200/60 dark:border-slate-800/50'>

      <div className='flex items-center justify-between mb-8'>
        <div className='flex items-center gap-4'>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${isOverBudget ? 'bg-rose-500 shadow-rose-500/30' : 'bg-indigo-600 shadow-indigo-500/20'} text-white`}>
            {isOverBudget ? <AlertCircle size={24} className="animate-pulse" /> : <BarChart3 size={24} />}
          </div>
          <div>
            <h3 className='text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter'>Summary</h3>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isOverBudget ? 'text-rose-500' : 'text-indigo-500'}`}>
              {monthlyTotal === 0 ? 'Set a Budget' : isOverBudget ? 'Over Budget Limit' : 'On Track'}
            </p>
          </div>
        </div>

        {monthlyTotal > 0 && (
          <div className={`text-[9px] font-black px-3 py-1.5 rounded-full border uppercase tracking-widest ${isOverBudget ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
            {utilization.toFixed(0)}% Used
          </div>
        )}
      </div>

      <div className='space-y-6'>
        <div className={`relative overflow-hidden rounded-[2.2rem] p-6 border transition-all duration-500 ${isOverBudget ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30' : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-700/50'}`}>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-2'>
              <Zap size={14} className={isOverBudget ? "text-rose-500" : "text-amber-500 fill-amber-500"} />
              <p className='text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest'>Safe to Spend Today</p>
            </div>
            {isOverBudget && <span className='text-[8px] font-black text-rose-500 uppercase bg-rose-100 dark:bg-rose-500/20 px-2 py-0.5 rounded'>Deficit</span>}
          </div>

          <div className='flex items-baseline justify-between gap-3 relative z-10'>
            <div className={`text-4xl font-black tracking-tight ${isOverBudget ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
              ₱{Math.max(0, safeToSpend).toLocaleString()}
            </div>
            <div className='flex flex-col items-end'>
              <span className='text-[9px] font-black text-slate-400 uppercase'>Monthly Target</span>
              <span className='text-xs font-black text-slate-700 dark:text-slate-300'>₱{monthlyTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className='mt-8'>
            <div className='w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-3 overflow-hidden flex'>
              <div
                className={`h-full transition-all duration-1000 ${isOverBudget ? 'bg-rose-500' : 'bg-indigo-500'}`}
                style={{ width: `${Math.min(spentPercent, 100)}%` }}
              />
              <div
                className='h-full bg-slate-400/40 dark:bg-slate-500/40 transition-all duration-1000'
                style={{ width: `${Math.min(billsPercent, 100 - spentPercent)}%` }}
              />
            </div>

            <div className='grid grid-cols-2 mt-4 gap-4'>
              <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-700">
                <span className='block text-[8px] font-black text-slate-400 uppercase mb-1'>Already Spent</span>
                <span className='text-xs font-black dark:text-white'>₱{totalSpent.toLocaleString()}</span>
              </div>
              <div className="bg-white/50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-700 text-right">
                <span className='block text-[8px] font-black text-slate-400 uppercase mb-1'>Future Bills</span>
                <span className={`text-xs font-black ${upcomingRecurringTotal > (monthlyTotal - totalSpent) ? 'text-rose-500' : 'dark:text-white'}`}>
                  ₱{upcomingRecurringTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-slate-900 dark:bg-indigo-600 rounded-[2.2rem] p-7 text-center relative overflow-hidden group shadow-xl transition-transform hover:scale-[1.01]'>
          <Activity size={100} className="absolute -right-6 -bottom-8 text-white/5 group-hover:scale-110 group-hover:text-white/10 transition-all duration-700" />
          <p className='text-[10px] font-black text-indigo-200/60 uppercase tracking-[0.2em] mb-2'>Burn Rate (Daily Average)</p>
          <div className='text-4xl font-black text-white mb-5 tracking-tight'>
            ₱{averageExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className='inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/20'>
            <CalendarDays size={14} className="text-indigo-200" />
            Active across {validDays} Days
          </div>
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div className='bg-white dark:bg-slate-800/40 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-700/50 shadow-sm'>
            <div className='flex items-center gap-2 mb-3'>
              <div className='w-8 h-8 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500 border border-rose-500/10'>
                <ArrowUpRight size={16} />
              </div>
              <span className='text-[9px] font-black text-slate-400 uppercase tracking-widest'>Peak Spend</span>
            </div>
            <p className='text-xl font-black text-slate-900 dark:text-white'>
              ₱{bestExpense.toLocaleString()}
            </p>
          </div>

          <div className='bg-white dark:bg-slate-800/40 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-700/50 shadow-sm'>
            <div className='flex items-center gap-2 mb-3'>
              <div className='w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/10'>
                <Target size={16} />
              </div>
              <span className='text-[9px] font-black text-slate-400 uppercase tracking-widest'>Lowest Spend</span>
            </div>
            <p className='text-xl font-black text-slate-900 dark:text-white'>
              ₱{worstExpense.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseStats;