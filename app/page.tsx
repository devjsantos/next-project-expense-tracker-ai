export const dynamic = "force-dynamic";

import AddNewRecord from '@/components/AddNewRecord';
import AIInsights from '@/components/AiInsights';
import ExpenseStats from '@/components/ExpenseStats';
import Guest from '@/components/Guest';
import RecordChart from '@/components/RecordChart';
import RecordHistory from '@/components/RecordHistory';
import { checkUser } from '@/lib/checkUser';
import Image from 'next/image';
import AuthRefreshOnSignIn from '@/components/AuthRefreshOnSignIn';

export default async function HomePage() {
  const user = await checkUser();

  if (!user) {
    return (
      <>
        <Guest />
        <AuthRefreshOnSignIn />
      </>
    );
  }

  const firstName = user.name?.split(' ')[0] || 'User';

  return (
    <main className="bg-[#f8fafc] dark:bg-[#0f172a] min-h-screen pb-12 transition-colors duration-300">
      <header className="sticky top-0 z-30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Image
                src={user.imageUrl || '/default-avatar.png'}
                alt="Profile"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full border-2 border-indigo-500 p-0.5 object-cover"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Dashboard</p>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Hello, {firstName}</h1>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
            <span className="animate-pulse w-2 h-2 bg-indigo-500 rounded-full"></span>
            <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Active</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        
        {/* TOP SECTION: Stats and Quick Add */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-8 bg-indigo-600 rounded-[2.5rem] p-6 shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-indigo-100 text-xs font-black uppercase tracking-widest mb-1">Financial Health</p>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-6">Overview</h2>
              <ExpenseStats /> 
            </div>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl"></div>
          </section>

          <div className="lg:col-span-4 h-full">
            <AddNewRecord />
          </div>
        </div>

        {/* MIDDLE SECTION: Chart and AI - Large Space for Visuals */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Chart gets a wider display now */}
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-700 shadow-xl">
             <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Spending Trends</h3>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">Analysis</p>
                </div>
                <span className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl">📊</span>
             </div>
             <div className="w-full min-h-[300px]">
               <RecordChart />
             </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-1 border border-slate-100 dark:border-slate-700 shadow-xl overflow-hidden">
            <AIInsights />
          </div>
        </div>

        {/* BOTTOM SECTION: Full Width History */}
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-2 border border-slate-100 dark:border-slate-700 shadow-xl">
          <RecordHistory />
        </div>

      </div>
    </main>
  );
}