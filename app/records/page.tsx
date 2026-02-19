'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { StravaActivity, StravaAthlete } from '@/lib/strava';
import AppHeader from '@/components/AppHeader';
import PageHeader from '@/components/PageHeader';
import BestEffortsDisplay from '@/components/BestEffortsDisplay';
import { detectBestEfforts } from '@/lib/bestEfforts';

export default function RecordsPage() {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [athlete, setAthlete] = useState<StravaAthlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAthlete = async () => {
      try {
        const response = await fetch('/api/athlete');
        if (response.ok) {
          const data = await response.json();
          setAthlete(data.athlete);
        }
      } catch (err) {
        // Ignore errors
      }
    };
    fetchAthlete();
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      // For records, we need more data but still limit initial load
      // Records can be calculated from a reasonable sample
      const response = await fetch('/api/activities?per_page=100&page=1');
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load activities');
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load activities');
      setLoading(false);
    }
  };

  // Calculate personal records
  const records = useMemo(() => {
    const runs = activities.filter((a) => a.type === 'Run');
    const rides = activities.filter((a) => a.type === 'Ride');

    return {
      longestRun: runs.length > 0 ? runs.reduce((max, a) => (a.distance > max.distance ? a : max), runs[0]) : null,
      fastestRun: runs.length > 0 ? runs.reduce((fastest, a) => (a.average_speed > fastest.average_speed ? a : fastest), runs[0]) : null,
      longestRide: rides.length > 0 ? rides.reduce((max, a) => (a.distance > max.distance ? a : max), rides[0]) : null,
      fastestRide: rides.length > 0 ? rides.reduce((fastest, a) => (a.average_speed > fastest.average_speed ? a : fastest), rides[0]) : null,
      mostElevation: activities.length > 0 ? activities.reduce((max, a) => (a.total_elevation_gain > max.total_elevation_gain ? a : max), activities[0]) : null,
      longestDuration: activities.length > 0 ? activities.reduce((max, a) => (a.moving_time > max.moving_time ? a : max), activities[0]) : null,
    };
  }, [activities]);

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

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-palette-light mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader athlete={athlete} />
      <PageHeader title="Personal Records" />

      {/* Main Content */}
      <main className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10">
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded">
            {error}
          </div>
        )}

        {/* Best Efforts */}
        <div className="mb-8">
          <BestEffortsDisplay bestEfforts={detectBestEfforts(activities)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Longest Run */}
          {records.longestRun && (
            <div className="glass p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🏃 Longest Run</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(records.longestRun.start_date_local)}
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatDistance(records.longestRun.distance)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Distance</div>
                </div>
                <Link
                  href={`/activities/${records.longestRun.id}`}
                  className="text-sm text-palette-dark hover:text-palette-darkest font-medium"
                >
                  View Activity →
                </Link>
              </div>
            </div>
          )}

          {/* Fastest Run */}
          {records.fastestRun && (
            <div className="glass p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">⚡ Fastest Run</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(records.fastestRun.start_date_local)}
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatSpeed(records.fastestRun.average_speed, 'Run')}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Average Pace</div>
                </div>
                <Link
                  href={`/activities/${records.fastestRun.id}`}
                  className="text-sm text-palette-dark hover:text-palette-darkest font-medium"
                >
                  View Activity →
                </Link>
              </div>
            </div>
          )}

          {/* Longest Ride */}
          {records.longestRide && (
            <div className="glass p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🚴 Longest Ride</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(records.longestRide.start_date_local)}
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatDistance(records.longestRide.distance)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Distance</div>
                </div>
                <Link
                  href={`/activities/${records.longestRide.id}`}
                  className="text-sm text-palette-dark hover:text-palette-darkest font-medium"
                >
                  View Activity →
                </Link>
              </div>
            </div>
          )}

          {/* Fastest Ride */}
          {records.fastestRide && (
            <div className="glass p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">⚡ Fastest Ride</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(records.fastestRide.start_date_local)}
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatSpeed(records.fastestRide.average_speed, 'Ride')}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Average Speed</div>
                </div>
                <Link
                  href={`/activities/${records.fastestRide.id}`}
                  className="text-sm text-palette-dark hover:text-palette-darkest font-medium"
                >
                  View Activity →
                </Link>
              </div>
            </div>
          )}

          {/* Most Elevation */}
          {records.mostElevation && (
            <div className="glass p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">⛰️ Most Elevation</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(records.mostElevation.start_date_local)}
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {Math.round(records.mostElevation.total_elevation_gain)} m
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Elevation Gain</div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {records.mostElevation.type} • {formatDistance(records.mostElevation.distance)}
                </div>
                <Link
                  href={`/activities/${records.mostElevation.id}`}
                  className="text-sm text-palette-dark hover:text-palette-darkest font-medium"
                >
                  View Activity →
                </Link>
              </div>
            </div>
          )}

          {/* Longest Duration */}
          {records.longestDuration && (
            <div className="glass p-6 border-l-4 border-indigo-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">⏱️ Longest Duration</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(records.longestDuration.start_date_local)}
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatDuration(records.longestDuration.moving_time)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Moving Time</div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {records.longestDuration.type} • {formatDistance(records.longestDuration.distance)}
                </div>
                <Link
                  href={`/activities/${records.longestDuration.id}`}
                  className="text-sm text-palette-dark hover:text-palette-darkest font-medium"
                >
                  View Activity →
                </Link>
              </div>
            </div>
          )}
        </div>

        {!records.longestRun && !records.fastestRun && !records.longestRide && !records.fastestRide && !records.mostElevation && !records.longestDuration && (
          <div className="glass p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No records found. Complete some activities to see your personal records!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

