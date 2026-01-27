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
  CalendarDays
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
      <div className='bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800/50 overflow-hidden'>
        {/* Header */}
        <div className='flex items-center gap-4 mb-8'>
          <div className='w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white'>
            <BarChart3 size={24} />
          </div>
          <div>
            <h3 className='text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter'>
              Insights
            </h3>
            <p className='text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]'>
              Real-time Analytics
            </p>
          </div>
        </div>

        <div className='space-y-4'>
          {/* Safe-to-Spend Card */}
          <div className='bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] p-5 border border-slate-100 dark:border-slate-700/50'>
            <div className='flex items-center gap-2 mb-3'>
              <Zap size={14} className="text-amber-500 fill-amber-500" />
              <p className='text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest'>Safe-to-Spend</p>
            </div>
            
            <div className='flex items-baseline justify-between gap-3'>
              <div className='text-3xl font-black text-slate-900 dark:text-white'>
                ₱{(safeToSpend ?? (monthlyTotal - totalSpent)).toFixed(2)}
              </div>
              <div className='text-[10px] font-black text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg'>
                Left: ₱{(remainingBudget ?? 0).toFixed(2)}
              </div>
            </div>

            {/* Progress Bar */}
            <div className='mt-5'>
              <div className='w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden relative'>
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
                  <span className='text-[9px] font-black text-slate-400 uppercase tracking-tighter'>Spent</span>
                  <span className='text-xs font-bold text-slate-700 dark:text-slate-300'>₱{(totalSpent ?? 0).toFixed(0)}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className='text-[9px] font-black text-slate-400 uppercase tracking-tighter'>Committed</span>
                  <span className='text-xs font-bold text-slate-700 dark:text-slate-300'>₱{(upcomingRecurringTotal ?? 0).toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Average Daily Spending */}
          <div className='bg-slate-900 dark:bg-indigo-600 rounded-[2rem] p-6 text-center relative overflow-hidden group'>
            <Activity size={80} className="absolute -right-4 -bottom-4 text-white/5 group-hover:scale-110 transition-transform" />
            <p className='text-[10px] font-black text-indigo-200/60 uppercase tracking-[0.2em] mb-2'>
              Daily Burn Rate
            </p>
            <div className='text-3xl font-black text-white mb-3'>
              ₱{averageExpense.toFixed(2)}
            </div>
            <div className='inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest'>
              <CalendarDays size={12} />
              Across {validDays} Active Days
            </div>
          </div>

          {/* Range Grid */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='bg-slate-50 dark:bg-slate-800/40 p-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-700/50'>
              <div className='flex items-center gap-2 mb-2'>
                <div className='w-6 h-6 bg-rose-500/10 rounded-lg flex items-center justify-center text-rose-500'>
                  <TrendingUp size={14} />
                </div>
                <span className='text-[9px] font-black text-slate-400 uppercase tracking-widest'>Peak</span>
              </div>
              <p className='text-lg font-black text-slate-900 dark:text-white'>
                {bestExpense !== undefined ? `₱${bestExpense}` : '—'}
              </p>
            </div>

            <div className='bg-slate-50 dark:bg-slate-800/40 p-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-700/50'>
              <div className='flex items-center gap-2 mb-2'>
                <div className='w-6 h-6 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500'>
                  <TrendingDown size={14} />
                </div>
                <span className='text-[9px] font-black text-slate-400 uppercase tracking-widest'>Floor</span>
              </div>
              <p className='text-lg font-black text-slate-900 dark:text-white'>
                {worstExpense !== undefined ? `₱${worstExpense}` : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className='bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-rose-100 dark:border-rose-900/30'>
        <div className='flex flex-col items-center text-center gap-4'>
          <div className='w-14 h-14 bg-rose-100 dark:bg-rose-900/40 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400'>
            <AlertCircle size={32} />
          </div>
          <div>
            <h3 className='text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight'>
              Stats Unavailable
            </h3>
            <p className='text-xs font-bold text-slate-400 uppercase tracking-widest mt-1'>
              Check connection
            </p>
          </div>
        </div>
      </div>
    );
  }
};

export default ExpenseStats;