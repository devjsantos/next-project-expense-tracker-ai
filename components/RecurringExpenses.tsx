"use client";

import { useEffect, useState, useCallback } from 'react';
import { Plus, Settings2, Check, Pencil, Trash2, PauseCircle, PlayCircle, Calendar, CreditCard, Hash } from 'lucide-react';

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

  const [form, setForm] = useState({
    text: '',
    amount: '',
    category: 'Bills',
    startDate: new Date().toISOString().split('T')[0],
    dayOfMonth: new Date().getDate(),
    frequency: 'monthly',
    active: true
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
      if (curr.frequency === 'weekly') return acc + (curr.amount * 4);
      if (curr.frequency === 'yearly') return acc + (curr.amount / 12);
      return acc + curr.amount;
    }, 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      amount: parseFloat(form.amount),
      dayOfMonth: Number(form.dayOfMonth),
      nextDueDate: new Date(form.startDate).toISOString(),
    };

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
        setForm({
          text: '', amount: '', category: 'Bills',
          startDate: new Date().toISOString().split('T')[0],
          dayOfMonth: new Date().getDate(),
          frequency: 'monthly', active: true
        });
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const updatedPayload = {
      ...editingItem,
      dayOfMonth: Number(editingItem.dayOfMonth),
      nextDueDate: new Date(editingItem.startDate).toISOString(),
    };

    try {
      const res = await fetch('/api/recurring', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPayload),
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

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div className='bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-200/60 dark:border-slate-800 overflow-hidden max-w-2xl mx-auto'>
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className='text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight'>Recurring Rules</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">Auto-Compute</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsAddModalOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all">
              <Plus size={20} strokeWidth={3} />
            </button>
            <button onClick={() => setIsManageMode(!isManageMode)} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${isManageMode ? 'bg-slate-900 text-white border-slate-900' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}`}>
              {isManageMode ? <Check size={18} /> : <Settings2 size={18} />}
            </button>
          </div>
        </div>

        <div className="bg-indigo-600 rounded-2xl p-5 text-white flex justify-between items-center relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] opacity-80">Monthly Commitment</p>
            <h4 className="text-2xl font-black mt-0.5">₱{totalMonthly.toLocaleString()}</h4>
          </div>
          <CreditCard size={32} className="opacity-20 absolute -right-2 -bottom-2 rotate-12" />
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className='space-y-3 max-h-[450px] overflow-y-auto pr-1 custom-scrollbar'>
          {items.length === 0 && !loading && (
            <div className="text-center py-12 opacity-30 font-bold text-[10px] uppercase tracking-widest">No Active Rules</div>
          )}

          {items.map(item => (
            <div key={item.id} className='group flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900 rounded-2xl transition-all'>
              <div className="flex items-center gap-4 min-w-0">
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all ${item.active ? 'bg-indigo-50 dark:bg-slate-700 text-indigo-600 shadow-sm' : 'bg-slate-100 text-slate-400 opacity-60'}`}>
                  {item.dayOfMonth || item.frequency.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <div className={`font-bold text-sm sm:text-base truncate ${item.active ? 'text-slate-900 dark:text-white' : 'text-slate-400 line-through'}`}>
                    {item.text}
                  </div>
                  <div className='flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase mt-0.5'>
                    <span className={item.active ? "text-indigo-500" : ""}>₱{item.amount.toLocaleString()}</span>
                    <span className="opacity-30">•</span>
                    {/* Add a fallback check for 0 or undefined */}
                    <span>Every {item.dayOfMonth > 0 ? getOrdinal(item.dayOfMonth) : getOrdinal(1)}</span>
                    <span className="opacity-30">•</span>
                    <span>{item.frequency}</span>
                  </div>
                </div>
              </div>

              <div className='flex-shrink-0 ml-3'>
                {isManageMode ? (
                  <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2">
                    <button onClick={() => setEditingItem(item)} className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-indigo-600 hover:text-white transition-all">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => toggleActive(item.id, item.active)} className={`p-2 rounded-lg transition-all ${item.active ? 'bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white'}`}>
                      {item.active ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                    </button>
                    <button onClick={() => remove(item.id)} className='p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all'>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <div className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${item.active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                    {item.active ? 'Active' : 'Paused'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {(isAddModalOpen || editingItem) && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm p-8 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center">
                <Calendar size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {editingItem ? 'Edit Rule' : 'New Rule'}
              </h3>
            </div>

            <form onSubmit={editingItem ? handleUpdate : handleCreate} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1.5 block tracking-widest">Description</label>
                <input
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-xl font-bold outline-none transition-all text-sm"
                  placeholder="e.g. Netflix"
                  value={editingItem ? editingItem.text : form.text}
                  onChange={e => editingItem ? setEditingItem({ ...editingItem, text: e.target.value }) : setForm({ ...form, text: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase mb-1.5 block tracking-widest">Amount</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-xl font-bold outline-none text-sm"
                    value={editingItem ? editingItem.amount : form.amount}
                    onChange={e => editingItem ? setEditingItem({ ...editingItem, amount: parseFloat(e.target.value) || 0 }) : setForm({ ...form, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase mb-1.5 block tracking-widest">Due Day (1-31)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-xl font-bold outline-none text-sm"
                      value={editingItem ? (editingItem.dayOfMonth || '') : (form.dayOfMonth || '')}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 0;
                        editingItem ? setEditingItem({ ...editingItem, dayOfMonth: val }) : setForm({ ...form, dayOfMonth: val });
                      }}
                      required
                    />
                    <Hash size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1.5 block tracking-widest">Cycle</label>
                <select
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-xl font-bold outline-none text-sm appearance-none"
                  value={editingItem ? editingItem.frequency : form.frequency}
                  onChange={e => editingItem ? setEditingItem({ ...editingItem, frequency: e.target.value }) : setForm({ ...form, frequency: e.target.value })}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setIsAddModalOpen(false); setEditingItem(null); }} className="flex-1 py-3.5 text-slate-500 font-bold uppercase text-[10px] tracking-widest hover:text-slate-700 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all">
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