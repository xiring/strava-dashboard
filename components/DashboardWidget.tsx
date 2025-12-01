'use client';

import { ReactNode } from 'react';

interface DashboardWidgetProps {
  id: string;
  title: string;
  children: ReactNode;
  onRemove?: () => void;
  onMove?: (direction: 'up' | 'down') => void;
}

export default function DashboardWidget({ id, title, children, onRemove, onMove }: DashboardWidgetProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 relative group">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onMove && (
            <>
              <button
                onClick={() => onMove('up')}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                onClick={() => onMove('down')}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Move down"
              >
                ↓
              </button>
            </>
          )}
          {onRemove && (
            <button
              onClick={onRemove}
              className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
              aria-label="Remove widget"
            >
              ×
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

