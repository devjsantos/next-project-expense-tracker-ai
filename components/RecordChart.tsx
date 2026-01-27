import { getRecords } from '@/app/actions/getRecords';
import BarChart from './BarChart';
import { BarChart3, AlertCircle, TrendingUp, Inbox } from 'lucide-react';

const RecordChart = async () => {
  const { records, error } = await getRecords();

  // ERROR STATE
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 rounded-[2rem] flex items-center justify-center mb-4 border border-red-100 dark:border-red-900/50">
          <AlertCircle className="text-red-500" size={32} />
        </div>
        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1">
          Analytics Unavailable
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px] leading-relaxed">
          {error || "We couldn't sync your transaction flow."}
        </p>
      </div>
    );
  }

  // EMPTY STATE
  if (!records || records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] flex items-center justify-center border border-slate-100 dark:border-slate-700/50">
            <Inbox className="text-slate-300 dark:text-slate-600" size={40} />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-lg">
            <TrendingUp size={14} className="text-white" />
          </div>
        </div>
        <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">
          Chart is hungry
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[240px] leading-relaxed font-medium">
          Feed your dashboard some data! Your spending patterns will appear here once you log your first record.
        </p>
      </div>
    );
  }

  // SUCCESS STATE (The Chart itself)
  return (
    <div className="w-full h-full animate-in fade-in duration-700">
      {/* Chart Wrapper to handle overflow on mobile */}
      <div className="min-h-[300px] w-full touch-pan-x overflow-x-auto custom-scrollbar">
        <BarChart
          records={records.map((record) => ({
            ...record,
            date: String(record.date),
          }))}
        />
      </div>

      {/* Subtle Legend/Footer for the Chart */}
      <div className="mt-6 flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expenses</span>
          </div>
          <div className="flex items-center gap-1.5 opacity-40">
            <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Budget</span>
          </div>
        </div>
        <p className="text-[9px] font-black uppercase text-indigo-500/80 tracking-tighter">Real-time Sync</p>
      </div>
    </div>
  );
};

export default RecordChart;