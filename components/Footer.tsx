'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-t border-white/20 dark:border-white/5 mt-auto">
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-strava text-white font-bold text-sm flex items-center justify-center">S</div>
              <div>
                <span className="text-lg font-bold text-slate-900 dark:text-white">Strava</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">Dashboard</span>
              </div>
            </Link>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Your personal Strava activity tracker with advanced analytics, training insights, and more.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mb-4">
              Press <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px]">?</kbd> for keyboard shortcuts
            </p>
            <div className="flex items-center space-x-4">
              <a
                href="https://www.strava.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-strava dark:text-slate-400 dark:hover:text-strava-muted transition-colors"
                aria-label="Strava Website"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.599h4.172L10.463 0l-7.21 14.828h4.169" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-strava transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/activities"
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-strava transition-colors"
                >
                  Activities
                </Link>
              </li>
              <li>
                <Link
                  href="/statistics"
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-strava transition-colors"
                >
                  Statistics
                </Link>
              </li>
              <li>
                <Link
                  href="/goals"
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-strava transition-colors"
                >
                  Goals
                </Link>
              </li>
              <li>
                <Link
                  href="/achievements"
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-strava transition-colors"
                >
                  Achievements
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/settings"
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-strava transition-colors"
                >
                  Settings
                </Link>
              </li>
              <li>
                <a
                  href="https://www.strava.com/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-strava transition-colors"
                >
                  Strava API
                </a>
              </li>
              <li>
                <a
                  href="https://developers.strava.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-strava transition-colors"
                >
                  Developer Docs
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              © {currentYear} Strava Dashboard. Built with Next.js, React, and Tailwind CSS.
            </p>
            <div className="flex items-center space-x-6">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Powered by{' '}
                <a
                  href="https://www.strava.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-strava hover:text-strava-hover font-semibold"
                >
                  Strava API
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

