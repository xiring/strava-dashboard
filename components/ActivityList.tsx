'use client';

import { StravaActivity } from '@/lib/strava';
import { getActivityIcon } from '@/lib/activityIcons';
import { storage } from '@/lib/storage';
import Link from 'next/link';

interface ActivityListProps {
  activities: StravaActivity[];
  limit?: number; // When set, show only this many and add "View all" link
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

export default function ActivityList({ activities, limit }: ActivityListProps) {
  const displayedActivities = limit ? activities.slice(0, limit) : activities;
  const hasMore = limit != null && activities.length > limit;

  if (activities.length === 0) {
    return (
      <div className="glass p-12 text-center">
        <p className="text-slate-500 dark:text-slate-400">No activities found</p>
        <Link
          href="/activities"
          className="mt-4 inline-block text-sm font-medium text-strava hover:text-strava-hover"
        >
          View all activities
        </Link>
      </div>
    );
  }

  return (
    <div className="glass overflow-hidden">
      <div className="px-6 lg:px-8 py-5 border-b border-white/20 dark:border-white/5 bg-white/30 dark:bg-white/5 flex items-center justify-between backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Activities</h2>
        {hasMore && (
          <Link
            href="/activities"
            className="text-sm font-medium text-strava hover:text-strava-hover"
          >
            View all activities
          </Link>
        )}
      </div>
      <div className="divide-y divide-white/20 dark:divide-white/5">
        {displayedActivities.map((activity) => (
          <Link
            key={activity.id}
            href={`/activities/${activity.id}`}
            className="block px-6 lg:px-8 py-4 hover:bg-white/40 dark:hover:bg-white/5 transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                {typeof window !== 'undefined' && storage.favoriteActivities.has(activity.id) && (
                  <span className="text-lg" title="Favorite">⭐</span>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                    {activity.name}
                  </h3>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-slate-500 dark:text-slate-400">
                    <span>{activity.type}</span>
                    <span>•</span>
                    <span>{formatDate(activity.start_date_local)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-6 ml-4">
                <div className="text-right">
                  <div className="text-lg font-semibold text-slate-900 dark:text-white">
                    {formatDistance(activity.distance)}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {formatDuration(activity.moving_time)}
                  </div>
                </div>
                {activity.total_elevation_gain > 0 && (
                  <div className="text-right">
                    <div className="text-lg font-semibold text-slate-900 dark:text-white">
                      {Math.round(activity.total_elevation_gain)}m
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Elevation</div>
                  </div>
                )}
                <div className="text-slate-400 dark:text-slate-500 ml-2">
                  →
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {hasMore && (
        <div className="px-6 lg:px-8 py-4 border-t border-white/20 dark:border-white/5 bg-white/20 dark:bg-white/5 backdrop-blur-sm text-center">
          <Link
            href="/activities"
            className="inline-flex items-center gap-2 text-sm font-semibold text-strava hover:text-strava-hover"
          >
            View all {activities.length} activities
            <span>→</span>
          </Link>
        </div>
      )}
    </div>
  );
}

