'use client';

import { useEffect, useState, useMemo } from 'react';
import { StravaActivity, StravaAthlete } from '@/lib/strava';
import AppHeader from '@/components/AppHeader';
import PageHeader from '@/components/PageHeader';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function StatisticsPage() {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [athlete, setAthlete] = useState<StravaAthlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month');

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
      // Load fewer activities - statistics can work with less data
      // For year view, we'll load more if needed
      const perPage = timeRange === 'year' || timeRange === 'all' ? 100 : 50;
      const response = await fetch(`/api/activities?per_page=${perPage}&page=1`);
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

  // Filter activities by time range
  const filteredActivities = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();

    switch (timeRange) {
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        return activities;
    }

    return activities.filter((activity) => new Date(activity.start_date_local) >= cutoff);
  }, [activities, timeRange]);

  // Group activities by date
  const dailyStats = useMemo(() => {
    const grouped = new Map<string, { distance: number; count: number; elevation: number; time: number }>();

    filteredActivities.forEach((activity) => {
      const date = new Date(activity.start_date_local).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      const existing = grouped.get(date) || { distance: 0, count: 0, elevation: 0, time: 0 };
      grouped.set(date, {
        distance: existing.distance + activity.distance,
        count: existing.count + 1,
        elevation: existing.elevation + activity.total_elevation_gain,
        time: existing.time + activity.moving_time,
      });
    });

    return Array.from(grouped.entries())
      .map(([date, stats]) => ({
        date,
        distance: stats.distance / 1000, // Convert to km
        count: stats.count,
        elevation: stats.elevation,
        time: stats.time / 3600, // Convert to hours
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredActivities]);

  // Activity type breakdown
  const typeBreakdown = useMemo(() => {
    const grouped = new Map<string, { count: number; distance: number }>();

    filteredActivities.forEach((activity) => {
      const existing = grouped.get(activity.type) || { count: 0, distance: 0 };
      grouped.set(activity.type, {
        count: existing.count + 1,
        distance: existing.distance + activity.distance,
      });
    });

    return Array.from(grouped.entries())
      .map(([type, stats]) => ({
        type,
        count: stats.count,
        distance: stats.distance / 1000,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredActivities]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredActivities.reduce(
      (acc, activity) => ({
        distance: acc.distance + activity.distance,
        count: acc.count + 1,
        elevation: acc.elevation + activity.total_elevation_gain,
        time: acc.time + activity.moving_time,
      }),
      { distance: 0, count: 0, elevation: 0, time: 0 }
    );
  }, [filteredActivities]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-strava-orange mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AppHeader athlete={athlete} />
      <PageHeader title="Statistics & Analytics" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded">
            {error}
          </div>
        )}

        {/* Time Range Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Range:</span>
            {(['week', 'month', 'year', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  timeRange === range
                    ? 'bg-strava-orange text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Distance</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {(totals.distance / 1000).toFixed(1)} km
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Activities</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totals.count}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Elevation</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(totals.elevation)} m
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Time</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(totals.time / 3600)}h {Math.round((totals.time % 3600) / 60)}m
            </div>
          </div>
        </div>

        {/* Daily Activity Chart */}
        {dailyStats.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Daily Activity Overview
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="distance"
                  stroke="#FC4C02"
                  fill="#FC4C02"
                  fillOpacity={0.6}
                  name="Distance (km)"
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.6}
                  name="Activities"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Activity Type Breakdown */}
        {typeBreakdown.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Activity Type Distribution
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="type" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#FC4C02" name="Number of Activities" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Distance by Activity Type
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="type" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6',
                    }}
                    formatter={(value: number) => `${value.toFixed(1)} km`}
                  />
                  <Legend />
                  <Bar dataKey="distance" fill="#10B981" name="Distance (km)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Activity Type Table */}
        {typeBreakdown.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Activity Type Summary
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Activity Type
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Count
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Total Distance
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Avg Distance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {typeBreakdown.map((item) => {
                    const typeActivities = filteredActivities.filter((a) => a.type === item.type);
                    const avgDistance =
                      typeActivities.reduce((sum, a) => sum + a.distance, 0) /
                      typeActivities.length /
                      1000;

                    return (
                      <tr
                        key={item.type}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">
                          {item.type}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                          {item.count}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                          {item.distance.toFixed(2)} km
                        </td>
                        <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                          {avgDistance.toFixed(2)} km
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

