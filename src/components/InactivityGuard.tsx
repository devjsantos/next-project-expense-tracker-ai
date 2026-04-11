'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';

// const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 Minutes
// const INACTIVITY_LIMIT = 15 * 1000; // 15 seconds for testing purposes
const INACTIVITY_LIMIT = 180 * 60 * 1000; // 180 Minutes

export default function InactivityGuard() {
  const { signOut } = useClerk();
  const router = useRouter();
  const { addToast } = useToast();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = useCallback(async () => {
    // Show toast
    addToast('Session expired due to inactivity.', 'warning');

    // delay so toast is visible
    setTimeout(async () => {
      await signOut();
      router.push('/');
    }, 1500);

  }, [signOut, router, addToast]);


  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(handleLogout, INACTIVITY_LIMIT);
  }, [handleLogout]);

  useEffect(() => {
    // Events that count as "activity"
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    // Start the initial timer
    resetTimer();

    // Add listeners
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [resetTimer]);

  return null; // This component doesn't render anything
}