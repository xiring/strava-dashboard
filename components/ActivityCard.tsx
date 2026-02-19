'use client';

import { StravaActivity } from '@/lib/strava';
import { getActivityIcon } from '@/lib/activityIcons';
import Link from 'next/link';
import ActivityRating from '@/components/ActivityRating';
import { exportToGpx, exportToTcx, downloadFile } from '@/lib/exportFormats';

interface ActivityCardProps {
  activity: StravaActivity;
}

function formatDistance(meters: number): string {
  const km = meters / 1000;
  if (km >= 1000) {
    return `${(km / 1000).toFixed(2)}k km`;
  }
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
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

function formatSpeed(metersPerSecond: number, activityType: string): string {
  if (activityType === 'Run' || activityType === 'Walk' || activityType === 'Hike') {
    const secondsPerKm = 1000 / metersPerSecond;
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.floor(secondsPerKm % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
  } else {
    const kmh = (metersPerSecond * 3600) / 1000;
    return `${kmh.toFixed(1)} km/h`;
  }
}

function getActivityColor(type: string): string {
  const colors: Record<string, string> = {
    Run: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    Ride: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    Walk: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
    Hike: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
    Swim: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200',
    Workout: 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200',
  };
  return colors[type] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  const polyline = (activity as any).map?.summary_polyline;

  const handleExportGpx = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!polyline) return;
    const gpx = exportToGpx(polyline, activity.name, activity.start_date, activity.type);
    if (gpx) downloadFile(gpx, `${activity.name.replace(/[^\w\d-_]+/g, '_')}.gpx`, 'application/gpx+xml');
  };

  const handleExportTcx = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!polyline) return;
    const tcx = exportToTcx(polyline, activity.name, activity.start_date, activity.moving_time, activity.distance, activity.type);
    if (tcx) downloadFile(tcx, `${activity.name.replace(/[^\w\d-_]+/g, '_')}.tcx`, 'application/vnd.garmin.tcx+xml');
  };

  return (
    <Link href={`/activities/${activity.id}`}>
      <div className="glass p-6 cursor-pointer h-full card-hover">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">{getActivityIcon(activity.type)}</div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-2">
                {activity.name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getActivityColor(activity.type)}`}>
                  {activity.type}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDate(activity.start_date_local)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
            <ActivityRating activityId={activity.id} size="sm" />
            {polyline && (
              <div className="flex gap-1">
                <button
                  onClick={handleExportGpx}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
                  title="Export GPX"
                >
                  GPX
                </button>
                <button
                  onClick={handleExportTcx}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
                  title="Export TCX"
                >
                  TCX
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Distance</div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">
              {formatDistance(activity.distance)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Time</div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">
              {formatDuration(activity.moving_time)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Pace/Speed</div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">
              {formatSpeed(activity.average_speed, activity.type)}
            </div>
          </div>
          {activity.total_elevation_gain > 0 && (
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Elevation</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-white">
                {Math.round(activity.total_elevation_gain)}m
              </div>
            </div>
          )}
        </div>

        {(activity.kudos_count > 0 || activity.comment_count > 0) && (
          <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {activity.kudos_count > 0 && (
              <div className="flex items-center space-x-1 text-sm text-slate-600 dark:text-slate-400">
                <span>👍</span>
                <span>{activity.kudos_count}</span>
              </div>
            )}
            {activity.comment_count > 0 && (
              <div className="flex items-center space-x-1 text-sm text-slate-600 dark:text-slate-400">
                <span>💬</span>
                <span>{activity.comment_count}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

