'use client';

import { useEffect, useState, useRef } from 'react';

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
  const modalRef = useRef<HTMLDivElement | null>(null);

  /* ----------------------------------
   * Fetch notifications
   * ---------------------------------- */
  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      const json = await res.json();
      setNotifications(json.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
    const handler = () => fetchNotifications();
    window.addEventListener('notifications:changed', handler as EventListener);
    return () => window.removeEventListener('notifications:changed', handler as EventListener);
  }, []);

  /* ----------------------------------
   * Mark read helpers
   * ---------------------------------- */
  async function markRead(id: string) {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });

      setNotifications((n) =>
        n.map((item) => (item.id === id ? { ...item, read: true } : item)),
      );

      setSelected((s) => (s && s.id === id ? { ...s, read: true } : s));

      window.dispatchEvent(new CustomEvent('notifications:changed'));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  }

  async function markAllRead() {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });

      setNotifications((n) => n.map((item) => ({ ...item, read: true })));
      setSelected((s) => (s ? { ...s, read: true } : s));

      window.dispatchEvent(new CustomEvent('notifications:changed'));
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  }

  /* ----------------------------------
   * Auto-mark as read when opened
   * ---------------------------------- */
  useEffect(() => {
    if (selected && !selected.read) {
      markRead(selected.id);
    }
  }, [selected]);

  /* ----------------------------------
   * Focus trap + ESC close
   * ---------------------------------- */
  useEffect(() => {
    if (!selected) return;

    const el = modalRef.current;
    if (!el) return;

    const prevFocus = document.activeElement as HTMLElement | null;
    el.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSelected(null);
      }
    }

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prevFocus?.focus();
    };
  }, [selected]);

  return (
    <>
      {/* Notification List */}
      <div className="w-96 max-w-full bg-white dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 rounded-lg shadow-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Notifications</h3>
          <button
            onClick={markAllRead}
            className="text-xs text-indigo-600 hover:underline"
          >
            Mark all read
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {loading && <div className="text-sm text-gray-500">Loading…</div>}
          {!loading && notifications.length === 0 && (
            <div className="text-sm text-gray-500">No notifications</div>
          )}

          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => setSelected(n)}
              role="button"
              tabIndex={0}
              className={`p-3 rounded-md mb-2 cursor-pointer border-l-4 transition
                ${
                  n.read
                    ? 'bg-gray-50 dark:bg-gray-900/60 border-l-gray-200/30'
                    : 'bg-indigo-50/40 dark:bg-indigo-900/20 border-l-indigo-500 shadow-sm'
                }`}
            >
              <div className="flex justify-between">
                <div>
                  <div className={`text-sm ${n.read ? 'font-medium' : 'font-semibold'}`}>
                    {n.title}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                    {n.message}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
                {!n.read && (
                  <span className="text-xs bg-rose-500 text-white px-2 py-0.5 rounded-full h-fit">
                    New
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Centered Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelected(null)}
          />

          <div
            ref={modalRef}
            tabIndex={-1}
            className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 outline-none animate-in fade-in zoom-in-95"
          >
            <div className="flex justify-between items-start gap-4">
              <div>
                <h4 className="text-lg font-semibold">{selected.title}</h4>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(selected.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
              {selected.message}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 border rounded-md text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
