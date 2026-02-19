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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">This Day Last Year</h2>
        <p className="text-gray-500 dark:text-gray-400">
          No activities on {lastYear.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          This Day Last Year
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {lastYear.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {thisDayLastYear.map((activity) => (
          <Link
            key={activity.id}
            href={`/activities/${activity.id}`}
            className="block px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div className="text-2xl flex-shrink-0">{getActivityIcon(activity.type)}</div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {activity.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{activity.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatDistance(activity.distance)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDuration(activity.moving_time)}
                </span>
                <span className="text-gray-400">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
