import { getRecords } from '@/actions/getRecords';
import BarChart from './BarChart';
import { AlertCircle, TrendingUp, Inbox, Sparkles } from 'lucide-react';

const RecordChart = async () => {
  const { records, error } = await getRecords();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/20 rounded-[2rem] flex items-center justify-center mb-4 border border-rose-100 dark:border-rose-900/30">
          <AlertCircle className="text-rose-500" size={32} />
        </div>
        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1">
          Sync Paused
        </h4>
        <p className="text-[10px] font-bold text-slate-400 max-w-[200px] leading-relaxed uppercase">
          {error || "We couldn't reach the server."}
        </p>
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] flex items-center justify-center border border-slate-100 dark:border-slate-800">
            <Inbox className="text-slate-300 dark:text-slate-600" size={40} />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-lg">
            <Sparkles size={14} className="text-white" />
          </div>
        </div>
        <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">
          Waiting for Data
        </h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[240px] leading-relaxed font-bold uppercase">
          Add your first expense to see your spending patterns come to life!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full animate-in fade-in duration-700">
      <div className="min-h-[300px] w-full touch-pan-x overflow-x-auto custom-scrollbar">
        <BarChart
          records={records.map((record) => ({
            ...record,
            date: String(record.date),
          }))}
        />
      </div>

      <div className="mt-8 flex items-center justify-between px-2 py-3 border-t border-slate-50 dark:border-slate-800/60">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Spending Flow</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-indigo-500">
            <TrendingUp size={12} />
            <p className="text-[9px] font-black uppercase tracking-tighter">Live Insight</p>
        </div>
      </div>
    </div>
  );
};

export default RecordChart;