'use client';

import { Mail, Phone, MapPin, Clock, HelpCircle, Send, Sparkles, ShieldCheck } from 'lucide-react';

const ContactPage = () => {
  return (
    <div className='min-h-screen bg-[#f8fafc] dark:bg-[#020617] text-slate-900 dark:text-slate-100 transition-colors duration-500'>
      
      {/* 1. HERO SECTION */}
      <section className='relative pt-20 pb-16 px-4 overflow-hidden'>
        <div className='absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent opacity-50' />
        
        <div className='relative z-10 max-w-5xl mx-auto text-center'>
          <div className='inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl shadow-sm mb-8'>
            <Sparkles className='text-indigo-500' size={16} />
            <span className='text-[10px] font-black uppercase tracking-[0.2em] text-slate-500'>We're here to help</span>
          </div>
          
          <h1 className='text-4xl md:text-7xl font-black tracking-tighter uppercase mb-6 leading-none'>
            Get in <br />
            <span className='text-indigo-600 dark:text-indigo-500'>Touch</span>
          </h1>
          
          <p className='text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed'>
            Have questions about your account or need help with budgeting? Our support team is ready to assist you.
          </p>
        </div>
      </section>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 pb-24'>
        
        {/* 2. UNIFORM CONTACT CHANNELS */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          
          {/* Email Card */}
          <div className='group relative bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-200/10 transition-transform hover:-translate-y-2'>
            <div className='w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-500/20'>
              <Mail size={24} />
            </div>
            <h3 className='text-xl font-black uppercase tracking-tighter mb-2'>Email Us</h3>
            <p className='text-sm text-slate-500 dark:text-slate-400 mb-6'>The best way to get help with technical questions or account issues.</p>
            <a href='mailto:support@smartjuanpeso.ai' className='text-indigo-600 dark:text-indigo-400 font-bold hover:underline decoration-2 underline-offset-4'>
              support@smartjuanpeso.ai
            </a>
          </div>

          {/* Phone Card */}
          <div className='group relative bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-200/10 transition-transform hover:-translate-y-2'>
            <div className='w-12 h-12 bg-slate-900 dark:bg-indigo-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-500/20'>
              <Phone size={24} />
            </div>
            <h3 className='text-xl font-black uppercase tracking-tighter mb-2'>Call Us</h3>
            <p className='text-sm text-slate-500 dark:text-slate-400 mb-6'>Need to talk to a human? Give us a call during our office hours.</p>
            <a href='tel:+639511518567' className='text-slate-900 dark:text-white font-bold'>
              +63 (951) 151-8567
            </a>
          </div>

          {/* Location Card - NOW UNIFORM */}
          <div className='group relative bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200/60 dark:border-slate-800/60 shadow-xl shadow-slate-200/10 transition-transform hover:-translate-y-2'>
            <div className='w-12 h-12 bg-slate-800 dark:bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-500/20'>
              <MapPin size={24} />
            </div>
            <h3 className='text-xl font-black uppercase tracking-tighter mb-2'>Visit Us</h3>
            <p className='text-sm text-slate-500 dark:text-slate-400 mb-6'>
              Santa Maria, Bulacan<br />
              Central Luzon, Philippines.
            </p>
            <span className='text-[10px] font-black uppercase tracking-widest text-indigo-500'>Main Office</span>
          </div>
        </div>

        {/* 3. SUPPORT OPERATIONS & FAQ */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
          
          {/* Support Hours */}
          <div className='lg:col-span-5 bg-slate-900 dark:bg-indigo-600 rounded-[3.5rem] p-10 text-white relative overflow-hidden'>
            <div className='absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20' />
            <div className='relative z-10'>
              <div className='flex items-center gap-3 mb-8'>
                <Clock className='text-indigo-300' size={24} />
                <h3 className='text-2xl font-black uppercase tracking-tighter'>Office Hours</h3>
              </div>
              <div className='space-y-4'>
                <div className='flex justify-between border-b border-white/10 pb-2'>
                  <span className='text-indigo-100/60 uppercase text-xs font-bold'>Mon — Fri</span>
                  <span className='font-mono'>09:00 - 18:00</span>
                </div>
                <div className='flex justify-between border-b border-white/10 pb-2'>
                  <span className='text-indigo-100/60 uppercase text-xs font-bold'>Saturday</span>
                  <span className='font-mono'>10:00 - 16:00</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-indigo-100/60 uppercase text-xs font-bold'>Sunday</span>
                  <span className='text-indigo-300 font-bold'>Closed</span>
                </div>
              </div>
              <div className='mt-10 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10'>
                <div className='flex items-center gap-2 mb-1'>
                  <ShieldCheck size={14} className='text-indigo-300' />
                  <span className='text-[10px] font-black uppercase tracking-widest'>Privacy First</span>
                </div>
                <p className='text-xs text-indigo-100/80'>Your conversations are always encrypted and confidential.</p>
              </div>
            </div>
          </div>

          {/* Quick Help Items */}
          <div className='lg:col-span-7 bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-xl'>
            <div className='flex items-center gap-3 mb-8'>
              <HelpCircle className='text-indigo-500' size={24} />
              <h3 className='text-2xl font-black uppercase tracking-tighter'>Frequent Questions</h3>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {[
                { title: 'Login Help', desc: 'Problems signing in to your account' },
                { title: 'AI Insights', desc: 'How our smart tracking works' },
                { title: 'Exporting', desc: 'Downloading your data to CSV' },
                { title: 'Privacy', desc: 'How we keep your data safe' },
              ].map((item, i) => (
                <div key={i} className='p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:border-indigo-500/30 transition-colors cursor-pointer group'>
                  <h4 className='font-black uppercase text-xs tracking-tight mb-1 group-hover:text-indigo-500 transition-colors'>{item.title}</h4>
                  <p className='text-xs text-slate-500'>{item.desc}</p>
                </div>
              ))}
            </div>
            <button className='w-full mt-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-indigo-600 dark:hover:bg-indigo-500 dark:hover:text-white transition-all'>
              Send a Message <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;