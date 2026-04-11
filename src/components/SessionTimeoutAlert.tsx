'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

// const THIRTY_MINS = 30 * 60 * 1000;
// const WARNING_BEFORE = 2 * 60 * 1000; // Show alert at 28 mins

// For testing only! 
const THIRTY_MINS = 15 * 1000;    // 15 seconds total session
const WARNING_BEFORE = 10 * 1000; // Show alert after 5 seconds of inactivity (15 - 10 = 5)

export default function SessionTimeoutAlert() {
  const [showModal, setShowModal] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(120);
  const { signOut } = useClerk();
  const router = useRouter();
  
  const logoutTimer = useRef<NodeJS.Timeout | null>(null);
  const warningTimer = useRef<NodeJS.Timeout | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = () => {
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
  };

  const handleLogout = useCallback(async () => {
    clearAllTimers();
    await signOut();
    router.push('/sign-in?reason=session_expired');
  }, [signOut, router]);

  const resetTimers = useCallback(() => {
    clearAllTimers();
    setShowModal(false);
    setRemainingSeconds(120);

    // Set the main logout timer (30 mins)
    logoutTimer.current = setTimeout(handleLogout, THIRTY_MINS);

    // Set the warning timer (28 mins)
    warningTimer.current = setTimeout(() => {
      setShowModal(true);
      // Start a visible countdown
      countdownInterval.current = setInterval(() => {
        setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }, THIRTY_MINS - WARNING_BEFORE);
  }, [handleLogout]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    resetTimers();

    events.forEach((event) => {
      window.addEventListener(event, () => {
        if (!showModal) resetTimers();
      });
    });

    return () => {
      clearAllTimers();
      events.forEach((event) => window.removeEventListener(event, resetTimers));
    };
  }, [resetTimers, showModal]);

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="text-5xl mb-4">⌛</div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">
          Session Expiring
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          You have been inactive for a while. For your security, you will be logged out in:
          <span className="block text-2xl font-mono font-bold text-indigo-500 mt-2">
            {Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, '0')}
          </span>
        </p>
        
        <div className="space-y-3">
          <button
            onClick={resetTimers}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/25"
          >
            STAY LOGGED IN
          </button>
          <button
            onClick={handleLogout}
            className="w-full py-4 bg-transparent text-slate-400 hover:text-red-500 font-bold transition-colors text-xs uppercase tracking-widest"
          >
            Logout Now
          </button>
        </div>
      </div>
    </div>
  );
}