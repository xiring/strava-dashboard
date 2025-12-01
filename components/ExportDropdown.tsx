'use client';

import { useState, useRef, useEffect } from 'react';
import { StravaActivity } from '@/lib/strava';
import { exportToCSV, exportToJSON, exportToGPX, exportToTCX, exportToExcel } from '@/lib/export';

interface ExportDropdownProps {
  activities: StravaActivity[];
}

export default function ExportDropdown({ activities }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const exportOptions = [
    { label: 'CSV', action: () => exportToCSV(activities), icon: '📊' },
    { label: 'JSON', action: () => exportToJSON(activities), icon: '📄' },
    { label: 'GPX', action: () => exportToGPX(activities), icon: '🗺️' },
    { label: 'TCX', action: () => exportToTCX(activities), icon: '📱' },
    { label: 'Excel', action: () => exportToExcel(activities), icon: '📈' },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={activities.length === 0}
        className="px-4 py-2 text-sm font-medium bg-strava-orange hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Export activities"
      >
        <span>📥</span>
        <span className="hidden sm:inline">Export</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          {exportOptions.map((option) => (
            <button
              key={option.label}
              onClick={() => {
                option.action();
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <span className="text-lg">{option.icon}</span>
              <span>Export as {option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

