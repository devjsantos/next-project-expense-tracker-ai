'use client';

import { SignInButton } from '@clerk/nextjs';
import { 
  ArrowRight, 
  BrainCircuit, 
  Sparkles, 
  LayoutDashboard, 
  HelpCircle, 
  ShieldCheck, 
  Zap,
  Star,
  TrendingUp,
  LineChart,
  Shield
} from 'lucide-react';

const Guest = () => {
  return (
    <div className='min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-100 selection:bg-indigo-500/30'>
      
      {/* 1. Hero Section: Friendly & Bold */}
      <section className='relative pt-24 pb-20 md:pt-32 md:pb-32 px-6 overflow-hidden border-b border-slate-100 dark:border-slate-800/50'>
        {/* Subtle Background Elements */}
        <div className='absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.07]' 
             style={{ backgroundImage: `radial-gradient(#4f46e5 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
        <div className='absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent blur-3xl' />

        <div className='relative z-10 max-w-5xl mx-auto text-center'>
          <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-indigo-500/10 border border-slate-200 dark:border-indigo-500/20 mb-8 animate-fade-in'>
            <span className='relative flex h-2 w-2'>
              <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75'></span>
              <span className='relative inline-flex rounded-full h-2 w-2 bg-indigo-500'></span>
            </span>
            <span className='text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400'>
              The Future of Saving is Here
            </span>
          </div>

          <h1 className='text-4xl md:text-7xl font-black tracking-tighter mb-8 leading-[1.1]'>
            Master Your Money with <br />
            <span className='bg-gradient-to-r from-indigo-600 via-blue-500 to-teal-500 bg-clip-text text-transparent'>
              Smart AI Insights
            </span>
          </h1>

          <p className='text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed'>
            SmartJuanPeso AI takes the guesswork out of budgeting. We automatically 
            track your spending so you can focus on growing your savings.
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center items-center mb-16'>
            <SignInButton mode="modal">
              <button className='group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/25 flex items-center gap-3'>
                Get Started for Free
                <ArrowRight size={18} className='group-hover:translate-x-1 transition-transform' />
              </button>
            </SignInButton>
            <button className='px-8 py-4 bg-transparent border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl font-bold transition-all'>
              See How It Works
            </button>
          </div>

          {/* Feature Grid: Simplified Labels */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 text-left'>
            {[
              { icon: <TrendingUp />, title: 'Smart Tracking', desc: 'See exactly where your money goes with automatic spending reports.' },
              { icon: <Sparkles />, title: 'Easy Categories', desc: 'We automatically organize your expenses so you don’t have to.' },
              { icon: <Shield />, title: 'Safe & Secure', desc: 'Your data is encrypted and private. We never sell your personal info.' }
            ].map((feature, i) => (
              <div key={i} className='p-6 rounded-3xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50 backdrop-blur-sm'>
                <div className='text-indigo-500 mb-4'>{feature.icon}</div>
                <h3 className='font-black uppercase tracking-widest text-[11px] mb-2'>{feature.title}</h3>
                <p className='text-sm text-slate-500 dark:text-slate-400 leading-relaxed'>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. FAQ Section: Human Language */}
      <section className='py-24 px-6 bg-slate-50 dark:bg-[#020617]'>
        <div className='max-w-4xl mx-auto'>
          <div className='mb-16 text-center lg:text-left'>
            <h2 className='text-3xl md:text-5xl font-black tracking-tighter uppercase mb-4'>
              Common <span className='text-indigo-600'>Questions</span>
            </h2>
            <div className='h-1 w-20 bg-indigo-500 rounded-full mx-auto lg:mx-0' />
          </div>

          <div className='space-y-4'>
            {[
              { q: "What is SmartJuanPeso AI?", a: "It's a smart assistant that helps you track expenses, set budgets, and save money using helpful AI insights.", icon: <HelpCircle /> },
              { q: "Is my data safe?", a: "Absolutely. We use bank-level encryption (AES-256) to ensure your financial information is for your eyes only.", icon: <ShieldCheck /> },
              { q: "Do I have to pay?", a: "The core tracking and budgeting tools are 100% free. We offer a Pro version for advanced financial forecasting.", icon: <Zap /> }
            ].map((item, i) => (
              <div key={i} className='group p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all hover:border-indigo-500/50'>
                <div className='flex gap-6'>
                  <div className='text-indigo-500 shrink-0'>{item.icon}</div>
                  <div>
                    <h3 className='text-lg font-bold mb-2 group-hover:text-indigo-500 transition-colors'>{item.q}</h3>
                    <p className='text-slate-500 dark:text-slate-400 leading-relaxed text-sm'>{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Testimonials: Realistic Feedback */}
      <section className='py-24 px-6'>
        <div className='max-w-6xl mx-auto'>
          <div className='flex flex-col md:flex-row justify-between items-end gap-6 mb-16'>
            <div>
              <p className='text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-2'>Success Stories</p>
              <h2 className='text-3xl md:text-5xl font-black tracking-tighter uppercase'>What Users Say</h2>
            </div>
            <p className='text-slate-500 dark:text-slate-400 max-w-xs text-sm'>Join thousands of people taking control of their financial future.</p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {[
              { name: "Sarah L.", role: "Freelancer", text: "I finally found out I was spending $200 a month on subscriptions I don't even use!" },
              { name: "John D.", role: "Small Business Owner", text: "Simple, clean, and actually helpful. The AI categorization is surprisingly accurate." },
              { name: "Emily R.", role: "Student", text: "The budgeting tool is so easy to use. I've saved more this month than I did all of last year." }
            ].map((t, i) => (
              <div key={i} className='relative p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800'>
                <div className='flex text-indigo-500 mb-6'>
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                </div>
                <p className='italic text-slate-600 dark:text-slate-300 mb-8'>"{t.text}"</p>
                <div className='flex items-center gap-4'>
                  <div className='w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-teal-500' />
                  <div>
                    <h4 className='font-bold text-sm'>{t.name}</h4>
                    <p className='text-[10px] uppercase tracking-widest text-slate-500'>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Guest;