'use client';

import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  actions?: React.ReactNode;
  showBack?: boolean;
}

export default function PageHeader({ title, actions, showBack = true }: PageHeaderProps) {
  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-b border-white/20 dark:border-white/5 sticky top-16 z-30">
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-3 flex-shrink-0">
            {showBack && (
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <span>←</span>
                <span className="hidden sm:inline">Back</span>
              </Link>
            )}
          </div>

          <h1 className={`text-lg md:text-xl font-bold text-slate-900 dark:text-white flex-1 text-center truncate px-2 ${
            showBack ? 'hidden md:block' : ''
          }`}>
            {title}
          </h1>
          
          {showBack && (
            <h1 className="md:hidden text-lg font-bold text-slate-900 dark:text-white flex-1 text-center truncate px-2">
              {title}
            </h1>
          )}

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

