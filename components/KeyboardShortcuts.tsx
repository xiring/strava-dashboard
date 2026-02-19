'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export const FOCUS_SEARCH_EVENT = 'strava-focus-search';

export function dispatchFocusSearch() {
  window.dispatchEvent(new CustomEvent(FOCUS_SEARCH_EVENT));
}

export default function KeyboardShortcuts() {
  const pathname = usePathname();
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        // Allow Escape to close help or blur
        if (e.key !== 'Escape') return;
      }

      // ? - Show shortcuts help
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setShowHelp((prev) => !prev);
        return;
      }

      // Escape - Close help or go home
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showHelp) {
          setShowHelp(false);
        } else {
          router.push('/');
        }
        return;
      }

      // Don't trigger shortcuts with modifier keys (except ?)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case '/':
          e.preventDefault();
          if (pathname === '/activities') {
            dispatchFocusSearch();
          } else {
            router.push('/activities');
            setTimeout(() => dispatchFocusSearch(), 150);
          }
          break;
        case 'g':
          e.preventDefault();
          router.push('/goals');
          break;
        case 'h':
          e.preventDefault();
          router.push('/');
          break;
        case 'a':
          e.preventDefault();
          router.push('/activities');
          break;
        case 'r':
          e.preventDefault();
          router.push('/records');
          break;
        case 'd':
          e.preventDefault();
          router.push('/');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pathname, router, showHelp]);

  if (!showHelp) return null;

  const shortcuts = [
    { keys: ['/'], action: 'Focus search / Go to activities' },
    { keys: ['g'], action: 'Goals' },
    { keys: ['a'], action: 'All activities' },
    { keys: ['r'], action: 'Records' },
    { keys: ['h', 'd'], action: 'Dashboard (home)' },
    { keys: ['Esc'], action: 'Close / Go home' },
    { keys: ['j', 'k'], action: 'Next/Previous activity (on activity page)' },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={() => setShowHelp(false)}
    >
      <div
        className="glass p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={() => setShowHelp(false)}
            className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="space-y-3">
          {shortcuts.map(({ keys, action }) => (
            <div
              key={keys.join('-')}
              className="flex items-center justify-between gap-4 py-2 border-b border-white/10 last:border-0"
            >
              <div className="flex gap-1.5">
                {keys.map((k) => (
                  <kbd
                    key={k}
                    className="px-2 py-1 text-sm font-mono bg-slate-200 dark:bg-slate-700 rounded text-slate-800 dark:text-slate-200"
                  >
                    {k === 'Esc' ? 'Esc' : k}
                  </kbd>
                ))}
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {action}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
          Press ? to toggle this help
        </p>
      </div>
    </div>
  );
}
