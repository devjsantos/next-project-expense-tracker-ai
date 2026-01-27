'use client';

import { useEffect, useState, useCallback } from 'react';
import { getRecords } from '@/app/actions/getRecords';
import RecordItem from './RecordItem';
import { Record } from '@/types/Record';

const RecordHistory = () => {
  const [records, setRecords] = useState<Record[]>([]);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isManageMode, setIsManageMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const { records: data, error: err } = await getRecords();
      if (err) {
        setError(err);
      } else {
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
      <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-xl border border-gray-200 dark:border-gray-800 text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Syncing Timeline...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden transition-all">
      
      {/* HEADER SECTION - Now Sticky with Glass effect */}
      <div className="sticky top-0 z-10 p-4 sm:p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md flex items-center justify-between border-b border-gray-50 dark:border-gray-800">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white text-sm sm:text-base">📜</span>
          </div>
          <div>
            <h3 className="text-sm sm:text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none mb-1">Timeline</h3>
            <p className="hidden sm:block text-[10px] font-black text-gray-400 uppercase tracking-widest">Recent Transactions</p>
          </div>
        </div>

        <button
          onClick={() => setIsManageMode(!isManageMode)}
          className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
            isManageMode
              ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white'
          }`}
        >
          <span className="text-xs">{isManageMode ? '✅' : '✏️'}</span>
          <span className="hidden xs:inline">{isManageMode ? 'Done' : 'Edit History'}</span>
        </button>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="m-4 bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border-l-4 border-red-500 text-red-700 dark:text-red-400 text-xs font-bold">
          ⚠️ {error}
        </div>
      )}

      {/* LIST VIEW - Added Scroll Area */}
      <div className="p-2 sm:p-4 max-h-[500px] overflow-y-auto custom-scrollbar">
        {records.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl m-2">
            <span className="text-4xl block mb-4">☁️</span>
            <p className="text-gray-400 font-bold text-sm uppercase tracking-tighter">No records yet</p>
          </div>
        ) : (
          <div className="space-y-2">
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

      {/* BOTTOM FADE - Visual indicator that there is more to scroll */}
      <div className="h-4 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />

      {/* Tailwind Custom Scrollbar Logic (Add this to your globals.css or keep as is) */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
        }
      `}</style>
    </div>
  );
};

export default RecordHistory;