'use client';

import { StravaActivity } from '@/lib/strava';
import Link from 'next/link';

interface ActivityListProps {
  activities: StravaActivity[];
}

function formatDistance(meters: number): string {
  const km = meters / 1000;
  return `${km.toFixed(2)} km`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getActivityIcon(type: string): string {
  const icons: Record<string, string> = {
    Run: '🏃',
    Ride: '🚴',
    Walk: '🚶',
    Hike: '🥾',
    Swim: '🏊',
    Workout: '💪',
  };
  return icons[type] || '🏃';
}

export default function ActivityList({ activities }: ActivityListProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">No activities found</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activities</h2>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {activities.map((activity) => (
          <Link
            key={activity.id}
            href={`/activities/${activity.id}`}
            className="block px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {activity.name}
                  </h3>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span>{activity.type}</span>
                    <span>•</span>
                    <span>{formatDate(activity.start_date_local)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-6 ml-4">
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatDistance(activity.distance)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDuration(activity.moving_time)}
                  </div>
                </div>
                {activity.total_elevation_gain > 0 && (
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {Math.round(activity.total_elevation_gain)}m
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Elevation</div>
                  </div>
                )}
                <div className="text-gray-400 dark:text-gray-500 ml-2">
                  →
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

