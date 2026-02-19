'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { StravaActivity } from '@/lib/strava';

interface ActivityCalendarProps {
  activities: StravaActivity[];
}

export default function ActivityCalendar({ activities }: ActivityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const { days } = useMemo(() => {
    const year = currentMonth.year;
    const month = currentMonth.month;
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = first.getDay();
    const daysInMonth = last.getDate();

    const map = new Map<string, StravaActivity[]>();
    activities.forEach((a) => {
      const d = new Date(a.start_date_local);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = d.toISOString().split('T')[0];
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(a);
      }
    });

    const cells: { date: Date | null; key: string; activities: StravaActivity[] }[] = [];
    for (let i = 0; i < startPad; i++) {
      cells.push({ date: null, key: `pad-${i}`, activities: [] });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const key = date.toISOString().split('T')[0];
      cells.push({ date, key, activities: map.get(key) || [] });
    }

    return { days: cells };
  }, [activities, currentMonth.year, currentMonth.month]);

  const monthLabel = new Date(currentMonth.year, currentMonth.month).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const goPrev = () => {
    setCurrentMonth((m) =>
      m.month === 0 ? { year: m.year - 1, month: 11 } : { year: m.year, month: m.month - 1 }
    );
  };

  const goNext = () => {
    setCurrentMonth((m) =>
      m.month === 11 ? { year: m.year + 1, month: 0 } : { year: m.year, month: m.month + 1 }
    );
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="glass p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{monthLabel}</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="px-3 py-1.5 rounded-lg bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
          >
            ←
          </button>
          <button
            type="button"
            onClick={goNext}
            className="px-3 py-1.5 rounded-lg bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 py-2"
          >
            {d}
          </div>
        ))}
        {days.map((cell) => (
          <div
            key={cell.key}
            className={`min-h-[80px] rounded-lg border border-white/30 dark:border-white/10 overflow-hidden ${
              cell.date ? 'bg-white/40 dark:bg-white/5' : 'bg-transparent'
            }`}
          >
            {cell.date && (
              <>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 p-1.5 border-b border-white/20 dark:border-white/5">
                  {cell.date.getDate()}
                </div>
                <div className="p-1.5 space-y-1 overflow-y-auto max-h-[60px]">
                  {cell.activities.slice(0, 3).map((a) => (
                    <Link
                      key={a.id}
                      href={`/activities/${a.id}`}
                      className="block text-xs truncate rounded px-1.5 py-0.5 bg-strava/20 dark:bg-strava/30 text-strava dark:text-strava-light hover:bg-strava/30 dark:hover:bg-strava/40 transition-colors"
                      title={a.name}
                    >
                      {a.name}
                    </Link>
                  ))}
                  {cell.activities.length > 3 && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      +{cell.activities.length - 3} more
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
