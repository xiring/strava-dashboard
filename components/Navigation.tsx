'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  description?: string;
}

const navGroups = [
  {
    label: 'Main',
    items: [
      { href: '/', label: 'Dashboard', icon: '📊', description: 'Overview' },
      { href: '/activities', label: 'Activities', icon: '🏃', description: 'All activities' },
      { href: '/heatmap', label: 'Heatmap', icon: '🔥', description: 'Activity calendar' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { href: '/statistics', label: 'Statistics', icon: '📈', description: 'Basic stats' },
      { href: '/analytics', label: 'Analytics', icon: '📊', description: 'Advanced analytics' },
      { href: '/training', label: 'Training', icon: '💪', description: 'Training load' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { href: '/routes', label: 'Routes', icon: '🗺️', description: 'Route planning' },
      { href: '/gear', label: 'Gear', icon: '🚴', description: 'Gear tracking' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { href: '/summary', label: 'Summary', icon: '📋', description: 'Reports' },
      { href: '/records', label: 'Records', icon: '🏆', description: 'Personal bests' },
      { href: '/compare', label: 'Compare', icon: '⚖️', description: 'Compare activities' },
      { href: '/goals', label: 'Goals', icon: '🎯', description: 'Track goals' },
    ],
  },
];

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  // Check if any item in a group is active
  const isGroupActive = (group: typeof navGroups[0]) => {
    return group.items.some((item) => isActive(item.href));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      let clickedInside = false;
      
      Object.values(dropdownRefs.current).forEach((ref) => {
        if (ref && ref.contains(target)) {
          clickedInside = true;
        }
      });
      
      if (!clickedInside) {
        setOpenDropdown(null);
      }
    }

    if (openDropdown) {
      // Use a small delay to allow click events to fire first
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-1 flex-wrap justify-center">
        {navGroups.map((group) => (
          <div
            key={group.label}
            className="relative"
            ref={(el) => {
              dropdownRefs.current[group.label] = el;
            }}
          >
            <button
              onClick={() => setOpenDropdown(openDropdown === group.label ? null : group.label)}
              className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all flex items-center space-x-1.5 ${
                isGroupActive(group)
                  ? 'bg-palette-light text-palette-darkest'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              aria-expanded={openDropdown === group.label}
              aria-haspopup="true"
            >
              <span className="whitespace-nowrap">{group.label}</span>
              <svg
                className={`w-4 h-4 transition-transform ${openDropdown === group.label ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {openDropdown === group.label && (
              <div 
                className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                onClick={(e) => e.stopPropagation()}
              >
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdown(null);
                    }}
                    className={`flex items-center space-x-3 px-4 py-2 text-sm transition-colors ${
                      isActive(item.href)
                        ? 'bg-palette-light text-palette-darkest'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <div className="font-medium">{item.label}</div>
                      {item.description && (
                        <div className="text-xs opacity-75">{item.description}</div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {mobileMenuOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700 z-50 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="px-4 py-2 space-y-4">
            {navGroups.map((group) => (
              <div key={group.label}>
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {group.label}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                        isActive(item.href)
                          ? 'bg-palette-light text-palette-darkest'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium">{item.label}</div>
                        {item.description && (
                          <div className="text-xs opacity-75">{item.description}</div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

