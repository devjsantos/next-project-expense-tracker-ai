import React from 'react';
import getUserRecord from '@/app/actions/getUserRecord';
import getBestWorstExpense from '@/app/actions/getBestWorstExpense';
import getForecast from '@/app/actions/getForecast';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Zap, 
  Activity,
  CalendarDays,
  Wallet
} from 'lucide-react';

const ExpenseStats = async () => {
  try {
    const [userRecordResult, rangeResult, forecast] = await Promise.all([
      getUserRecord(),
      getBestWorstExpense(),
      getForecast(),
    ]);

    const { record, daysWithRecords } = userRecordResult;
    const { bestExpense, worstExpense } = rangeResult;
    const { safeToSpend, remainingBudget, upcomingRecurringTotal, monthlyTotal, totalSpent } = forecast as any;

    const validRecord = record || 0;
    const validDays = daysWithRecords && daysWithRecords > 0 ? daysWithRecords : 1;
    const averageExpense = validRecord / validDays;

    return (
      <div className='bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-[2.5rem] shadow-xl border border-slate-200/60 dark:border-slate-800/50 overflow-hidden'>
        
        {/* GLASS HEADER */}
        <div className='flex items-center gap-4 mb-8 p-1'>
          <div className='w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white'>
            <BarChart3 size={24} />
          </div>
          <div>
            <h3 className='text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter'>
              Spending Summary
            </h3>
            <p className='text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]'>
              Your Financial Health
            </p>
          </div>
        </div>

        <div className='space-y-5'>
          {/* Safe-to-Spend Card */}
          <div className='bg-slate-50/50 dark:bg-slate-800/40 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-700/50'>
            <div className='flex items-center gap-2 mb-4'>
              <Zap size={14} className="text-amber-500 fill-amber-500" />
              <p className='text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest'>Safe to Spend Today</p>
            </div>
            
            <div className='flex items-baseline justify-between gap-3'>
              <div className='text-3xl font-black text-slate-900 dark:text-white tracking-tight'>
                ₱{(safeToSpend ?? (monthlyTotal - totalSpent)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className='text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-500/20'>
                Left: ₱{(remainingBudget ?? 0).toLocaleString()}
              </div>
            </div>

            {/* Progress Bar Container */}
            <div className='mt-6'>
              <div className='w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden relative'>
                {/* Total Spent Bar */}
                <div 
                  className='h-full bg-indigo-500 rounded-full transition-all duration-1000' 
                  style={{ width: `${Math.min(((totalSpent || 0) / (monthlyTotal || 1)) * 100, 100)}%` }} 
                />
                {/* Committed/Recurring Overlay */}
                <div 
                  className='h-full bg-slate-400/30 absolute left-0 top-0 transition-all duration-1000' 
                  style={{ width: `${Math.min(((upcomingRecurringTotal || 0) / (monthlyTotal || 1)) * 100, 100)}%` }} 
                />
              </div>
              <div className='flex justify-between mt-3'>
                <div className="flex flex-col">
                  <span className='text-[9px] font-black text-slate-400 uppercase tracking-tight'>Already Spent</span>
                  <span className='text-xs font-black text-slate-800 dark:text-slate-200'>₱{(totalSpent ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className='text-[9px] font-black text-slate-400 uppercase tracking-tight'>Monthly Bills</span>
                  <span className='text-xs font-black text-slate-800 dark:text-slate-200'>₱{(upcomingRecurringTotal ?? 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Average Daily Spending */}
          <div className='bg-slate-900 dark:bg-indigo-600 rounded-[2.2rem] p-7 text-center relative overflow-hidden group shadow-lg'>
            <Activity size={90} className="absolute -right-4 -bottom-6 text-white/5 group-hover:scale-110 transition-transform duration-500" />
            <p className='text-[10px] font-black text-indigo-200/60 uppercase tracking-[0.2em] mb-2'>
              Average Daily Spend
            </p>
            <div className='text-4xl font-black text-white mb-4 tracking-tight'>
              ₱{averageExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className='inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10'>
              <CalendarDays size={12} />
              Based on {validDays} days
            </div>
          </div>

          {/* Range Grid */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='bg-white dark:bg-slate-800/40 p-4 rounded-[1.8rem] border border-slate-100 dark:border-slate-700/50 shadow-sm'>
              <div className='flex items-center gap-2 mb-2'>
                <div className='w-7 h-7 bg-rose-500/10 rounded-lg flex items-center justify-center text-rose-500 border border-rose-500/10'>
                  <TrendingUp size={14} />
                </div>
                <span className='text-[9px] font-black text-slate-400 uppercase tracking-widest'>Highest</span>
              </div>
              <p className='text-lg font-black text-slate-900 dark:text-white tracking-tight'>
                {bestExpense !== undefined ? `₱${bestExpense.toLocaleString()}` : '—'}
              </p>
            </div>

            <div className='bg-white dark:bg-slate-800/40 p-4 rounded-[1.8rem] border border-slate-100 dark:border-slate-700/50 shadow-sm'>
              <div className='flex items-center gap-2 mb-2'>
                <div className='w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 border border-emerald-500/10'>
                  <TrendingDown size={14} />
                </div>
                <span className='text-[9px] font-black text-slate-400 uppercase tracking-widest'>Lowest</span>
              </div>
              <p className='text-lg font-black text-slate-900 dark:text-white tracking-tight'>
                {worstExpense !== undefined ? `₱${worstExpense.toLocaleString()}` : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className='bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-rose-100 dark:border-rose-900/30 text-center shadow-xl'>
        <div className='w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-500 mx-auto mb-4'>
          <AlertCircle size={32} />
        </div>
        <h3 className='text-sm font-black text-slate-900 dark:text-white uppercase'>Unable to load stats</h3>
        <p className='text-[10px] font-bold text-slate-400 uppercase mt-2'>Please try refreshing the page</p>
      </div>
    );
  }
};

export default ExpenseStats;