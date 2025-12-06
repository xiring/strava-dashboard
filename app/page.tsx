'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StravaActivity, StravaAthlete, StravaStats } from '@/lib/strava';
import StatsCard from '@/components/StatsCard';
import ActivityList from '@/components/ActivityList';
import ActivityChart from '@/components/ActivityChart';
import RateLimitError from '@/components/RateLimitError';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { StatsCardSkeleton, ActivityListSkeleton } from '@/components/LoadingSkeleton';
import Navigation from '@/components/Navigation';
import UserMenu from '@/components/UserMenu';
import StreakDisplay from '@/components/StreakDisplay';
import BestEffortsDisplay from '@/components/BestEffortsDisplay';
import DashboardWidget from '@/components/DashboardWidget';
import { calculateStreaks } from '@/lib/streaks';
import { requestNotificationPermission, scheduleWeeklySummary } from '@/lib/notifications';
import { storage } from '@/lib/storage';

export default function Home() {
  const [athlete, setAthlete] = useState<StravaAthlete | null>(null);
  const [stats, setStats] = useState<StravaStats | null>(null);
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitError, setRateLimitError] = useState<any>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [widgets, setWidgets] = useState<string[]>(() => {
    const saved = storage.preferences.get() as any;
    return saved?.dashboardWidgets || ['stats', 'streaks', 'chart', 'activities'];
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Request notification permission on first load
      await requestNotificationPermission();

      const response = await fetch('/api/athlete');
      if (response.ok) {
        const data = await response.json();
        setAthlete(data.athlete);
        setStats(data.stats);
        setAuthenticated(true);
        loadActivities();
      } else {
        const errorData = await response.json();
        if (errorData.isRateLimit) {
          setRateLimitError(errorData);
        }
        setAuthenticated(false);
        setLoading(false);
      }
    } catch (err) {
      setAuthenticated(false);
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      // Load fewer activities initially to reduce API calls
      // User can load more via pagination if needed
      const response = await fetch('/api/activities?per_page=20');
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
        setRateLimitError(null);
        setError(null);
      } else {
        const errorData = await response.json();
        if (errorData.isRateLimit) {
          setRateLimitError(errorData);
        } else {
          setError(errorData.error || 'Failed to load activities');
        }
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleLogin = () => {
    window.location.href = '/api/auth/login';
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAuthenticated(false);
      setAthlete(null);
      setStats(null);
      setActivities([]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-palette-medium mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-palette-darkest mb-2">Strava Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Connect your Strava account to view your activities and statistics
            </p>
          </div>
          {error && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded">
              {error}
            </div>
          )}
          <button
            onClick={handleLogin}
            className="w-full bg-palette-light hover:bg-palette-medium text-palette-darkest font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Connect with Strava
          </button>
        </div>
      </div>
    );
  }

  const formatDistance = (meters: number): string => {
    const km = meters / 1000;
    if (km >= 1000) {
      return `${(km / 1000).toFixed(1)}k km`;
    }
    return `${km.toFixed(1)} km`;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between relative">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex flex-col">
                <h1 className="text-xl font-bold text-palette-darkest leading-tight">Strava</h1>
                <span className="text-xs text-palette-dark font-medium">Dashboard</span>
              </Link>
            </div>

            {/* Navigation */}
            <div className="flex-1 flex justify-center">
              <Navigation />
            </div>

            {/* User Profile & Actions */}
            <div className="flex items-center space-x-4">
              {athlete && <UserMenu athlete={athlete} />}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {rateLimitError && (
          <RateLimitError
            retryAfter={rateLimitError.retryAfter}
            rateLimitUsage={rateLimitError.rateLimitUsage}
            rateLimitLimit={rateLimitError.rateLimitLimit}
          />
        )}
        {error && !rateLimitError && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded">
            {error}
          </div>
        )}

        {/* Customizable Dashboard Widgets */}
        <div className="space-y-6">
          {widgets.includes('stats') && stats && (
            <DashboardWidget
              id="stats"
              title="Statistics"
              onRemove={() => {
                const newWidgets = widgets.filter((w) => w !== 'stats');
                setWidgets(newWidgets);
                const prefs = storage.preferences.get() as any;
                storage.preferences.set({ ...prefs, dashboardWidgets: newWidgets });
              }}
              onMove={(dir) => {
                const index = widgets.indexOf('stats');
                if (dir === 'up' && index > 0) {
                  const newWidgets = [...widgets];
                  [newWidgets[index], newWidgets[index - 1]] = [newWidgets[index - 1], newWidgets[index]];
                  setWidgets(newWidgets);
                } else if (dir === 'down' && index < widgets.length - 1) {
                  const newWidgets = [...widgets];
                  [newWidgets[index], newWidgets[index + 1]] = [newWidgets[index + 1], newWidgets[index]];
                  setWidgets(newWidgets);
                  const prefs = storage.preferences.get();
                  storage.preferences.set({ ...prefs, dashboardWidgets: newWidgets });
                }
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="Total Distance (All Time)"
                  value={formatDistance(stats.all_ride_totals.distance + stats.all_run_totals.distance)}
                />
                <StatsCard
                  title="Total Activities"
                  value={stats.all_ride_totals.count + stats.all_run_totals.count}
                />
                <StatsCard
                  title="Total Elevation Gain"
                  value={Math.round((stats.all_ride_totals.elevation_gain + stats.all_run_totals.elevation_gain) / 1000)}
                  unit="km"
                />
                <StatsCard
                  title="Recent Activities (4 weeks)"
                  value={stats.recent_ride_totals.count + stats.recent_run_totals.count}
                />
              </div>
            </DashboardWidget>
          )}

          {widgets.includes('streaks') && activities.length > 0 && (
            <DashboardWidget
              id="streaks"
              title="Activity Streaks"
              onRemove={() => {
                const newWidgets = widgets.filter((w) => w !== 'streaks');
                setWidgets(newWidgets);
                const prefs = storage.preferences.get() as any;
                storage.preferences.set({ ...prefs, dashboardWidgets: newWidgets });
              }}
            >
              <StreakDisplay streaks={calculateStreaks(activities)} />
            </DashboardWidget>
          )}

          {widgets.includes('chart') && activities.length > 0 && (
            <DashboardWidget
              id="chart"
              title="Activity Chart"
              onRemove={() => {
                const newWidgets = widgets.filter((w) => w !== 'chart');
                setWidgets(newWidgets);
                const prefs = storage.preferences.get() as any;
                storage.preferences.set({ ...prefs, dashboardWidgets: newWidgets });
              }}
            >
              <ActivityChart activities={activities} />
            </DashboardWidget>
          )}

          {widgets.includes('activities') && (
            <DashboardWidget
              id="activities"
              title="Recent Activities"
              onRemove={() => {
                const newWidgets = widgets.filter((w) => w !== 'activities');
                setWidgets(newWidgets);
                const prefs = storage.preferences.get() as any;
                storage.preferences.set({ ...prefs, dashboardWidgets: newWidgets });
              }}
            >
              {loading && activities.length === 0 ? (
                <ActivityListSkeleton />
              ) : activities.length > 0 ? (
                <ActivityList activities={activities} />
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No activities found</p>
              )}
            </DashboardWidget>
          )}
        </div>
      </main>
      </div>
    </ErrorBoundary>
  );
}

