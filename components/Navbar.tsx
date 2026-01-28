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

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setDeferredPrompt(null);
      setShowInstall(false);
    } else {
      console.log('User dismissed the install prompt');
    }
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
            <div className="relative w-10 h-10 group-hover:scale-110 transition-transform">
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

          {/* Desktop Nav - User Friendly Labels */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100/50 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
            <NavLink
              href={isSignedIn ? "/dashboard" : "/"}
              icon={<LayoutDashboard size={16} />}
              label={isSignedIn ? "Dashboard" : "Home"}
            />

            <SignedOut>
              <NavLink href="/about" icon={<Info size={16} />} label="How it Works" />
              <NavLink href="/contact" icon={<Mail size={16} />} label="Help" />
            </SignedOut>

            <SignedIn>
              <NavLink href="/budget" icon={<Wallet size={16} />} label="Budgeting" />
            </SignedIn>
          </div>

          {/* Actions Section */}
          <div className="flex items-center gap-3 shrink-0">
            <ThemeToggle />

            {/* FIXED: Install Button - Visible on mobile/tablet now */}
            {showInstall && (
              <button
                onClick={handleInstallClick}
                className="flex p-2.5 bg-indigo-500/10 text-indigo-600 rounded-2xl hover:bg-indigo-500 hover:text-white transition-all animate-bounce-subtle"
                title="Install App"
              >
                <Download size={20} />
              </button>
            )}

            <SignedIn>
              {/* ... (Notifications logic) */}
              <div className="pl-2 border-l border-slate-200 dark:border-slate-800 ml-1">
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>

            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>

            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-600">
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - User Friendly Labels */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-2">
          <Link href={isSignedIn ? "/dashboard" : "/"} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 font-bold text-xs uppercase tracking-widest">
            <LayoutDashboard size={18} /> {isSignedIn ? "Dashboard" : "Home"}
          </Link>

          <SignedOut>
            <Link href="/about" className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 font-bold text-xs uppercase tracking-widest">
              <Info size={18} /> How it Works
            </Link>
            <Link href="/contact" className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 font-bold text-xs uppercase tracking-widest">
              <Mail size={18} /> Help
            </Link>
          </SignedOut>

          <SignedIn>
            <Link href="/budget" className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 font-bold text-xs uppercase tracking-widest">
              <Wallet size={18} /> Budgeting
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