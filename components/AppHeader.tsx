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
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between relative">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex flex-col">
              <h1 className="text-xl font-bold text-strava-orange leading-tight">Strava</h1>
              <span className="text-xs text-strava-orange font-medium">Dashboard</span>
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex-1 flex justify-center">
            <Navigation />
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center space-x-4">
            {athlete && <UserMenu athlete={athlete} />}
          </div>
        </div>
      </div>
    </header>
  );
}

