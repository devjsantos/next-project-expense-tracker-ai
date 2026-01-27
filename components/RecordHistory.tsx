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
  ChevronRight, 
  CloudOff,
  RefreshCw,
  Plus
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
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Ledger...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] flex flex-col overflow-hidden transition-all duration-500 border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none">
      
      {/* HEADER: Glassmorphism Sticky */}
      <div className="sticky top-0 z-20 p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 dark:bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group">
            <History className="text-white group-hover:rotate-[-45deg] transition-transform" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">History</h3>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Full Audit Trail</p>
          </div>
        </div>

        <button
          onClick={() => setIsManageMode(!isManageMode)}
          className={`group flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
            isManageMode
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-indigo-600 hover:text-white'
          }`}
        >
          {isManageMode ? <Check size={14} /> : <Edit3 size={14} />}
          <span>{isManageMode ? 'Save Changes' : 'Manage'}</span>
        </button>
      </div>

      <div className="p-4 sm:p-6 max-h-[600px] overflow-y-auto custom-scrollbar">
        {/* SECTION: UPCOMING FORECAST */}
        <div className='mb-10'>
          <div className="flex items-center gap-2 mb-4 px-2">
            <CalendarClock size={14} className="text-indigo-500" />
            <h4 className='text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]'>Predicted Events</h4>
          </div>
          <UpcomingList onConfirm={fetchRecords} />
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="mb-6 mx-2 bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-800 flex items-center gap-3 text-red-600 dark:text-red-400">
            <AlertCircle size={18} />
            <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
          </div>
        )}

        {/* LIST VIEW */}
        <div className="px-2 pb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
            <h4 className='text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]'>Past Transactions</h4>
          </div>

          {records.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/30 rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
              <CloudOff className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-black text-xs uppercase tracking-widest">No transaction data</p>
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

      {/* BLEND BOTTOM */}
      <div className="h-8 bg-gradient-to-t from-white dark:from-slate-900 to-transparent pointer-events-none absolute bottom-0 w-full" />
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
    <div className='p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] animate-pulse flex items-center justify-center'>
      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!items || items.length === 0) return (
    <div className='p-6 text-center bg-slate-50 dark:bg-slate-800/20 rounded-[2rem] border border-slate-100 dark:border-slate-800'>
      <p className='text-[10px] font-black text-slate-400 uppercase tracking-widest'>All caught up</p>
    </div>
  );

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
      {items.map((it) => (
        <div key={it.id} className='group flex flex-col p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100/50 dark:border-indigo-900/30 hover:bg-white dark:hover:bg-slate-800 transition-all'>
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className='font-black text-slate-900 dark:text-white text-xs uppercase tracking-tight'>{it.text}</div>
              <div className='text-[10px] font-bold text-indigo-500 uppercase mt-0.5'>Due {new Date(it.date).toLocaleDateString()}</div>
            </div>
            <div className="text-sm font-black text-slate-900 dark:text-white">₱{it.amount}</div>
          </div>
          
          <div className='flex gap-2 mt-auto'>
            <button 
              onClick={() => handleConfirm(it)} 
              className='flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all'
            >
              <Plus size={12} /> Confirm
            </button>
            <button 
              onClick={() => { setItems((prev) => prev.filter(p => p.id !== it.id)); }} 
              className='px-3 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-400 text-[9px] font-black uppercase border border-slate-100 dark:border-slate-700 hover:text-red-500 transition-all'
            >
              Skip
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}