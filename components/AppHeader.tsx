'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from './Navigation';
import UserMenu from './UserMenu';
import { StravaAthlete } from '@/lib/strava';
import { storage } from '@/lib/storage';

interface AppHeaderProps {
  athlete?: StravaAthlete | null;
}

export default function AppHeader({ athlete }: AppHeaderProps) {
  const [darkMapStyle, setDarkMapStyle] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefs = storage.preferences.get() as { darkMapStyle?: boolean } | null;
    setDarkMapStyle(prefs?.darkMapStyle ?? false);
  }, []);

  useEffect(() => {
    const handler = () => {
      const prefs = storage.preferences.get() as { darkMapStyle?: boolean } | null;
      setDarkMapStyle(prefs?.darkMapStyle ?? false);
    };
    window.addEventListener('strava-dark-map-style-changed', handler);
    return () => window.removeEventListener('strava-dark-map-style-changed', handler);
  }, []);

  const toggleDarkMap = () => {
    const prefs = storage.preferences.get() || { theme: 'auto', itemsPerPage: 12, darkMapStyle: false };
    const next = !(prefs as any).darkMapStyle;
    storage.preferences.set({ ...prefs, darkMapStyle: next });
    setDarkMapStyle(next);
    window.dispatchEvent(new CustomEvent('strava-dark-map-style-changed', { detail: { darkMapStyle: next } }));
  };

  return (
    <header className="no-print sticky top-0 z-40 border-b border-white/20 dark:border-white/5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl">
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-strava text-white font-bold text-lg shadow-soft backdrop-blur-sm">
              S
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Strava</span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 -mt-0.5">Dashboard</span>
            </div>
          </Link>

          {/* Navigation */}
          <div className="flex-1 flex justify-center">
            <Navigation />
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleDarkMap}
              title={darkMapStyle ? 'Switch to light map' : 'Switch to dark map'}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
              aria-label={darkMapStyle ? 'Use light map' : 'Use dark map'}
            >
              {darkMapStyle ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            {athlete && <UserMenu athlete={athlete} />}
          </div>
        </div>
      </div>
    </header>
  );
}

