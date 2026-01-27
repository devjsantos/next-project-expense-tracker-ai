'use client';

import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from '@clerk/nextjs';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import NotificationCenter from '@/components/NotificationCenter';

/* ================== TYPES ================== */

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface NotificationItem {
  id: string;
}

interface NotificationResponse {
  notifications?: NotificationItem[];
}

/* ================= COMPONENT ================= */

export default function Navbar() {
  const { isSignedIn } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | undefined>(undefined);
  const [showInstall, setShowInstall] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  /* ===== PWA INSTALL LOGIC ===== */
  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(undefined);
        setShowInstall(false);
      }
    } catch (e) {
      console.error("Install prompt failed", e);
    }
  };

  /* ===== NOTIFICATIONS LOGIC (FIXED) ===== */
  const fetchUnread = useCallback(async () => {
    // Only fetch if user is signed in and tab is active
    if (!isSignedIn || (typeof document !== 'undefined' && document.hidden)) return;

    try {
      const res = await fetch('/api/notifications?unread=true');
      
      // Instead of throwing an error and crashing, we just exit if the response is bad
      if (!res.ok) {
        console.warn(`Notification API returned status: ${res.status}`);
        return; 
      }

      const json = (await res.json()) as NotificationResponse;
      
      // Safely check if notifications exist and is an array
      const count = (json && Array.isArray(json.notifications)) 
        ? json.notifications.length 
        : 0;
        
      setUnreadCount(count);
    } catch (err) {
      // Silence network errors (like being offline) to prevent console spam
      console.error('Silent fetch failure:', err);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) {
      setUnreadCount(0);
      return;
    }

    fetchUnread();

    const interval = setInterval(fetchUnread, 60000);
    const handleRevalidation = () => fetchUnread();

    window.addEventListener('visibilitychange', handleRevalidation);
    window.addEventListener('notifications:changed', handleRevalidation);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleRevalidation);
      window.removeEventListener('notifications:changed', handleRevalidation);
    };
  }, [isSignedIn, fetchUnread]);

  /* ===== UI COMPONENTS ===== */
  const NavItems = () => (
    <>
      <Link href="/" onClick={closeMobileMenu} className="nav-link px-3 py-2 text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
        {isSignedIn ? 'Dashboard' : 'Home'}
      </Link>
      <SignedIn>
        <Link href="/budget" onClick={closeMobileMenu} className="nav-link px-3 py-2 text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
          Planner
        </Link>
      </SignedIn>
      <SignedOut>
        <Link href="/features" onClick={closeMobileMenu} className="nav-link px-3 py-2 text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
          Features
        </Link>
        <Link href="/support" onClick={closeMobileMenu} className="nav-link px-3 py-2 text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-indigo-400">
          Support
        </Link>
      </SignedOut>
    </>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-500 rounded-lg flex items-center justify-center shadow-md transition-transform group-hover:scale-105">
                <span className="text-white text-sm">₱</span>
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent hidden sm:block">
                SmartJuanPeso AI
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-1 text-gray-600 dark:text-gray-300">
              <NavItems />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <SignedIn>
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"
                >
                  <span className="text-xl">🔔</span>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 shadow-2xl rounded-xl ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-gray-900">
                    <NotificationCenter />
                  </div>
                )}
              </div>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-all active:scale-95">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            {showInstall && (
              <button
                onClick={handleInstallClick}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-full transition-all shadow-sm"
              >
                Install App
              </button>
            )}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 ${isMobileMenuOpen ? 'max-h-80' : 'max-h-0'}`}>
        <div className="px-4 pt-2 pb-4 flex flex-col space-y-1 text-gray-700 dark:text-gray-200">
          <NavItems />
          <SignedOut>
            <SignInButton mode="modal">
              <button className="w-full mt-2 px-3 py-3 text-left font-medium text-indigo-600 border-t border-gray-100 dark:border-gray-800">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
}