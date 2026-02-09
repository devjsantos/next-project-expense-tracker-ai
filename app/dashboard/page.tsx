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

// IMPORT YOUR ACTIONS
import getUserRecord from '@/app/actions/getUserRecord';
import getBestWorstExpense from '@/app/actions/getBestWorstExpense';
import getForecast from '@/app/actions/getForecast';

export default async function DashboardPage() {
  const user = await checkUser();

  if (!user) {
    redirect('/');
  }

  // FETCH DATA FOR STATS
  const [userRecordResult, rangeResult, forecast] = await Promise.all([
    getUserRecord(),
    getBestWorstExpense(),
    getForecast(),
  ]);

  const firstName = user.name?.split(' ')[0] || 'User';

  return (
    <main className="bg-[#f8fafc] dark:bg-[#020617] min-h-screen pb-20 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-10 space-y-6 sm:space-y-10">

        {/* 1. TOP NAVIGATION / GREETING */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 sm:p-5 rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-200/5">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl blur opacity-20"></div>
              <Image
                src={user.imageUrl || '/default-avatar.png'}
                alt="Profile"
                width={50}
                height={50}
                className="relative rounded-xl border-2 border-white dark:border-slate-800 object-cover sm:w-[54px] sm:h-[54px]"
                priority
              />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-0.5">Welcome Back</p>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tighter truncate">
                Mabuhay, {firstName}!
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800/40 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 self-start md:self-auto">
            <Fingerprint className="text-indigo-500" size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Personal Account</span>
          </div>
        </div>

        {/* 2. SUMMARY & QUICK ACTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          <div className="lg:col-span-8 bg-slate-900 dark:bg-indigo-600 rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-400/20 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-indigo-400/30 transition-colors duration-700"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                  <Wallet className="text-white" size={20} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase">My Finances</h2>
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Real-time Balance</p>
                </div>
              </div>
              
              {/* PASS THE DATA HERE */}
              <ExpenseStats 
                userRecordResult={userRecordResult}
                rangeResult={rangeResult}
                forecast={forecast}
              />

            </div>
          </div>
          <div className="lg:col-span-4 h-full">
            <AddNewRecord />
          </div>
        </div>

        {/* Rest of your components (Chart, Insights, History) */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-200/60 dark:border-slate-800/60 shadow-xl">
           <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex items-center gap-3">
             <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-indigo-600">
               <TrendingUp size={20} />
             </div>
             <div>
               <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Spending Trends</h3>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Monthly Overview</p>
             </div>
           </div>
           <div className="p-4 sm:p-8">
             <RecordChart />
           </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 blur-2xl rounded-[2.5rem]"></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                  <BrainCircuit size={18} />
                </div>
                <div>
                  <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Smart Insights</p>
                  <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">Powered by AI</p>
                </div>
              </div>
              <Sparkles size={18} className="text-indigo-500 animate-pulse" />
            </div>
            <div className="p-4 sm:p-8">
              <AIInsights />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 px-6">
            <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 border border-slate-200 dark:border-slate-800 shadow-sm">
              <History size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">Recent Activity</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Your Latest Transactions</p>
            </div>
          </div>
          <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl p-2 sm:p-4">
            <RecordHistory />
          </div>
        </div>
      </div>
    </main>
  );
}