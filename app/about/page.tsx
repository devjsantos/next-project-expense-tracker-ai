'use client';

import Link from 'next/link';
import { 
  BrainCircuit, 
  Sparkles, 
  Target, 
  BarChart3, 
  Zap, 
  ShieldCheck, 
  ChevronRight, 
  Rocket,
  Users
} from 'lucide-react';

const AboutPage = () => {
  return (
    <div className='min-h-screen bg-[#f8fafc] dark:bg-[#020617] text-slate-900 dark:text-slate-100 transition-colors duration-500 pb-20'>
      
      {/* 1. HERO SECTION */}
      <section className='relative pt-24 pb-16 px-4 overflow-hidden'>
        <div className='absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent opacity-60' />
        
        <div className='relative z-10 max-w-5xl mx-auto text-center'>
          <div className='inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl shadow-sm mb-8'>
            <BrainCircuit className='text-indigo-500' size={16} />
            <span className='text-[10px] font-black uppercase tracking-[0.2em] text-slate-500'>The Neural Manifesto</span>
          </div>
          
          <h1 className='text-5xl md:text-8xl font-black tracking-tighter uppercase mb-6 leading-[0.9]'>
            Smarter Money <br />
            <span className='text-indigo-600 dark:text-indigo-500'>Starts Here</span>
          </h1>
          
          <p className='text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10'>
            SmartJuanPeso AI is an intelligent ecosystem designed to bridge the gap between complex financial data and actionable human decisions.
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
            <Link href='/sign-up' className='px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white transition-all shadow-xl'>
              Deploy Smart Account
            </Link>
            <Link href='/contact' className='px-8 py-4 border border-slate-200 dark:border-slate-800 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all'>
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20'>
        
        {/* 2. STATS GRID (The Mission) */}
        <section className='relative group'>
          <div className='absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-[3.5rem] blur-xl opacity-50' />
          <div className='relative bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-[3rem] p-10 md:p-16 overflow-hidden'>
            <div className='max-w-3xl'>
              <div className='inline-flex items-center gap-2 text-indigo-500 mb-6'>
                <Target size={20} />
                <span className='text-[10px] font-black uppercase tracking-[0.3em]'>Our Objective</span>
              </div>
              <h2 className='text-3xl md:text-5xl font-black uppercase tracking-tighter mb-8 leading-none'>
                Transforming the <span className='text-slate-400'>Financial DNA</span> through Intelligence
              </h2>
              <p className='text-slate-500 dark:text-slate-400 text-lg leading-relaxed mb-12'>
                We leverage neural spending analysis to revolutionize how individuals achieve wellness. No more manual spreadsheets—just pure, automated logic tailored to your life.
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800'>
              {[
                { label: 'Neural Users', val: '10K+', color: 'text-indigo-600' },
                { label: 'Capital Tracked', val: '₱2.4M', color: 'text-slate-900 dark:text-white' },
                { label: 'Logic Accuracy', val: '99.9%', color: 'text-indigo-500' }
              ].map((stat, i) => (
                <div key={i}>
                  <p className={`text-4xl font-black tracking-tighter ${stat.color}`}>{stat.val}</p>
                  <p className='text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1'>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. CORE ARCHITECTURE (Features) */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          {[
            { 
              icon: <Zap size={24} />, 
              title: 'Neural Insights', 
              desc: 'Deep learning analysis of every transaction to find hidden leaks in your budget.' 
            },
            { 
              icon: <BarChart3 size={24} />, 
              title: 'Auto-Ledger', 
              desc: 'Intelligent categorization with 99% accuracy. No manual input required.' 
            },
            { 
              icon: <ShieldCheck size={24} />, 
              title: 'Secure Nodes', 
              desc: 'Bank-grade encryption protecting your financial privacy at every step.' 
            }
          ].map((feature, i) => (
            <div key={i} className='bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-200/5 hover:border-indigo-500/50 transition-colors'>
              <div className='w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-500 mb-6'>
                {feature.icon}
              </div>
              <h3 className='text-lg font-black uppercase tracking-tighter mb-3'>{feature.title}</h3>
              <p className='text-sm text-slate-500 dark:text-slate-400 leading-relaxed'>{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* 4. STORY SECTION */}
        <section className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
          <div className='space-y-6'>
            <div className='inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 px-3 py-1 rounded-full'>
              <Rocket size={14} />
              <span className='text-[10px] font-black uppercase tracking-widest'>The Origin</span>
            </div>
            <h2 className='text-4xl font-black uppercase tracking-tighter leading-none'>Built for the <br /> Next-Gen Economy</h2>
            <p className='text-slate-500 dark:text-slate-400 leading-relaxed'>
              SmartJuanPeso AI was born in 2025 with a single mission: to provide everyone with the tools of a professional financial analyst through the power of AI.
            </p>
            <div className='flex items-center gap-4 py-4'>
              <div className='flex -space-x-3'>
                {[1,2,3,4].map(i => (
                  <div key={i} className={`w-10 h-10 rounded-full border-4 border-[#f8fafc] dark:border-[#020617] bg-slate-200 dark:bg-slate-800 flex items-center justify-center`}>
                    <Users size={14} className='text-slate-400' />
                  </div>
                ))}
              </div>
              <p className='text-[10px] font-black uppercase tracking-widest text-slate-400'>Trusted by 10,000+ Nodes</p>
            </div>
          </div>
          
          <div className='bg-slate-900 dark:bg-indigo-600 rounded-[3.5rem] p-10 relative overflow-hidden text-white shadow-2xl'>
            <div className='absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mb-20 -mr-20' />
            <h4 className='text-xl font-black uppercase tracking-tighter mb-6'>Our Core Stack</h4>
            <div className='space-y-4'>
              {['AI-First Logic', 'Clerk Managed Auth', 'Neural Dashboard', 'Real-time Ledger'].map((item, i) => (
                <div key={i} className='flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10'>
                  <div className='w-2 h-2 bg-indigo-400 rounded-full shadow-[0_0_10px_rgba(129,140,248,0.8)]' />
                  <span className='text-xs font-bold uppercase tracking-widest'>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. CTA SECTION */}
        <section className='bg-slate-900 dark:bg-slate-900 border border-slate-800 rounded-[4rem] p-12 md:p-20 text-center relative overflow-hidden'>
          <div className='absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]' />
          
          <div className='relative z-10'>
            <h2 className='text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-8 leading-none'>
              Ready to Upgrade your <br /> <span className='text-indigo-500'>Financial OS?</span>
            </h2>
            <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
              <Link href='/sign-up' className='group bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all shadow-2xl shadow-indigo-500/20'>
                Initialize Account <ChevronRight size={16} className='group-hover:translate-x-1 transition-transform' />
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default AboutPage;