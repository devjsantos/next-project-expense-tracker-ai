'use client';

import { useEffect, useState, useCallback } from 'react';
import { getRecords } from '@/app/actions/getRecords';
import RecordItem from './RecordItem';
import { Record } from '@/types/Record';
import getForecast from '@/app/actions/getForecast';
import addExpenseRecord from '@/app/actions/addExpenseRecord';
import {
  History,
  Edit3,
  Check,
  CalendarClock,
  CloudOff,
  RefreshCw,
  Plus,
  Tag,
  ArrowUpRight,
  TrendingDown,
  Sparkles
} from 'lucide-react';

const RecordHistory = () => {
  const [records, setRecords] = useState<Record[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isManageMode, setIsManageMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const { records: data, error: err } = await getRecords();
      if (err) setError(err);
      else {
        setRecords(data || []);
        setError(undefined);
      }
    } catch (e) {
      setError('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
    window.addEventListener('records:changed', fetchRecords);
    return () => window.removeEventListener('records:changed', fetchRecords);
  }, [fetchRecords]);

  if (loading) {
    return (
      <div className="p-20 text-center animate-pulse">
        <div className="relative w-12 h-12 mx-auto mb-6">
           <div className="absolute inset-0 border-4 border-indigo-500/10 rounded-xl"></div>
           <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin p-2" />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Syncing Ledger</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-transparent overflow-hidden">
      
      {/* PERSISTENT HEADER */}
      <div className="sticky top-0 z-30 px-6 py-5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-900 dark:bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <History className="text-white" size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">Activity</h3>
            <div className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Sync</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsManageMode(!isManageMode)}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
            isManageMode 
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          {isManageMode ? 'Save' : 'Edit'}
        </button>
      </div>

      <div className="p-6 custom-scrollbar space-y-10">
        
        {/* PREDICTIONS SECTION */}
        <section className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-5 px-1">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-500" />
              <h4 className='text-[10px] font-black uppercase text-slate-900 dark:text-white tracking-widest'>AI Predictions</h4>
            </div>
            <span className="text-[8px] font-bold text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">Experimental</span>
          </div>
          <UpcomingList onConfirm={fetchRecords} />
        </section>

        {/* RECENT TRANSACTIONS SECTION */}
        <section className="animate-in slide-in-from-bottom-6 duration-700">
          <div className="flex items-center gap-2 mb-5 px-1">
            <TrendingDown size={14} className="text-slate-400" />
            <h4 className='text-[10px] font-black uppercase text-slate-900 dark:text-white tracking-widest'>Transactions</h4>
          </div>

          {records.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/20 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
              <CloudOff className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">No Records Found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <RecordItem
                  key={record.id}
                  record={record}
                  isManageMode={isManageMode}
                  onRefresh={fetchRecords}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

/* --- SUB-COMPONENT: UPCOMING LIST --- */

function UpcomingList({ onConfirm }: { onConfirm: () => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res: any = await getForecast();
        if (!mounted) return;
        setItems(res.upcomingList || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const handleConfirm = async (item: any) => {
    const fd = new FormData();
    fd.set('text', item.text || 'Predicted Expense');
    fd.set('amount', String(item.amount || 0));
    fd.set('category', item.category || 'Other');
    
    const d = item.date ? new Date(item.date) : new Date();
    fd.set('date', `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`);
    
    try {
      const res = await addExpenseRecord(fd);
      if (!res.error) onConfirm();
    } catch (e) { console.error(e); }
  };

  if (loading) return (
    <div className='p-8 bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] flex flex-col items-center justify-center gap-3'>
      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Analyzing Patterns...</span>
    </div>
  );

  if (!items || items.length === 0) return null;

  return (
    <div className='flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x'>
      {items.map((it) => (
        <div key={it.id} className='snap-center min-w-[260px] relative flex flex-col p-5 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden group hover:border-indigo-500 transition-all'>
          
          <div className="flex justify-between items-start mb-4">
            <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <CalendarClock size={16} />
            </div>
            <div className="text-[9px] font-black uppercase text-slate-400 tracking-tighter bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg">
              {it.date ? new Date(it.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Next Cycle'}
            </div>
          </div>

          <div className="mb-6">
            <p className='font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight line-clamp-1 mb-1'>
              {it.text}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">₱{Number(it.amount).toLocaleString()}</span>
              <span className="text-[18px] text-slate-200 dark:text-slate-700 font-thin">|</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{it.category}</span>
            </div>
          </div>

          <div className='flex gap-2 mt-auto'>
            <button
              onClick={() => handleConfirm(it)}
              className='flex-[2] py-3 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2'
            >
              Confirm
            </button>
            <button
              onClick={() => setItems((prev) => prev.filter(p => p.id !== it.id))}
              className='flex-1 py-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-400 text-[9px] font-black uppercase active:scale-95 transition-all'
            >
              Skip
            </button>
          </div>

          <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-10 transition-opacity">
            <ArrowUpRight size={60} className="text-indigo-500" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default RecordHistory;