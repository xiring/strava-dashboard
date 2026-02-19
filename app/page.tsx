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
import AppHeader from '@/components/AppHeader';
import StreakDisplay from '@/components/StreakDisplay';
import BestEffortsDisplay from '@/components/BestEffortsDisplay';
import AchievementBadges from '@/components/AchievementBadges';
import RaceTimePredictor from '@/components/RaceTimePredictor';
import DashboardWidget from '@/components/DashboardWidget';
import { calculateStreaks } from '@/lib/streaks';
import ThisDayLastYear from '@/components/ThisDayLastYear';
import CumulativeDistanceChart from '@/components/CumulativeDistanceChart';
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
    return saved?.dashboardWidgets || ['stats', 'streaks', 'achievements', 'raceTimes', 'chart', 'cumulativeDistance', 'thisDayLastYear', 'activities'];
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
      const response = await fetch('/api/activities?per_page=200');
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-200 dark:border-slate-700 border-t-strava mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full glass p-10 text-center">
          <div className="mb-8">
            <div className="w-16 h-16 rounded-2xl bg-strava text-white font-bold text-2xl flex items-center justify-center mx-auto mb-6 shadow-glow">
              S
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Strava Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Connect your Strava account to view your activities and statistics
            </p>
          </div>
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-sm">
              {error}
            </div>
          )}
          <button
            onClick={handleLogin}
            className="w-full bg-strava hover:bg-strava-hover text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-soft hover:shadow-glow active:scale-[0.98]"
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
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <AppHeader athlete={athlete} />

      {/* Main Content */}
      <main className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10">
        {rateLimitError && (
          <RateLimitError
            retryAfter={rateLimitError.retryAfter}
            rateLimitUsage={rateLimitError.rateLimitUsage}
            rateLimitLimit={rateLimitError.rateLimitLimit}
          />
        )}
        {error && !rateLimitError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl">
            {error}
          </div>
        )}

        {/* Customizable Dashboard Widgets */}
        <div className="space-y-8">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-5">
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

          {widgets.includes('achievements') && activities.length > 0 && (
            <DashboardWidget
              id="achievements"
              title="Achievements"
              onRemove={() => {
                const newWidgets = widgets.filter((w) => w !== 'achievements');
                setWidgets(newWidgets);
                const prefs = storage.preferences.get() as any;
                storage.preferences.set({ ...prefs, dashboardWidgets: newWidgets });
              }}
            >
              <AchievementBadges activities={activities} />
            </DashboardWidget>
          )}

          {widgets.includes('raceTimes') && activities.length > 0 && (
            <DashboardWidget
              id="raceTimes"
              title="Race Time Predictor"
              onRemove={() => {
                const newWidgets = widgets.filter((w) => w !== 'raceTimes');
                setWidgets(newWidgets);
                const prefs = storage.preferences.get() as any;
                storage.preferences.set({ ...prefs, dashboardWidgets: newWidgets });
              }}
            >
              <RaceTimePredictor activities={activities} />
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

          {widgets.includes('cumulativeDistance') && activities.length > 0 && (
            <DashboardWidget
              id="cumulativeDistance"
              title="Yearly Progress"
              onRemove={() => {
                const newWidgets = widgets.filter((w) => w !== 'cumulativeDistance');
                setWidgets(newWidgets);
                const prefs = storage.preferences.get() as any;
                storage.preferences.set({ ...prefs, dashboardWidgets: newWidgets });
              }}
            >
              <CumulativeDistanceChart activities={activities} />
            </DashboardWidget>
          )}

          {widgets.includes('thisDayLastYear') && activities.length > 0 && (
            <DashboardWidget
              id="thisDayLastYear"
              title="This Day Last Year"
              onRemove={() => {
                const newWidgets = widgets.filter((w) => w !== 'thisDayLastYear');
                setWidgets(newWidgets);
                const prefs = storage.preferences.get() as any;
                storage.preferences.set({ ...prefs, dashboardWidgets: newWidgets });
              }}
            >
              <ThisDayLastYear activities={activities} />
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
                <ActivityList activities={activities} limit={10} />
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-center py-12">No activities found</p>
              )}
            </DashboardWidget>
          )}
        </div>
      </main>
      </div>
    </ErrorBoundary>
  );
}

