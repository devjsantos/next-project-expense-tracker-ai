'use client';

import { useEffect, useState } from 'react';
import { getRecords } from '@/app/actions/getRecords';
import RecordItem from './RecordItem';
import { Record } from '@/types/Record';

const RecordHistory = () => {
  const [records, setRecords] = useState<Record[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isManageMode, setIsManageMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    setLoading(true);
    const { records: data, error: err } = await getRecords();
    if (err) setError(err);
    if (data) setRecords(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRecords();
    // Listen for changes from the AddRecord component
    window.addEventListener('records:changed', fetchRecords);
    return () => window.removeEventListener('records:changed', fetchRecords);
  }, []);

  if (loading) return <div className="p-10 text-center animate-pulse">Loading History...</div>;

  return (
    <div className='bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 transition-all'>
      {/* HEADER SECTION */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20'>
            <span className='text-white'>📜</span>
          </div>
          <div>
            <h3 className='text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight'>
              Timeline
            </h3>
            <p className='text-[10px] font-black text-gray-400 uppercase tracking-widest'>
              Recent Transactions
            </p>
          </div>
        </div>

        {/* MANAGE TOGGLE */}
        <button 
          onClick={() => setIsManageMode(!isManageMode)}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            isManageMode 
            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-indigo-50 hover:text-indigo-600'
          }`}
        >
          {isManageMode ? 'Done Editing' : 'Edit History'}
        </button>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className='bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border-l-4 border-red-500 text-red-700 dark:text-red-400 text-xs font-bold'>
          ⚠️ {error}
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && records.length === 0 && (
        <div className='text-center py-12 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl'>
          <span className='text-4xl block mb-4'>☁️</span>
          <p className='text-gray-400 font-bold text-sm uppercase tracking-tighter'>No records yet</p>
        </div>
      )}

      {/* LIST VIEW */}
      <div className='space-y-2'>
        {records.map((record: Record) => (
          <RecordItem 
            key={record.id} 
            record={record} 
            isManageMode={isManageMode} 
            onRefresh={fetchRecords}
          />
        ))}
      </div>
    </div>
  );
};

export default RecordHistory;