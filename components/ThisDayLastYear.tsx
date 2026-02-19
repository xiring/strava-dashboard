'use client';

import Link from 'next/link';
import { StravaActivity } from '@/lib/strava';
import { getActivityIcon } from '@/lib/activityIcons';

interface ThisDayLastYearProps {
  activities: StravaActivity[];
}

function formatDistance(meters: number): string {
  const km = meters / 1000;
  return km >= 1 ? `${km.toFixed(1)} km` : `${meters} m`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function ThisDayLastYear({ activities }: ThisDayLastYearProps) {
  const today = new Date();
  const lastYear = new Date(today);
  lastYear.setFullYear(today.getFullYear() - 1);

  const thisDayLastYear = activities.filter((a) => {
    const d = new Date(a.start_date_local);
    return d.getMonth() === lastYear.getMonth() && d.getDate() === lastYear.getDate();
  });

  if (thisDayLastYear.length === 0) {
    return (
      <div>
        <p className="text-slate-500 dark:text-slate-400">
          No activities on {lastYear.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="pb-4 mb-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          This Day Last Year
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {lastYear.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {thisDayLastYear.map((activity) => (
          <Link
            key={activity.id}
            href={`/activities/${activity.id}`}
            className="block px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors rounded-xl -mx-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div className="text-2xl flex-shrink-0">{getActivityIcon(activity.type)}</div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                    {activity.name}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{activity.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatDistance(activity.distance)}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {formatDuration(activity.moving_time)}
                </span>
                <span className="text-slate-400">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
