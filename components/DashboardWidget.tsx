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
    <div className="glass p-6 lg:p-8 relative group">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onMove && (
            <>
              <button
                onClick={() => onMove('up')}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                onClick={() => onMove('down')}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                aria-label="Move down"
              >
                ↓
              </button>
            </>
          )}
          {onRemove && (
            <button
              onClick={onRemove}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/20"
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

