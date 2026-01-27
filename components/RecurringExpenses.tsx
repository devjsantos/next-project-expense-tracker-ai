"use client";

import { useEffect, useState, useCallback } from 'react';
import { Plus, Settings2, Check, Pencil, Trash2, PauseCircle, PlayCircle, Calendar, CreditCard } from 'lucide-react';

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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

  // Logic: Calculate total monthly commitment
  const totalMonthly = items
    .filter(i => i.active)
    .reduce((acc, curr) => {
      if (curr.frequency === 'weekly') return acc + (curr.amount * 4);
      if (curr.frequency === 'yearly') return acc + (curr.amount / 12);
      return acc + curr.amount;
    }, 0);

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
    <div className='bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-indigo-500/5 border border-slate-100 dark:border-slate-800 overflow-hidden'>
      {/* Header & Total Summary */}
      <div className="p-8 pb-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className='text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter'>Recurring Rules</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Auto-Compute Active</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all"
            >
              <Plus size={24} strokeWidth={3} />
            </button>
            <button 
              onClick={() => setIsManageMode(!isManageMode)}
              className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all border ${isManageMode ? 'bg-slate-900 text-white border-slate-900' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}`}
            >
              {isManageMode ? <Check size={20} /> : <Settings2 size={20} />}
            </button>
          </div>
        </div>

        <div className="bg-indigo-600 rounded-3xl p-6 text-white flex justify-between items-center shadow-lg shadow-indigo-500/20">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Monthly Commitment</p>
            <h4 className="text-3xl font-black mt-1">₱{totalMonthly.toLocaleString()}</h4>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <CreditCard size={24} />
          </div>
        </div>
      </div>

      <div className="p-8 pt-4">
        <div className='space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar'>
          {items.length === 0 && !loading && (
             <div className="text-center py-12 opacity-30 font-black text-xs uppercase tracking-[0.3em]">No Active Rules</div>
          )}
          
          {items.map(item => (
            <div key={item.id} className='group flex items-center justify-between p-5 bg-slate-50/50 dark:bg-slate-800/40 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900 rounded-[1.5rem] transition-all'>
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-all ${item.active ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm ring-1 ring-slate-100 dark:ring-slate-600' : 'bg-slate-100 text-slate-400 opacity-50'}`}>
                  {item.frequency === 'monthly' ? 'M' : item.frequency === 'weekly' ? 'W' : 'Y'}
                </div>
                <div>
                  <div className={`font-black text-base tracking-tight ${item.active ? 'text-slate-900 dark:text-white' : 'text-slate-400 line-through'}`}>{item.text}</div>
                  <div className='flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5'>
                    <span className="text-indigo-500">₱{item.amount.toLocaleString()}</span>
                    <span>•</span>
                    <span>{item.frequency}</span>
                  </div>
                </div>
              </div>
              
              <div className='flex items-center gap-2'>
                {isManageMode ? (
                  <div className="flex items-center gap-2 animate-in slide-in-from-right-4">
                    <button onClick={() => setEditingItem(item)} className="p-3 bg-white dark:bg-slate-700 text-indigo-600 rounded-xl shadow-sm hover:bg-indigo-600 hover:text-white transition-all">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => toggleActive(item.id, item.active)} className={`p-3 rounded-xl shadow-sm transition-all ${item.active ? 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}>
                      {item.active ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
                    </button>
                    <button onClick={() => remove(item.id)} className='p-3 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all'>
                      <Trash2 size={18} />
                    </button>
                  </div>
                ) : (
                  <div className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${item.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    {item.active ? 'Active' : 'Paused'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modern Modal Overlay */}
      {(isAddModalOpen || editingItem) && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md p-10 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Calendar size={24} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                {editingItem ? 'Edit Rule' : 'New Rule'}
              </h3>
            </div>
            
            <form onSubmit={editingItem ? handleUpdate : handleCreate} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-[0.2em]">Rule Description</label>
                <input 
                  className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-3xl font-bold outline-none transition-all placeholder:text-slate-300"
                  placeholder="e.g. Spotify Premium"
                  value={editingItem ? editingItem.text : form.text} 
                  onChange={e => editingItem ? setEditingItem({...editingItem, text: e.target.value}) : setForm({...form, text: e.target.value})} 
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-[0.2em]">Amount (₱)</label>
                  <input 
                    type="number" 
                    className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-3xl font-bold outline-none transition-all"
                    value={editingItem ? editingItem.amount : form.amount} 
                    onChange={e => editingItem ? setEditingItem({...editingItem, amount: parseFloat(e.target.value)}) : setForm({...form, amount: e.target.value})} 
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-[0.2em]">Cycle</label>
                  <select 
                    className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-3xl font-bold outline-none transition-all appearance-none"
                    value={editingItem ? editingItem.frequency : form.frequency}
                    onChange={e => editingItem ? setEditingItem({...editingItem, frequency: e.target.value}) : setForm({...form, frequency: e.target.value})}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => { setIsAddModalOpen(false); setEditingItem(null); }} className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-colors">Close</button>
                <button type="submit" className="flex-2 px-10 py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-500/40 hover:bg-indigo-700 transition-all">
                  {editingItem ? 'Update' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}