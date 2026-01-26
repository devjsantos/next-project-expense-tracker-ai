"use client";

import { useEffect, useState, useCallback } from 'react';

type Recurring = {
  id: string;
  text: string;
  amount: number;
  category: string;
  startDate: string;
  frequency: string;
  active: boolean;
};

export default function RecurringExpenses() {
  const [items, setItems] = useState<Recurring[]>([]);
  const [loading, setLoading] = useState(true);
  const [isManageMode, setIsManageMode] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // New Add Modal State
  const [editingItem, setEditingItem] = useState<Recurring | null>(null);
  
  const [form, setForm] = useState({ 
    text: '', amount: '', category: 'Bills', startDate: new Date().toISOString().split('T')[0], frequency: 'monthly', active: true 
  });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/recurring');
      const json = await res.json();
      setItems(json.items || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      const json = await res.json();
      if (json.item) {
        setItems(prev => [json.item, ...prev]);
        setIsAddModalOpen(false);
        setForm({ text: '', amount: '', category: 'Bills', startDate: new Date().toISOString().split('T')[0], frequency: 'monthly', active: true });
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      const res = await fetch('/api/recurring', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem),
      });
      const json = await res.json();
      if (json.item) {
        setItems(prev => prev.map(i => i.id === json.item.id ? json.item : i));
        setEditingItem(null);
      }
    } catch (e) { console.error(e); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    try {
      const res = await fetch(`/api/recurring?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) setItems(prev => prev.filter(i => i.id !== id));
    } catch (e) { console.error(e); }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      const res = await fetch('/api/recurring', { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ id, active: !active }) 
      });
      const json = await res.json();
      if (json.item) setItems(prev => prev.map(i => i.id === id ? json.item : i));
    } catch (e) { console.error(e); }
  };

  return (
    <div className='bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative'>
      {/* Header */}
      <div className="p-6 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 flex justify-between items-center">
        <div>
          <h3 className='text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter'>Recurring Rules</h3>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Automatic Expenses</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
          <button 
            onClick={() => setIsManageMode(!isManageMode)}
            className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${isManageMode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-600'}`}
          >
            {isManageMode ? 'Done' : 'Manage'}
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className='space-y-3'>
          {items.length === 0 && !loading && (
             <div className="text-center py-10 opacity-50 font-bold text-xs uppercase tracking-widest">No recurring rules found</div>
          )}
          {items.map(item => (
            <div key={item.id} className='group flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-900/30 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900 rounded-2xl transition-all'>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ${item.active ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'bg-gray-100 text-gray-400'}`}>
                  {item.frequency[0].toUpperCase()}
                </div>
                <div>
                  <div className={`font-black text-sm ${item.active ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{item.text}</div>
                  <div className='text-[10px] font-black text-gray-400 uppercase tracking-widest'>₱{item.amount.toLocaleString()} • {item.frequency}</div>
                </div>
              </div>
              
              <div className='flex items-center gap-2'>
                {isManageMode ? (
                  <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                    <button onClick={() => setEditingItem(item)} className="p-2.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button onClick={() => toggleActive(item.id, item.active)} className={`px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${item.active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-200 text-gray-500'}`}>
                      {item.active ? 'Pause' : 'Resume'}
                    </button>
                    <button onClick={() => remove(item.id)} className='p-2.5 bg-red-50 dark:bg-red-950 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all'>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                  </div>
                ) : (
                  <div className={`w-2 h-2 rounded-full ${item.active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-300'}`} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal (Combined Logic) */}
      {(isAddModalOpen || editingItem) && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-6 tracking-tighter">
              {editingItem ? 'Edit Rule' : 'New Recurring Rule'}
            </h3>
            <form onSubmit={editingItem ? handleUpdate : handleCreate} className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Description</label>
                <input 
                  className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl font-bold outline-none transition-all"
                  placeholder="e.g. Netflix"
                  value={editingItem ? editingItem.text : form.text} 
                  onChange={e => editingItem ? setEditingItem({...editingItem, text: e.target.value}) : setForm({...form, text: e.target.value})} 
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Amount (₱)</label>
                  <input 
                    type="number" 
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl font-bold outline-none transition-all"
                    value={editingItem ? editingItem.amount : form.amount} 
                    onChange={e => editingItem ? setEditingItem({...editingItem, amount: parseFloat(e.target.value)}) : setForm({...form, amount: e.target.value})} 
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Frequency</label>
                  <select 
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl font-bold outline-none transition-all"
                    value={editingItem ? editingItem.frequency : form.frequency}
                    onChange={e => editingItem ? setEditingItem({...editingItem, frequency: e.target.value}) : setForm({...form, frequency: e.target.value})}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setIsAddModalOpen(false); setEditingItem(null); }} className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl font-black uppercase text-xs tracking-widest">Cancel</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-500/30">
                  {editingItem ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}