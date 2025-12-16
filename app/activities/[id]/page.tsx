'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { StravaActivity, StravaAthlete } from '@/lib/strava';
import ActivityMap from '@/components/ActivityMap';
import ActivityMap3D from '@/components/ActivityMap3D';
import PaceBreakdown from '@/components/PaceBreakdown';
import ActivityNotes from '@/components/ActivityNotes';
import { decodePolyline } from '@/lib/polyline';
import AppHeader from '@/components/AppHeader';
import PageHeader from '@/components/PageHeader';

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
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatSpeed(metersPerSecond: number, activityType: string): string {
  if (activityType === 'Run' || activityType === 'Walk' || activityType === 'Hike') {
    // Convert to min/km pace
    const secondsPerKm = 1000 / metersPerSecond;
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.floor(secondsPerKm % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
  } else {
    // Convert to km/h
    const kmh = (metersPerSecond * 3600) / 1000;
    return `${kmh.toFixed(1)} km/h`;
  }
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

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activity, setActivity] = useState<StravaActivity | null>(null);
  const [athlete, setAthlete] = useState<StravaAthlete | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapMode, setMapMode] = useState<'2d' | '3d'>('2d');
  const [error, setError] = useState<string | null>(null);

  const handleDownloadGpx = (polyline?: string, name?: string, startDate?: string) => {
    if (!polyline) return;
    const coords = decodePolyline(polyline);
    if (!coords.length) return;

    const safeName = (name || 'activity').replace(/[^\w\d-_]+/g, '_');
    const time = startDate ? new Date(startDate).toISOString() : new Date().toISOString();

    const gpx =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<gpx version="1.1" creator="strava-dashboard" xmlns="http://www.topografix.com/GPX/1/1">\n` +
      `  <metadata>\n` +
      `    <name>${safeName}</name>\n` +
      `    <time>${time}</time>\n` +
      `  </metadata>\n` +
      `  <trk>\n` +
      `    <name>${safeName}</name>\n` +
      `    <trkseg>\n` +
      coords.map(([lat, lon]) => `      <trkpt lat="${lat}" lon="${lon}"></trkpt>`).join('\n') +
      `\n    </trkseg>\n` +
      `  </trk>\n` +
      `</gpx>`;

    const blob = new Blob([gpx], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}.gpx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch athlete
        const athleteResponse = await fetch('/api/athlete');
        if (athleteResponse.ok) {
          const athleteData = await athleteResponse.json();
          setAthlete(athleteData.athlete);
        }

        // Fetch activity
        const response = await fetch(`/api/activities/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setActivity(data);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to load activity');
        }

        // Fetch notes and tags
        const notesResponse = await fetch(`/api/activities/${params.id}/notes`);
        if (notesResponse.ok) {
          const notesData = await notesResponse.json();
          setNotes(notesData.notes || '');
          setTags(notesData.tags || []);
        }

        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load activity');
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-palette-light mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading activity...</p>
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'Activity not found'}</p>
          <Link
            href="/"
            className="inline-block bg-palette-light hover:bg-palette-medium text-palette-darkest font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AppHeader athlete={athlete} />
      <PageHeader title={activity.name} showBack={true} />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Activity Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">{getActivityIcon(activity.type)}</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {activity.name}
                </h1>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                    {activity.type}
                  </span>
                  <span>{formatDate(activity.start_date_local)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Map */}
        {activity.map?.summary_polyline && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Route Map</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() =>
                    handleDownloadGpx(activity.map?.summary_polyline, activity.name, activity.start_date)
                  }
                  className="h-10 px-3 inline-flex items-center gap-2 text-sm font-semibold rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  title="Download GPX"
                >
                  <span className="text-lg leading-none">⬇</span>
                  <span>GPX</span>
                </button>
                <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setMapMode('2d')}
                    className={`h-10 px-4 text-sm font-semibold transition-colors ${
                      mapMode === '2d'
                        ? 'bg-palette-light text-palette-darkest'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    aria-pressed={mapMode === '2d'}
                  >
                    2D
                  </button>
                  <button
                    onClick={() => setMapMode('3d')}
                    className={`h-10 px-4 text-sm font-semibold transition-colors ${
                      mapMode === '3d'
                        ? 'bg-palette-light text-palette-darkest'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title="3D replay (MapLibre terrain)"
                    aria-pressed={mapMode === '3d'}
                  >
                    3D (beta)
                  </button>
                </div>
              </div>
            </div>
            {(() => {
              const coordinates = decodePolyline(activity.map.summary_polyline);
              const startCoords = coordinates[0];
              const endCoords = coordinates[coordinates.length - 1];
              const mapProps = {
                polyline: activity.map.summary_polyline,
                startLat: startCoords?.[0],
                startLng: startCoords?.[1],
                endLat: endCoords?.[0],
                endLng: endCoords?.[1],
                elapsedTime: activity.elapsed_time,
                distance: activity.distance,
              };
              if (mapMode === '3d') {
                return <ActivityMap3D {...mapProps} />;
              }
              return <ActivityMap {...mapProps} />;
            })()}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Distance</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatDistance(activity.distance)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Moving Time</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatDuration(activity.moving_time)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Elapsed Time</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatDuration(activity.elapsed_time)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Elevation Gain</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(activity.total_elevation_gain)}m
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Performance</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Average Speed</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatSpeed(activity.average_speed, activity.type)}
                </span>
              </div>
              {activity.max_speed > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Max Speed</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatSpeed(activity.max_speed, activity.type)}
                  </span>
                </div>
              )}
              {activity.average_cadence && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Average Cadence</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {Math.round(activity.average_cadence)} rpm
                  </span>
                </div>
              )}
              {activity.calories && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Calories</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {activity.calories}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Elevation</h2>
            <div className="space-y-3">
              {activity.elev_high && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Elevation High</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {Math.round(activity.elev_high)}m
                  </span>
                </div>
              )}
              {activity.elev_low && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Elevation Low</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {Math.round(activity.elev_low)}m
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Elevation Gain</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {Math.round(activity.total_elevation_gain)}m
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Heart Rate (if available) */}
        {(activity.average_heartrate || activity.max_heartrate) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Heart Rate</h2>
            <div className="grid grid-cols-2 gap-4">
              {activity.average_heartrate && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Average</div>
                  <div className="text-2xl font-bold text-red-600">
                    {Math.round(activity.average_heartrate)} bpm
                  </div>
                </div>
              )}
              {activity.max_heartrate && (
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Max</div>
                  <div className="text-2xl font-bold text-red-700">
                    {Math.round(activity.max_heartrate)} bpm
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pace Breakdown */}
        {(activity.splits_metric || activity.splits_standard) && (
          <div className="mb-6">
            <PaceBreakdown
              splits={activity.splits_metric || activity.splits_standard || []}
              activityType={activity.type}
              averageSpeed={activity.average_speed}
            />
          </div>
        )}

        {/* Social Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Activity Stats</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {activity.kudos_count}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Kudos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {activity.comment_count}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Comments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {activity.achievement_count}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Achievements</div>
            </div>
          </div>
        </div>

        {/* Notes & Tags */}
        <div className="mb-6">
          <ActivityNotes
            activityId={params.id as string}
            initialNotes={notes}
            initialTags={tags}
            onSave={(newNotes, newTags) => {
              setNotes(newNotes);
              setTags(newTags);
            }}
          />
        </div>

        {/* View on Strava Link */}
        <div className="mt-6 text-center">
          <a
            href={`https://www.strava.com/activities/${activity.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-palette-light hover:bg-palette-medium text-palette-darkest font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            View on Strava →
          </a>
        </div>
      </main>
    </div>
  );
}

