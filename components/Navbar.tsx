'use client';

import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from '@clerk/nextjs';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { useEffect, useState } from 'react';
import NotificationCenter from '@/components/NotificationCenter';

/* ================== TYPES ================== */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    __fetchNotificationsUnread?: () => Promise<void>;
  }
}

/* ================= COMPONENT ================= */

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const { isSignedIn } = useUser();

  const toggleMobileMenu = () =>
    setIsMobileMenuOpen(prev => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  /* ===== INSTALL PROMPT ===== */

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () =>
      window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  /* ===== NOTIFICATIONS ===== */

  useEffect(() => {
    if (!isSignedIn) return;

    let mounted = true;

    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/notifications?unread=true');
        const json: { notifications?: unknown[] } = await res.json();

        if (mounted) {
          setUnreadCount(
            Array.isArray(json.notifications)
              ? json.notifications.length
              : 0
          );
        }
      } catch (err) {
        console.error('Failed to fetch unread count', err);
      }
    };

    window.__fetchNotificationsUnread = fetchUnread;

    fetchUnread();
    const intervalId = setInterval(fetchUnread, 30_000);

    const notificationHandler = () => fetchUnread();
    window.addEventListener(
      'notifications:changed',
      notificationHandler
    );

    return () => {
      mounted = false;
      clearInterval(intervalId);
      window.removeEventListener(
        'notifications:changed',
        notificationHandler
      );
      delete window.__fetchNotificationsUnread;
    };
  }, [isSignedIn]);

  /* ===== INSTALL CLICK ===== */

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;

    setDeferredPrompt(null);
    setShowInstall(false);
  };

  /* ================= JSX ================= */

  return (
    <nav className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-600/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" onClick={closeMobileMenu}>
            <span className="font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
              SmartJuanPeso AI
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/" className="nav-link">
              Home
            </Link>

            <SignedIn>
              <Link href="/budget" className="nav-link">
                Budget
              </Link>
            </SignedIn>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            <SignedIn>
              <div className="relative">
                <button
                  onClick={() =>
                    setShowNotifications(open => {
                      if (!open) {
                        window.__fetchNotificationsUnread?.();
                      }
                      return !open;
                    })
                  }
                  className="p-2 rounded-full"
                >
                  🔔
                </button>

                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}

                {showNotifications && (
                  <div className="absolute right-0 mt-2">
                    <NotificationCenter />
                  </div>
                )}
              </div>
            </SignedIn>

            <SignedOut>
              <SignInButton>
                <button className="px-3 py-2 bg-indigo-600 text-white rounded">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <UserButton />
            </SignedIn>

            {showInstall && (
              <button
                onClick={handleInstallClick}
                className="px-3 py-2 bg-emerald-500 text-white rounded"
              >
                Install App
              </button>
            )}

            {/* Mobile Toggle */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden transition-all duration-300 ${
            isMobileMenuOpen
              ? 'max-h-40 opacity-100'
              : 'max-h-0 opacity-0 overflow-hidden'
          }`}
        >
          <div className="mt-2 rounded-lg border p-2 space-y-1 bg-white dark:bg-gray-800">
            <Link
              href="/"
              onClick={closeMobileMenu}
              className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Home
            </Link>

            <SignedIn>
              <Link
                href="/budget"
                onClick={closeMobileMenu}
                className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Budget
              </Link>
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  );
}
