'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Skeleton state to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="w-14 h-8 bg-slate-200 dark:bg-slate-800 rounded-full border border-slate-300 dark:border-slate-700 animate-pulse" />
    );
  }

  const isLight = theme === 'light';

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative w-16 h-9 rounded-full transition-all duration-500 ease-in-out
        border-2 shadow-inner group
        ${isLight 
          ? 'bg-slate-100 border-slate-200 shadow-slate-200' 
          : 'bg-slate-900 border-slate-800 shadow-black'
        }
      `}
      title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
    >
      {/* Background Track Icons */}
      <div className="absolute inset-0 flex items-center justify-between px-2 text-slate-400/40">
        <Sun size={14} strokeWidth={3} className={isLight ? 'opacity-0' : 'opacity-100'} />
        <Moon size={14} strokeWidth={3} className={isLight ? 'opacity-100' : 'opacity-0'} />
      </div>

      {/* Sliding Toggle Knob */}
      <div
        className={`
          absolute top-1 w-6 h-6 rounded-full transition-all duration-500 
          flex items-center justify-center shadow-lg transform
          ${isLight 
            ? 'left-1 bg-white text-amber-500 rotate-0 translate-x-0' 
            : 'left-8 bg-indigo-600 text-indigo-100 rotate-[360deg]'
          }
          group-hover:scale-110
        `}
      >
        {isLight ? (
          <Sun size={14} strokeWidth={3} fill="currentColor" />
        ) : (
          <Moon size={14} strokeWidth={3} fill="currentColor" />
        )}
      </div>

      {/* Internal Glow Effect */}
      {!isLight && (
        <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-md pointer-events-none" />
      )}
    </button>
  );
}