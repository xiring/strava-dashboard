'use client';

import Link from 'next/link';
import Navigation from './Navigation';
import UserMenu from './UserMenu';
import { StravaAthlete } from '@/lib/strava';

interface AppHeaderProps {
  athlete?: StravaAthlete | null;
}

export default function AppHeader({ athlete }: AppHeaderProps) {
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
          <div className="flex items-center">
            {athlete && <UserMenu athlete={athlete} />}
          </div>
        </div>
      </div>
    </header>
  );
}

