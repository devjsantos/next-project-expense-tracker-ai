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
  AlertCircle, 
  CalendarClock, 
  CloudOff,
  RefreshCw,
  Plus,
  Tag
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
      <div className="p-12 text-center bg-transparent">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Ledger...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full overflow-hidden bg-transparent">
      
      {/* HEADER */}
      <div className="sticky top-0 z-20 p-5 sm:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800/50 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-slate-900 dark:bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <History className="text-white" size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate">History</h3>
            <p className="text-[8px] sm:text-[10px] font-black text-indigo-500 uppercase tracking-widest truncate">Audit Trail</p>
          </div>
        </div>

        <button
          onClick={() => setIsManageMode(!isManageMode)}
          className={`flex items-center gap-2 px-3 sm:px-5 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
            isManageMode ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          {isManageMode ? <Check size={12} /> : <Edit3 size={12} />}
          <span>{isManageMode ? 'Done' : 'Edit'}</span>
        </button>
      </div>

      <div className="p-3 sm:p-6 max-h-[500px] sm:max-h-[600px] overflow-y-auto custom-scrollbar">
        {/* SECTION: UPCOMING FORECAST */}
        <div className='mb-6 sm:mb-8'>
          <div className="flex items-center gap-2 mb-4 px-1">
            <CalendarClock size={14} className="text-indigo-500" />
            <h4 className='text-[9px] font-black uppercase text-slate-400 tracking-widest'>Predictions</h4>
          </div>
          <UpcomingList onConfirm={fetchRecords} />
        </div>

        {/* LIST VIEW */}
        <div className="px-1 pb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-3 bg-indigo-500 rounded-full"></div>
            <h4 className='text-[9px] font-black uppercase text-slate-400 tracking-widest'>Transactions</h4>
          </div>

          {records.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800">
              <CloudOff className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 font-black text-[9px] uppercase">Empty</p>
            </div>
          ) : (
            <div className="space-y-3">
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
        </div>
      </div>
    </div>
  );
};

export default RecordHistory;

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
    fd.set('text', item.text);
    fd.set('amount', String(item.amount));
    fd.set('category', item.category || 'Other');
    const d = new Date(item.date);
    fd.set('date', `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`);
    try {
      const res = await addExpenseRecord(fd);
      if (!res.error) onConfirm();
    } catch (e) { console.error(e); }
  };

  if (loading) return (
    <div className='p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl animate-pulse flex items-center justify-center'>
      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!items || items.length === 0) return null;

  return (
    <div className='grid grid-cols-1 gap-3'>
      {items.map((it) => (
        <div key={it.id} className='relative flex flex-col p-4 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/50 overflow-hidden'>
          
          {/* TOP RIGHT DATE */}
          <div className="absolute top-3 right-4 text-[7px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-tighter bg-white/50 dark:bg-slate-900/50 px-1.5 py-0.5 rounded-md">
            {new Date(it.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>

          {/* MAIN CONTENT STACK */}
          <div className="mb-4">
            {/* Description (Top) */}
            <div className='font-black text-slate-900 dark:text-white text-xs uppercase tracking-tight leading-tight mb-2 pr-12 truncate'>
              {it.text}
            </div>
            
            {/* Category & Amount (Below) */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 bg-indigo-100/50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-lg shrink-0">
                <Tag size={10} className="text-indigo-600 dark:text-indigo-400" />
                <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">
                  {it.category || 'General'}
                </span>
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white shrink-0">
                ₱{it.amount.toLocaleString()}
              </div>
            </div>
          </div>
          
          {/* ACTIONS */}
          <div className='flex gap-2'>
            <button 
              onClick={() => handleConfirm(it)} 
              className='flex-1 py-2 rounded-xl bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2'
            >
              <Plus size={12} /> Confirm
            </button>
            <button 
              onClick={() => { setItems((prev) => prev.filter(p => p.id !== it.id)); }} 
              className='px-4 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-400 text-[9px] font-black uppercase border border-slate-200 dark:border-slate-700 active:scale-95 transition-all'
            >
              Skip
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}