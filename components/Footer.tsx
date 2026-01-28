'use client';

import Link from 'next/link';
import Image from 'next/image';
import { SignedIn, SignedOut, useUser } from '@clerk/nextjs';
import { 
  ShieldCheck, 
  BarChart3, 
  Zap, 
  Globe, 
  Github, 
  Twitter,
  ChevronRight
} from 'lucide-react';

const Footer = () => {
  const { isSignedIn } = useUser();

  return (
    <footer className='relative bg-white dark:bg-[#020617] border-t border-slate-200 dark:border-slate-800 transition-colors duration-500'>
      {/* Subtle Accent Line */}
      <div className='absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50' />

      <div className='max-w-7xl mx-auto px-6 py-16'>
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16'>
          
          {/* 1. Brand Identity with Logo */}
          <div className='lg:col-span-5 space-y-6 text-center lg:text-left'>
            <div className='flex items-center justify-center lg:justify-start gap-3'>
              <div className='relative w-10 h-10 overflow-hidden rounded-xl shadow-lg shadow-indigo-500/10'>
                <Image 
                  src="/logo/logo.png" 
                  alt="SmartJuanPeso Logo" 
                  fill 
                  className="object-contain"
                  priority
                />
              </div>
              <h2 className='text-2xl font-black tracking-tighter uppercase text-slate-900 dark:text-white'>
                SmartJuanPeso <span className='text-indigo-600 dark:text-indigo-500'>AI</span>
              </h2>
            </div>
            <p className='text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto lg:mx-0'>
              The easiest way to track your money in the Philippines. We use smart AI to 
              help you understand your spending, save more, and reach your goals faster.
            </p>
            <div className='flex items-center justify-center lg:justify-start gap-4'>
              <div className='p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer'>
                <Twitter size={18} />
              </div>
              <div className='p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer'>
                <Github size={18} />
              </div>
            </div>
          </div>

          {/* 2. Simplified Navigation Links */}
          <div className='lg:col-span-3 text-center lg:text-left'>
            <h3 className='text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 mb-6'>
              Quick Links
            </h3>
            <div className='flex flex-col space-y-4'>
              <Link
                href={isSignedIn ? '/dashboard' : '/'}
                className='group flex items-center justify-center lg:justify-start gap-2 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-indigo-500 transition-colors'
              >
                {isSignedIn ? 'My Dashboard' : 'Home'}
                <ChevronRight size={12} className='opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all' />
              </Link>

              <SignedIn>
                <Link href='/budget' className='group flex items-center justify-center lg:justify-start gap-2 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-indigo-500 transition-colors'>
                  Budgeting Tools
                  <ChevronRight size={12} className='opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all' />
                </Link>
              </SignedIn>

              <SignedOut>
                <Link href='/about' className='group flex items-center justify-center lg:justify-start gap-2 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-indigo-500 transition-colors'>
                  How it Works
                  <ChevronRight size={12} className='opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all' />
                </Link>
                <Link href='/contact' className='group flex items-center justify-center lg:justify-start gap-2 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-indigo-500 transition-colors'>
                  Get Help
                  <ChevronRight size={12} className='opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all' />
                </Link>
              </SignedOut>
            </div>
          </div>

          {/* 3. Reassured Features */}
          <div className='lg:col-span-4 text-center lg:text-left'>
            <h3 className='text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 mb-6'>
              Our Promise
            </h3>
            <div className='grid grid-cols-1 gap-3'>
              {[
                { icon: <Zap size={14} />, label: 'Fast & Reliable' },
                { icon: <ShieldCheck size={14} />, label: 'Privacy Protected' },
                { icon: <BarChart3 size={14} />, label: 'Smart Insights' }
              ].map((item, i) => (
                <div key={i} className='flex items-center justify-center lg:justify-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 text-slate-500 dark:text-slate-400'>
                  <span className='text-indigo-500'>{item.icon}</span>
                  <span className='text-[10px] font-black uppercase tracking-widest'>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className='pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6'>
          <div className='flex items-center gap-4 order-2 md:order-1'>
            <p className='text-[10px] font-black uppercase tracking-widest text-slate-400'>
              © {new Date().getFullYear()} SmartJuanPeso AI
            </p>
            <div className='h-3 w-[1px] bg-slate-200 dark:bg-slate-800' />
            <div className='flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-500'>
              <Globe size={10} />
              <span>Built in the Philippines</span>
            </div>
          </div>

          <div className='order-1 md:order-2'>
            <div className='px-4 py-2 bg-slate-900 dark:bg-indigo-600 rounded-xl flex items-center gap-3 shadow-xl'>
              <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]' />
              <span className='text-[10px] font-black uppercase tracking-widest text-white'>
                Created by JMS
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;