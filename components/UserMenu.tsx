'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UserMenuProps {
  athlete: {
    id: number;
    firstname: string;
    lastname: string;
    profile_medium?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

export default function UserMenu({ athlete }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* User Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-strava focus:ring-offset-2"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        {athlete.profile_medium && (
          <img
            src={athlete.profile_medium}
            alt={athlete.firstname}
            className="w-10 h-10 rounded-full border-2 border-strava/30 object-cover"
          />
        )}
        <div className="hidden sm:block text-left">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {athlete.firstname} {athlete.lastname}
          </p>
          {athlete.city && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {athlete.city}, {athlete.state || athlete.country}
            </p>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 glass py-2 z-50 animate-slide-up">
          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center space-x-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors rounded-xl mx-1"
          >
            <span className="text-lg">⚙️</span>
            <span>Settings</span>
          </Link>
          <button
            onClick={() => {
              setIsOpen(false);
              handleLogout();
            }}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left rounded-xl mx-1"
          >
            <span className="text-lg">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}

