export const dynamic = "force-dynamic";

import AddNewRecord from '@/components/AddNewRecord';
import AIInsights from '@/components/AiInsights';
import ExpenseStats from '@/components/ExpenseStats';
import RecordChart from '@/components/RecordChart';
import RecordHistory from '@/components/RecordHistory';
import { checkUser } from '@/lib/checkUser';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { BrainCircuit, TrendingUp, History, Wallet, Fingerprint, Sparkles } from 'lucide-react';

export default async function DashboardPage() {
  const user = await checkUser();

  // Security: If a user tries to access /dashboard without being logged in
  if (!user) {
    redirect('/');
  }

  const firstName = user.name?.split(' ')[0] || 'User';

  return (
    <main className="bg-[#f8fafc] dark:bg-[#020617] min-h-screen pb-20 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-10">

        {/* 1. HEADER CARD */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/10">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl blur opacity-25"></div>
              <Image
                src={user.imageUrl || '/default-avatar.png'}
                alt="Profile"
                width={60}
                height={60}
                className="relative rounded-2xl border-2 border-white dark:border-slate-800 object-cover"
              />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Authenticated</p>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                Mabuhay, {firstName}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-700">
            <Fingerprint className="text-indigo-500" size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Secure Node</span>
          </div>
        </div>

        {/* 2. WALLET & ADD RECORD */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-8 bg-slate-900 dark:bg-indigo-600 rounded-[3.5rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-400/20 rounded-full blur-[100px] -mr-20 -mt-20"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                  <Wallet className="text-white" size={20} />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Wallet Hub</h2>
              </div>
              <ExpenseStats />
            </div>
          </div>
          <div className="lg:col-span-4 h-full">
            <AddNewRecord />
          </div>
        </div>

        {/* 3. CHART */}
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-200/10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl text-indigo-600">
              <TrendingUp size={22} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Visual Flow</h3>
          </div>
          <RecordChart />
        </div>

        {/* 4. AI INSIGHTS */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 blur-2xl rounded-[3rem]"></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <BrainCircuit size={20} />
                </div>
                <p className="text-lg font-black text-slate-900 dark:text-white tracking-tighter uppercase">AI Intelligence</p>
              </div>
              <Sparkles size={18} className="text-indigo-500 animate-pulse hidden sm:block" />
            </div>
            <div className="p-8">
              <AIInsights />
            </div>
          </div>
        </div>

        {/* 5. ACTIVITY STREAM */}
        <div className="relative space-y-6 pt-4">
          <div className="flex items-center gap-4 px-6">
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800/50 rounded-xl flex items-center justify-center text-slate-500 border border-slate-200/50 dark:border-slate-700/50">
              <History size={20} />
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tighter uppercase">Activity Ledger</h3>
          </div>
          <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="p-6">
              <RecordHistory />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}