"use client";

import { useEffect, useState } from 'react';

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
  const [form, setForm] = useState({ text: '', amount: '', category: 'Other', startDate: '', frequency: 'monthly', active: true });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/recurring');
      const json = await res.json();
      setItems(json.items || []);
    } catch (e) {
      console.error('Failed to fetch recurring expenses', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const create = async () => {
    if (!form.text || !form.amount || !form.startDate) {
      alert('Please fill text, amount and start date');
      return;
    }
    try {
      const res = await fetch('/api/recurring', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: form.text, amount: parseFloat(form.amount), category: form.category, startDate: form.startDate, frequency: form.frequency, active: form.active }) });
      const json = await res.json();
      if (json.item) {
        setItems(prev => [json.item, ...prev]);
        setForm({ text: '', amount: '', category: 'Other', startDate: '', frequency: 'monthly', active: true });
      } else {
        alert('Failed to create: ' + (json.error || 'unknown'));
      }
    } catch (e) {
      console.error(e);
      alert('Failed to create recurring expense');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this recurring expense?')) return;
    try {
      const res = await fetch(`/api/recurring?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.ok) setItems(prev => prev.filter(i => i.id !== id));
      else alert('Delete failed: ' + (json.error || 'unknown'));
    } catch (e) {
      console.error(e);
      alert('Delete failed');
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      const res = await fetch('/api/recurring', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, active: !active }) });
      const json = await res.json();
      if (json.item) setItems(prev => prev.map(i => i.id === id ? json.item : i));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className='p-4 bg-white/80 dark:bg-gray-800/80 rounded-lg'>Loading...</div>;

  return (
    <div className='p-4 bg-white/80 dark:bg-gray-800/80 rounded-lg shadow'>
      <h3 className='text-sm font-semibold mb-2'>Recurring Expenses</h3>
      <div className='space-y-2 mb-3'>
        <input value={form.text} onChange={(e)=>setForm({...form, text: e.target.value})} placeholder='Description' className='w-full p-2 rounded border' />
        <div className='flex gap-2'>
          <input value={form.amount} onChange={(e)=>setForm({...form, amount: e.target.value})} placeholder='Amount' type='number' className='p-2 rounded border w-32' />
          <input value={form.startDate} onChange={(e)=>setForm({...form, startDate: e.target.value})} type='date' className='p-2 rounded border' />
          <select value={form.frequency} onChange={(e)=>setForm({...form, frequency: e.target.value})} className='p-2 rounded border'>
            <option value='monthly'>Monthly</option>
            <option value='weekly'>Weekly</option>
            <option value='yearly'>Yearly</option>
          </select>
        </div>
        <div className='flex gap-2'>
          <select value={form.category} onChange={(e)=>setForm({...form, category: e.target.value})} className='p-2 rounded border'>
            <option>Food</option>
            <option>Transportation</option>
            <option>Shopping</option>
            <option>Entertainment</option>
            <option>Bills</option>
            <option>Healthcare</option>
            <option>Other</option>
          </select>
          <label className='flex items-center gap-2'><input type='checkbox' checked={form.active} onChange={(e)=>setForm({...form, active: e.target.checked})} /> Active</label>
          <button onClick={create} className='ml-auto px-3 py-1 bg-indigo-600 text-white rounded'>Add</button>
        </div>
      </div>

      <div className='space-y-2'>
        {items.length === 0 && <div className='text-xs text-gray-500'>No recurring expenses found.</div>}
        {items.map(item => (
          <div key={item.id} className='flex items-center justify-between p-2 border rounded'>
            <div>
              <div className='font-medium'>{item.text} <span className='text-xs text-gray-500'>({item.frequency})</span></div>
              <div className='text-xs text-gray-500'>₱{Number(item.amount).toFixed(2)} — starts {new Date(item.startDate).toLocaleDateString()}</div>
            </div>
            <div className='flex items-center gap-2'>
              <button onClick={()=>toggleActive(item.id, item.active)} className={`px-2 py-1 rounded ${item.active ? 'bg-emerald-500 text-white' : 'bg-gray-600'}`}>{item.active ? 'Active' : 'Inactive'}</button>
              <button onClick={()=>remove(item.id)} className='px-2 py-1 bg-red-500 text-white rounded'>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
