'use client';

import React, { useRef, useState, ChangeEvent, useEffect } from 'react';
import { createPortal } from 'react-dom';
import addExpenseRecord from '@/app/actions/addExpenseRecord';
import { suggestCategory } from '@/app/actions/suggestCategory';
import { scanReceipt } from '@/app/actions/scanReceipt';
import { useToast } from '@/components/ToastProvider';
import {
  Camera, Edit3, Sparkles, Calendar,
  Tag, Loader2, Wallet, X, ChevronRight
} from 'lucide-react';

const CATEGORIES = [
  { id: 'Food', label: 'Food', icon: '🍔' },
  { id: 'Transportation', label: 'Transpo', icon: '🚗' },
  { id: 'Shopping', label: 'Shop', icon: '🛍️' },
  { id: 'Entertainment', label: 'Fun', icon: '🎬' },
  { id: 'Bills', label: 'Bills', icon: '💳' },
  { id: 'Healthcare', label: 'Health', icon: '🏥' },
  { id: 'Other', label: 'Other', icon: '✨' },
];

const AddRecord = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoCategorizing, setIsAutoCategorizing] = useState(false);
  const [lastAutoCategory, setLastAutoCategory] = useState('');

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
      });
      reader.readAsDataURL(file);
      const base64String = await base64Promise;
      const result = await scanReceipt(base64String, file.type);

      if (result && result.success && result.data) {
        setAmount(result.data.amount?.toString() || '');
        setDescription(result.data.description || result.data.merchant || result.data.store || '');
        let aiCategory = result.data.category || '';
        if (aiCategory === 'Transpo') aiCategory = 'Transportation';
        setCategory(aiCategory);
        setLastAutoCategory(aiCategory);
        setIsModalOpen(true);
        addToast('Analysis complete', 'success');
      } else {
        throw new Error(result.error || 'Congestion. Try manual entry.');
      }
    } catch (error: any) {
      addToast(error.message, 'error');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    const trimmedDesc = description.trim();
    if (trimmedDesc.length < 3) return;

    const debounceTimer = setTimeout(async () => {
      setIsAutoCategorizing(true);
      try {
        const result = await suggestCategory(trimmedDesc);
        if (result.category) {
          setCategory(result.category);
          setLastAutoCategory(result.category);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsAutoCategorizing(false);
      }
    }, 1000);

    return () => clearTimeout(debounceTimer);
  }, [description]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData();
    formData.set('amount', amount);
    formData.set('category', category);
    formData.set('date', date);
    formData.set('text', description);

    try {
      const result = await addExpenseRecord(formData);
      if (!result.error) {
        addToast('Record secured', 'success');
        resetForm();
        window.dispatchEvent(new CustomEvent('records:changed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setAmount(''); setCategory(''); setDescription(''); setDate(new Date().toISOString().split('T')[0]);
    setLastAutoCategory(''); setIsModalOpen(false);
  };

  return (
    <div className='bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800/60 transition-all'>

      {/* CSS to hide number input arrows */}
      <style jsx global>{`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>

      {/* --- SCANNING OVERLAY --- */}
      {isScanning && createPortal(
        <div className="fixed inset-0 z-[20000] bg-slate-950/40 backdrop-blur-2xl flex flex-col items-center justify-center animate-in fade-in duration-500">
          <div className="relative p-10 bg-white/10 dark:bg-slate-800/20 border border-white/20 rounded-[3rem] backdrop-blur-xl shadow-2xl flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center animate-pulse">
              <Wallet className="text-white" size={40} />
            </div>
            <div className="text-center">
              <p className="text-indigo-400 font-black text-xs uppercase tracking-[0.3em] mb-1">Scanning Receipt</p>
              <p className="text-white/60 text-[10px] font-medium tracking-widest">SMART JUAN AI ENGINE</p>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* --- MAIN UI --- */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Wealth Tracker</h2>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Manage your capital</p>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl">
            <Wallet className="text-indigo-600 dark:text-indigo-400" size={20} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => fileInputRef.current?.click()} className="group flex flex-col items-center gap-3 p-6 bg-slate-50 dark:bg-slate-800/40 rounded-[1.5rem] hover:bg-indigo-600 transition-all duration-300">
            <Camera className="text-indigo-500 group-hover:text-white transition-colors" size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white/90">Smart Scan</span>
          </button>

          <button onClick={() => setIsModalOpen(true)} className="group flex flex-col items-center gap-3 p-6 bg-slate-50 dark:bg-slate-800/40 rounded-[1.5rem] hover:bg-slate-900 dark:hover:bg-white transition-all duration-300">
            <Edit3 className="text-slate-900 dark:text-white group-hover:text-white dark:group-hover:text-slate-900" size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white dark:group-hover:text-slate-900">Manual</span>
          </button>
        </div>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />

      {/* --- MODAL --- */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in" onClick={resetForm} />

          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">

            {/* Header */}
            <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                  <Sparkles size={14} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none">Transaction Details</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Ready for ledger entry</p>
                </div>
              </div>
              <button onClick={resetForm} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-900 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Amount Input */}
              <div className="flex flex-col items-center py-4">
                <div className="relative group">
                  <span className="absolute -left-10 top-1/2 -translate-y-1/2 text-2xl font-light text-slate-300">PHP</span>
                  <input
                    type="number" step="any" value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="bg-transparent text-7xl font-light tracking-tighter text-slate-900 dark:text-white outline-none w-full max-w-[300px] placeholder:text-slate-100 text-center"
                    required autoFocus
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Description */}
                <div className="group relative bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-2xl transition-all focus-within:ring-2 focus-within:ring-indigo-500/20">
                  {/* Icon Container: Added z-10 and pointer-events-none to prevent 'covering' the icon */}
                  <div className="absolute z-10 pointer-events-none left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
                    <Tag
                      className="text-slate-500 group-focus-within:text-indigo-500 transition-colors"
                      size={16}
                      strokeWidth={2.5}
                    />
                  </div>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Merchant or Service"
                    className="relative z-0 w-full pl-16 pr-6 py-5 bg-transparent font-bold text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
                    required
                  />
                </div>

                {/* Date & Category Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-2xl group">
                    {/* Calendar Icon: z-10 ensures it stays above the date picker background */}
                    <Calendar className="absolute z-10 left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="relative z-0 w-full pl-12 pr-4 py-4 bg-transparent font-bold text-slate-700 dark:text-slate-300 outline-none uppercase text-[10px]"
                    />
                  </div>

                  <div className="relative bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-2xl group cursor-pointer overflow-hidden">
                    <div className="flex items-center gap-2 pl-4 py-4 pr-4">
                      {isAutoCategorizing ? (
                        <Loader2 size={16} className="text-indigo-500 animate-spin" />
                      ) : (
                        <Sparkles size={16} className="text-indigo-500" />
                      )}
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex-1">Category</span>
                      <span className="text-xs font-bold dark:text-white">
                        {category ? CATEGORIES.find(c => c.id === category)?.label : 'None'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Category Pills (FIXED) */}
                <div className="flex flex-wrap gap-2 pt-2 justify-center">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      disabled
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 border 
                        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'} 
                        ${category === cat.id
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30 -translate-y-0.5'
                          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-500'
                        }`}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !category || !amount}
                className="group relative w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl transition-all hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:bg-slate-400 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin mx-auto" size={20} />
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    Add Expense <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AddRecord;