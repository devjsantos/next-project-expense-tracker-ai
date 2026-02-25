"use client";

import { useEffect, useState, useCallback } from 'react';
import { Plus, Settings2, Check, Pencil, Trash2, PauseCircle, PlayCircle, Calendar, CreditCard, Hash, ChevronRight } from 'lucide-react';
import { useToast } from './ToastProvider';

type Recurring = {
  id: string;
  text: string;
  amount: number;
  category: string;
  startDate: string;
  dayOfMonth: number;
  frequency: string;
  active: boolean;
};

export default function RecurringExpenses() {
  const [items, setItems] = useState<Recurring[]>([]);
  const [loading, setLoading] = useState(true);
  const [isManageMode, setIsManageMode] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Recurring | null>(null);
  
  const { addToast } = useToast();

  const [form, setForm] = useState({
    text: '', amount: '', category: 'Bills',
    startDate: new Date().toISOString().split('T')[0],
    dayOfMonth: new Date().getDate(),
    frequency: 'monthly', active: true
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

  const totalMonthly = items
    .filter(i => i.active)
    .reduce((acc, curr) => {
      const amt = curr.amount || 0;
      if (curr.frequency === 'weekly') return acc + (amt * 4);
      if (curr.frequency === 'yearly') return acc + (amt / 12);
      return acc + amt;
    }, 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    addToast('Syncing New Rule...', 'loading');
    const dateObj = new Date(form.startDate || new Date());
    const payload = { ...form, amount: parseFloat(form.amount) || 0, dayOfMonth: Number(form.dayOfMonth) || 1, nextDueDate: dateObj.toISOString() };

    try {
      const res = await fetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.item) {
        setItems(prev => [json.item, ...prev]);
        setIsAddModalOpen(false);
        addToast('Rule Active', 'success');
        setForm({ text: '', amount: '', category: 'Bills', startDate: new Date().toISOString().split('T')[0], dayOfMonth: new Date().getDate(), frequency: 'monthly', active: true });
      }
    } catch (e) { addToast('Sync failed', 'error'); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    addToast('Updating...', 'loading');
    try {
      const res = await fetch('/api/recurring', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editingItem, dayOfMonth: Number(editingItem.dayOfMonth), nextDueDate: new Date(editingItem.startDate).toISOString() }),
      });
      const json = await res.json();
      if (json.item) {
        setItems(prev => prev.map(i => i.id === json.item.id ? json.item : i));
        setEditingItem(null);
        addToast('Rule Updated', 'success');
      }
    } catch (e) { addToast('Update failed', 'error'); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    addToast('Terminating...', 'loading');
    try {
      const res = await fetch(`/api/recurring?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(prev => prev.filter(i => i.id !== id));
        addToast('Rule Deleted', 'success');
      }
    } catch (e) { addToast('Error', 'error'); }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      const res = await fetch('/api/recurring', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !active })
      });
      const json = await res.json();
      if (json.item) {
        setItems(prev => prev.map(i => i.id === id ? json.item : i));
        addToast(active ? 'Paused' : 'Resumed', 'info');
      }
    } catch (e) { console.error(e); }
  };

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div className='bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-200/60 dark:border-slate-800/50 overflow-hidden'>
      
      {/* 1. GLASS HEADER (Updated Section) */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className='text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white'>Subscriptions</h3>
              <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">₱{(totalMonthly || 0).toLocaleString()}/mo total</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={() => setIsAddModalOpen(true)} className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all">
              <Plus size={14} /> Add New
            </button>
            <button onClick={() => setIsManageMode(!isManageMode)} className={`p-2 rounded-xl border transition-all ${isManageMode ? 'bg-slate-900 text-white border-slate-900' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'}`}>
              {isManageMode ? <Check size={18} /> : <Settings2 size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Grid List */}
      <div className="p-5">
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar'>
          {items.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 opacity-30 font-black text-[10px] uppercase tracking-[0.3em]">No rules found</div>
          )}

          {items.map(item => (
            <div key={item.id} className={`flex items-center justify-between p-3.5 bg-white dark:bg-slate-950/40 border transition-all rounded-2xl ${item.active ? 'border-slate-100 dark:border-slate-800/50 hover:border-indigo-500/30 shadow-sm' : 'opacity-60 bg-slate-50/50 border-transparent'}`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-[10px] ${item.active ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                  {item.dayOfMonth}th
                </div>
                <div className="min-w-0">
                  <div className={`font-black text-xs uppercase truncate ${item.active ? 'text-slate-800 dark:text-slate-200' : 'line-through opacity-50'}`}>
                    {item.text}
                  </div>
                  <div className='flex items-center gap-1.5 text-[8px] font-bold text-slate-400 uppercase mt-0.5'>
                    <span className="text-indigo-500">₱{item.amount.toLocaleString()}</span>
                    <span className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    <span>{item.frequency}</span>
                  </div>
                </div>
              </div>

              <div className='flex-shrink-0'>
                {isManageMode ? (
                  <div className="flex gap-1">
                    <button onClick={() => setEditingItem(item)} className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500 hover:bg-indigo-500 hover:text-white transition-all"><Pencil size={12} /></button>
                    <button onClick={() => toggleActive(item.id, item.active)} className={`p-1.5 rounded-lg transition-colors ${item.active ? 'bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white'}`}>{item.active ? <PauseCircle size={12} /> : <PlayCircle size={12} />}</button>
                    <button onClick={() => remove(item.id)} className='p-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all'><Trash2 size={12} /></button>
                  </div>
                ) : (
                  <div className={`px-2 py-1 rounded-md text-[7px] font-black uppercase border tracking-widest ${item.active ? 'border-emerald-500/20 text-emerald-600 bg-emerald-500/5' : 'border-slate-200 text-slate-400'}`}>
                    {item.active ? 'Active' : 'Paused'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. MODAL (With Glass Backing) */}
      {(isAddModalOpen || editingItem) && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm p-6 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white"><Calendar size={16} /></div>
               <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white">{editingItem ? 'Edit Rule' : 'New Rule'}</h3>
            </div>
            <form onSubmit={editingItem ? handleUpdate : handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase px-1">Label</label>
                <input
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-xl font-bold text-sm outline-none transition-all"
                  placeholder="Netflix, Rent, etc."
                  value={editingItem ? editingItem.text : form.text}
                  onChange={e => editingItem ? setEditingItem({ ...editingItem, text: e.target.value }) : setForm({ ...form, text: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase px-1">Amount</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="0.00"
                    value={editingItem ? editingItem.amount : form.amount}
                    onChange={e => editingItem ? setEditingItem({ ...editingItem, amount: parseFloat(e.target.value) || 0 }) : setForm({ ...form, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase px-1">Day</label>
                  <input
                    type="number"
                    min="1" max="31"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="1-31"
                    value={editingItem ? (editingItem.dayOfMonth || '') : (form.dayOfMonth || '')}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      editingItem ? setEditingItem({ ...editingItem, dayOfMonth: val }) : setForm({ ...form, dayOfMonth: val });
                    }}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase px-1">Cycle</label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-sm outline-none appearance-none cursor-pointer"
                  value={editingItem ? editingItem.frequency : form.frequency}
                  onChange={e => editingItem ? setEditingItem({ ...editingItem, frequency: e.target.value }) : setForm({ ...form, frequency: e.target.value })}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setIsAddModalOpen(false); setEditingItem(null); }} className="flex-1 py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">Cancel</button>
                <button type="submit" className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-500/20 transition-all">
                  {editingItem ? 'Save Changes' : 'Activate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}