'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Notification | null>(null);
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { setMounted(true); }, []);

  async function fetchNotifications() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      const json = await res.json();
      setNotifications(json.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  }

  useEffect(() => {
    fetchNotifications();
    const handler = () => fetchNotifications();
    window.addEventListener('notifications:changed', handler);
    return () => window.removeEventListener('notifications:changed', handler);
  }, []);

  async function markRead(id: string) {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      
      // Update local state
      setNotifications((n) => n.map((item) => (item.id === id ? { ...item, read: true } : item)));
      
      // ✅ TRIGGER NAVBAR UPDATE: This stops the "spam" and forces a clean sync
      window.dispatchEvent(new Event('notifications:changed'));
      
    } catch (err) { 
      console.error(err); 
    }
  }

  const openNotification = (n: Notification) => {
    setSelected(n);
    if (!n.read) markRead(n.id);
  };

  const ModalOverlay = () => {
    if (!selected || !mounted) return null;
    return createPortal(
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={() => setSelected(null)} />
        <div
          ref={modalRef}
          className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-200 border-2 border-gray-100 dark:border-gray-800"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
              {selected.type === 'alert' ? '⚠️' : '🔔'}
            </div>
            <div>
              <h4 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                {selected.title}
              </h4>
              <p className="text-xs text-gray-400 font-bold uppercase mt-1">
                {new Date(selected.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="text-gray-700 dark:text-gray-200 leading-relaxed text-base whitespace-pre-wrap py-6 border-y border-gray-100 dark:border-gray-800">
            {selected.message}
          </div>

          <div className="mt-8">
            <button
              onClick={() => setSelected(null)}
              className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-bold transition-all active:scale-95 shadow-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <style jsx>{`
        .custom-scroll::-webkit-scrollbar { width: 8px; }
        .custom-scroll::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .dark .custom-scroll::-webkit-scrollbar-track { background: #1f2937; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #c7d2fe; border-radius: 10px; border: 2px solid transparent; background-clip: content-box; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #818cf8; }
      `}</style>

      <div className="w-full max-w-md bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden relative">
        {loading && (
          <div className="absolute top-[60px] left-0 right-0 z-10 flex justify-center">
            <div className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
              Syncing Logs...
            </div>
          </div>
        )}

        <div className="p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-black text-gray-900 dark:text-white tracking-tight">System Logs</h3>
          <button 
            onClick={fetchNotifications} 
            disabled={loading}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors group"
          >
            <svg 
              className={`w-5 h-5 text-indigo-600 ${loading ? 'animate-spin' : ''}`} 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <div className={`max-h-[400px] overflow-y-auto custom-scroll p-3 space-y-2 ${loading ? 'opacity-40' : 'opacity-100'}`}>
          {notifications.length === 0 && !loading && (
            <div className="p-10 text-center text-gray-400 font-medium italic">No recent activity.</div>
          )}
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => openNotification(n)}
              className={`p-4 rounded-xl cursor-pointer transition-all border-2
                ${n.read 
                  ? 'bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 opacity-60' 
                  : 'bg-white dark:bg-gray-800 border-indigo-500 shadow-md hover:border-indigo-600'
                }`}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${n.read ? 'font-bold' : 'font-black text-gray-900 dark:text-white'}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">{n.message}</p>
                </div>
                {!n.read && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 mt-1" />}
              </div>
            </div>
          ))}
        </div>
      </div>
      <ModalOverlay />
    </>
  );
}