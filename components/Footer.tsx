'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex flex-col mb-4">
              <h2 className="text-xl font-bold text-palette-darkest leading-tight">Strava</h2>
              <span className="text-xs text-palette-dark font-medium">Dashboard</span>
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Your personal Strava activity tracker with advanced analytics, training insights, and more.
            </p>
            <div className="flex items-center space-x-4">
              <a
                href="https://www.strava.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-palette-dark dark:text-gray-400 dark:hover:text-palette-dark transition-colors"
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
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-palette-dark transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/activities"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-palette-dark transition-colors"
                >
                  Activities
                </Link>
              </li>
              <li>
                <Link
                  href="/statistics"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-palette-dark transition-colors"
                >
                  Statistics
                </Link>
              </li>
              <li>
                <Link
                  href="/goals"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-palette-dark transition-colors"
                >
                  Goals
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/settings"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-palette-dark transition-colors"
                >
                  Settings
                </Link>
              </li>
              <li>
                <a
                  href="https://www.strava.com/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-palette-dark transition-colors"
                >
                  Strava API
                </a>
              </li>
              <li>
                <a
                  href="https://developers.strava.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-palette-dark transition-colors"
                >
                  Developer Docs
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {currentYear} Strava Dashboard. Built with Next.js, React, and Tailwind CSS.
            </p>
            <div className="flex items-center space-x-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Powered by{' '}
                <a
                  href="https://www.strava.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-palette-dark hover:text-palette-darkest font-semibold"
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

