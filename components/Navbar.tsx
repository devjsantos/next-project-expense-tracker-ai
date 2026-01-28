'use client';

import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useCallback, useRef } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import NotificationCenter from '@/components/NotificationCenter';
import { Bell, LayoutDashboard, Wallet, Menu, X, Download, Info, Mail, Cpu } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Navbar() {
  const { isSignedIn } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstall(false);
  };

  const fetchUnread = useCallback(async () => {
    if (!isSignedIn || document.hidden) return;
    try {
      const res = await fetch('/api/notifications?unread=true');
      if (!res.ok) return;
      const json = await res.json();
      setUnreadCount(Array.isArray(json.notifications) ? json.notifications.length : 0);
    } catch (err) {
      console.error('Fetch failure:', err);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) return;
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    window.addEventListener('notifications:changed', fetchUnread);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications:changed', fetchUnread);
    };
  }, [isSignedIn, fetchUnread]);

  return (
    <nav className="sticky top-0 z-[100] bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
        {/* Logo Section */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative w-12 h-12 group-hover:scale-110 transition-transform">
              <Image 
                src="/logo/logo.png" 
                alt="SmartJuanPeso AI Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-black text-lg tracking-tighter text-slate-900 dark:text-white hidden sm:block">
              SMART<span className="text-indigo-500">JUANPESO</span> AI
            </span>
          </Link>

          {/* Desktop Nav - Centered Alignment */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100/50 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
            <NavLink 
              href={isSignedIn ? "/dashboard" : "/"} 
              icon={<LayoutDashboard size={16} />} 
              label={isSignedIn ? "Neural Dashboard" : "Central Hub"} 
            />
            
            <SignedOut>
              <NavLink href="/about" icon={<Info size={16} />} label="Architecture" />
              <NavLink href="/contact" icon={<Mail size={16} />} label="Support Desk" />
            </SignedOut>

            <SignedIn>
              <NavLink href="/budget" icon={<Wallet size={16} />} label="Logic Planner" />
            </SignedIn>
          </div>

          {/* Actions Section */}
          <div className="flex items-center gap-3 shrink-0">
            <ThemeToggle />
            
            <SignedIn>
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2.5 rounded-2xl transition-all relative ${
                    showNotifications 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-950">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-4 w-[350px] sm:w-[400px] animate-in slide-in-from-top-2 duration-200">
                    <NotificationCenter />
                  </div>
                )}
              </div>
              <div className="pl-2 border-l border-slate-200 dark:border-slate-800 ml-1">
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>

            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20">
                  Initialize
                </button>
              </SignInButton>
            </SignedOut>

            {showInstall && (
              <button onClick={handleInstallClick} className="hidden lg:flex p-2.5 bg-emerald-500/10 text-emerald-600 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all">
                <Download size={20} />
              </button>
            )}

            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-600">
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-2 animate-in slide-in-from-top-5">
            <Link href={isSignedIn ? "/dashboard" : "/"} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 font-bold text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300">
             <LayoutDashboard size={18} /> {isSignedIn ? "Neural Dashboard" : "Central Hub"}
            </Link>
            
            <SignedOut>
              <Link href="/about" className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 font-bold text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300">
                <Info size={18} /> Architecture
              </Link>
              <Link href="/contact" className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 font-bold text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300">
                <Mail size={18} /> Support Desk
              </Link>
            </SignedOut>

            <SignedIn>
             <Link href="/budget" className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 font-bold text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300">
               <Wallet size={18} /> Logic Planner
             </Link>
            </SignedIn>
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all">
      {icon} {label}
    </Link>
  );
}