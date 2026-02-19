'use client';

import { useMemo } from 'react';
import { StravaActivity } from '@/lib/strava';

interface ActivityHeatmapProps {
  activities: StravaActivity[];
  year?: number;
}

export default function ActivityHeatmap({ activities, year }: ActivityHeatmapProps) {
  const currentYear = year || new Date().getFullYear();
  
  const startDate = useMemo(() => new Date(currentYear, 0, 1), [currentYear]);
  const endDate = useMemo(() => new Date(currentYear, 11, 31), [currentYear]);

  // Group activities by date
  const activitiesByDate = useMemo(() => {
    const map = new Map<string, { count: number; distance: number }>();
    
    activities.forEach((activity) => {
      const date = new Date(activity.start_date_local);
      if (date >= startDate && date <= endDate) {
        const dateKey = date.toISOString().split('T')[0];
        const existing = map.get(dateKey) || { count: 0, distance: 0 };
        map.set(dateKey, {
          count: existing.count + 1,
          distance: existing.distance + activity.distance,
        });
      }
    });

    return map;
  }, [activities, startDate, endDate]);

  // Get all dates in the year
  const allDates = useMemo(() => {
    const dates: Date[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [startDate, endDate]);

  // Calculate max distance for color intensity
  const maxDistance = useMemo(() => {
    return Math.max(...Array.from(activitiesByDate.values()).map(v => v.distance), 1);
  }, [activitiesByDate]);

  // Get color intensity based on distance
  const getColorIntensity = (distance: number) => {
    if (distance === 0) return 'bg-gray-100 dark:bg-gray-800';
    const intensity = Math.min(distance / maxDistance, 1);
    if (intensity < 0.2) return 'bg-green-200 dark:bg-green-900';
    if (intensity < 0.4) return 'bg-green-400 dark:bg-green-700';
    if (intensity < 0.6) return 'bg-green-500 dark:bg-green-600';
    if (intensity < 0.8) return 'bg-green-600 dark:bg-green-500';
    return 'bg-green-700 dark:bg-green-400';
  };

  // Get week number (0-52)
  const getWeekNumber = (date: Date) => {
    const start = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return Math.floor(days / 7);
  };

  // Group dates by week
  const weeks = useMemo(() => {
    const weekMap = new Map<number, Date[]>();
    allDates.forEach((date) => {
      const week = getWeekNumber(date);
      if (!weekMap.has(week)) {
        weekMap.set(week, []);
      }
      weekMap.get(week)!.push(date);
    });
    return weekMap;
  }, [allDates]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="glass p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Activity Heatmap {currentYear}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {activitiesByDate.size} days with activities
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-2">
            <div className="h-4"></div>
            {['Mon', 'Wed', 'Fri'].map((day) => (
              <div key={day} className="h-3 text-xs text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {Array.from(weeks.entries()).map(([weekNum, weekDates]) => (
            <div key={weekNum} className="flex flex-col gap-1">
              {/* Week label (first week of month) */}
              {weekDates[0]?.getDate() <= 7 && (
                <div className="h-4 text-xs text-gray-500 dark:text-gray-400 text-center">
                  {weekDates[0]?.toLocaleDateString('en-US', { month: 'short' })}
                </div>
              )}
              {weekDates[0]?.getDate() > 7 && <div className="h-4"></div>}

              {/* Days in week */}
              {weekDates.map((date) => {
                const dateKey = date.toISOString().split('T')[0];
                const activity = activitiesByDate.get(dateKey);
                const distance = activity?.distance || 0;
                const count = activity?.count || 0;

                return (
                  <div
                    key={dateKey}
                    className={`w-3 h-3 rounded-sm ${getColorIntensity(distance)} cursor-pointer hover:ring-2 hover:ring-palette-dark transition-all`}
                    title={`${formatDate(date)}: ${count} activity${count !== 1 ? 'ies' : ''}, ${(distance / 1000).toFixed(1)} km`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded-sm"></div>
          <div className="w-3 h-3 bg-green-200 dark:bg-green-900 rounded-sm"></div>
          <div className="w-3 h-3 bg-green-400 dark:bg-green-700 rounded-sm"></div>
          <div className="w-3 h-3 bg-green-500 dark:bg-green-600 rounded-sm"></div>
          <div className="w-3 h-3 bg-green-600 dark:bg-green-500 rounded-sm"></div>
          <div className="w-3 h-3 bg-green-700 dark:bg-green-400 rounded-sm"></div>
        </div>
        <span className="text-gray-600 dark:text-gray-400">More</span>
      </div>
    </div>
  );
}

