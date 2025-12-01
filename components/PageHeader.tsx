'use client';

import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  actions?: React.ReactNode;
  showBack?: boolean;
}

export default function PageHeader({ title, actions, showBack = true }: PageHeaderProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-[73px] z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          {/* Left: Back Button */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {showBack && (
              <Link
                href="/"
                className="text-strava-orange hover:text-orange-600 font-semibold transition-colors flex items-center space-x-1"
              >
                <span>←</span>
                <span className="hidden sm:inline">Back</span>
              </Link>
            )}
          </div>

          {/* Center: Page Title */}
          <h1 className={`text-lg md:text-xl font-bold text-gray-900 dark:text-white flex-1 text-center truncate px-2 ${
            showBack ? 'hidden md:block' : ''
          }`}>
            {title}
          </h1>
          
          {/* Mobile Title (shown when back button is visible) */}
          {showBack && (
            <h1 className="md:hidden text-lg font-bold text-gray-900 dark:text-white flex-1 text-center truncate px-2">
              {title}
            </h1>
          )}

          {/* Right: Actions */}
          {actions && (
            <div className="flex items-center space-x-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

