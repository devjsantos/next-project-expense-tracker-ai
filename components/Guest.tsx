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
  Star
} from 'lucide-react';

const Guest = () => {
  return (
    <div className='min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-100 selection:bg-indigo-500/30'>
      
      {/* 1. Hero Section: The "Neural Grid" */}
      <section className='relative pt-24 pb-20 md:pt-32 md:pb-32 px-6 overflow-hidden border-b border-slate-100 dark:border-slate-800/50'>
        {/* Animated Background Elements */}
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
              V2.0 Neural Engine Online
            </span>
          </div>

          <h1 className='text-4xl md:text-7xl font-black tracking-tighter mb-8 leading-[1.1]'>
            Master Your Money with <br />
            <span className='bg-gradient-to-r from-indigo-600 via-blue-500 to-teal-500 bg-clip-text text-transparent italic'>
              Autonomous Intelligence
            </span>
          </h1>

          <p className='text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed'>
            SmartJuanPeso AI isn't just a tracker. It's a neural financial layer that 
            categorizes, analyzes, and optimizes your capital in real-time.
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center items-center mb-16'>
            <SignInButton mode="modal">
              <button className='group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/25 flex items-center gap-3'>
                Deploy SmartJuan AI
                <ArrowRight size={18} className='group-hover:translate-x-1 transition-transform' />
              </button>
            </SignInButton>
            <button className='px-8 py-4 bg-transparent border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl font-bold transition-all'>
              View Documentation
            </button>
          </div>

          {/* Feature Grid */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 text-left'>
            {[
              { icon: <BrainCircuit />, title: 'Neural Insights', desc: 'Predictive spending analysis based on 50+ data points.' },
              { icon: <Sparkles />, title: 'Auto-Context', desc: 'Instant categorization using natural language processing.' },
              { icon: <LayoutDashboard />, title: 'Global Interface', desc: 'Visualizing your net worth across all liquidity pools.' }
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

      {/* 2. FAQ Section: High Contrast */}
      <section className='py-24 px-6 bg-slate-50 dark:bg-[#020617]'>
        <div className='max-w-4xl mx-auto'>
          <div className='mb-16 text-center lg:text-left'>
            <h2 className='text-3xl md:text-5xl font-black tracking-tighter uppercase mb-4'>
              System <span className='text-indigo-600'>Support</span>
            </h2>
            <div className='h-1 w-20 bg-indigo-500 rounded-full mx-auto lg:mx-0' />
          </div>

          <div className='space-y-4'>
            {[
              { q: "What is SmartJuanPeso AI?", a: "A next-generation financial operating system designed to automate budgeting via deep-learning patterns.", icon: <HelpCircle /> },
              { q: "Data Security Protocol?", a: "We use AES-256 encryption and Clerk-level authentication to ensure your assets stay private.", icon: <ShieldCheck /> },
              { q: "Is it really free?", a: "The Core Engine is free for everyone. Advanced neural forecasting is available in Pro.", icon: <Zap /> }
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

      {/* 3. Testimonials: The "Wall of Proof" */}
      <section className='py-24 px-6'>
        <div className='max-w-6xl mx-auto'>
          <div className='flex flex-col md:flex-row justify-between items-end gap-6 mb-16'>
            <div>
              <p className='text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-2'>Consensus</p>
              <h2 className='text-3xl md:text-5xl font-black tracking-tighter uppercase'>Intelligence Reports</h2>
            </div>
            <p className='text-slate-500 dark:text-slate-400 max-w-xs text-sm'>Verified feedback from our global network of financial users.</p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {[
              { name: "Sarah L.", role: "Wealth Analyst", text: "The predictive insights accurately flagged my subscription bloat within 48 hours." },
              { name: "John D.", role: "Tech Entrepreneur", text: "Finally, a dashboard that treats my finances like a modern tech stack." },
              { name: "Emily R.", role: "Creative Director", text: "The UI is incredible, but the auto-categorization is what keeps me coming back." }
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