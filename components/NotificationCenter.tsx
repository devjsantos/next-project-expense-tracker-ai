'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, ShieldAlert, Info, CheckCircle, RefreshCw } from 'lucide-react';

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

// Added interface to fix the TypeScript error
interface NotificationCenterProps {
  unreadCount?: number;
}

export default function NotificationCenter({ unreadCount = 0 }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Notification | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Controls the dropdown

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
      setTimeout(() => setLoading(false), 500);
    }
  }

  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen]);

  useEffect(() => {
    window.addEventListener('notifications:changed', fetchNotifications);
    return () => window.removeEventListener('notifications:changed', fetchNotifications);
  }, []);

  async function markRead(id: string) {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      setNotifications((n) => n.map((item) => (item.id === id ? { ...item, read: true } : item)));
      window.dispatchEvent(new Event('notifications:changed'));
    } catch (err) { console.error(err); }
  }

  const openNotification = (n: Notification) => {
    setSelected(n);
    if (!n.read) markRead(n.id);
  };

  const ModalOverlay = () => {
    if (!selected || !mounted) return null;
    return createPortal(
      <div className="fixed inset-0 z-[10001] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md">
        <div className="absolute inset-0" onClick={() => setSelected(null)} />
        <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-10 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
          <div className="flex items-center gap-5 mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
              {selected.type === 'alert' ? <ShieldAlert size={32} /> : <Bell size={32} />}
            </div>
            <div className="flex-1">
              <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-tight">{selected.title}</h4>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                {new Date(selected.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed mb-10 pb-10 border-b border-slate-100 dark:border-slate-800">
            {selected.message}
          </div>
          <button onClick={() => setSelected(null)} className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl">
            Acknowledge
          </button>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="relative">
      {/* The Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-indigo-500 hover:text-white transition-all"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950 animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* The Dropdown Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-4 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2">
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                <Info size={18} className="text-indigo-500" /> System Logs
              </h3>
              <button onClick={fetchNotifications} disabled={loading} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all">
                <RefreshCw size={18} className={`${loading ? 'animate-spin' : ''} text-indigo-500`} />
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-4 space-y-3 custom-scroll">
              {notifications.length === 0 && !loading ? (
                <div className="p-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">No Logs Found</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => openNotification(n)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all border-2 group ${n.read
                      ? 'bg-slate-50/50 dark:bg-slate-900/50 border-transparent opacity-50'
                      : 'bg-white dark:bg-slate-800 border-indigo-500/20 shadow-lg shadow-indigo-500/5 hover:border-indigo-500'
                      }`}
                  >
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.read ? 'bg-slate-200 dark:bg-slate-700 text-slate-400' : 'bg-indigo-600 text-white'
                        }`}>
                        {n.type === 'alert' ? <ShieldAlert size={18} /> : <CheckCircle size={18} />}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-sm truncate font-black tracking-tight ${n.read ? 'text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                            {n.title}
                          </p>
                          {!n.read && <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{n.message}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
      <ModalOverlay />
    </div>
  );
}