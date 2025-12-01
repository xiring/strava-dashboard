'use client';

import { useEffect, useState, useMemo } from 'react';
import { StravaActivity, StravaAthlete } from '@/lib/strava';
import AppHeader from '@/components/AppHeader';
import PageHeader from '@/components/PageHeader';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function SummaryPage() {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [athlete, setAthlete] = useState<StravaAthlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

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
      const response = await fetch('/api/activities?per_page=200&page=1');
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const filteredActivities = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();

    switch (period) {
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
    }

    return activities.filter((activity) => new Date(activity.start_date_local) >= cutoff);
  }, [activities, period]);

  const totals = useMemo(() => {
    return filteredActivities.reduce(
      (acc, activity) => ({
        distance: acc.distance + activity.distance,
        count: acc.count + 1,
        elevation: acc.elevation + activity.total_elevation_gain,
        time: acc.time + activity.moving_time,
        calories: acc.calories + (activity.calories || 0),
      }),
      { distance: 0, count: 0, elevation: 0, time: 0, calories: 0 }
    );
  }, [filteredActivities]);

  const weeklyData = useMemo(() => {
    const weeks: Record<string, { distance: number; count: number; elevation: number }> = {};
    
    filteredActivities.forEach((activity) => {
      const date = new Date(activity.start_date_local);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = { distance: 0, count: 0, elevation: 0 };
      }
      
      weeks[weekKey].distance += activity.distance;
      weeks[weekKey].count += 1;
      weeks[weekKey].elevation += activity.total_elevation_gain;
    });

    return Object.entries(weeks)
      .map(([date, data]) => ({
        week: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        distance: (data.distance / 1000).toFixed(1),
        count: data.count,
        elevation: data.elevation,
      }))
      .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());
  }, [filteredActivities]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-strava-orange mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading summary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AppHeader athlete={athlete} />
      <PageHeader
        title="Activity Summary"
        actions={
          <div className="flex items-center space-x-2">
            {(['week', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                  period === p
                    ? 'bg-strava-orange text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Distance</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {(totals.distance / 1000).toFixed(1)} km
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Activities</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totals.count}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Elevation</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(totals.elevation)} m
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Time</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(totals.time / 3600)}h
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Calories</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(totals.calories)}
            </div>
          </div>
        </div>

        {/* Weekly Chart */}
        {weeklyData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Weekly Breakdown
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="week" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
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
                <Bar dataKey="distance" fill="#FC4C02" name="Distance (km)" />
                <Bar dataKey="count" fill="#10B981" name="Activities" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Activity Type Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Activity Type Summary
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Type
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Count
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Distance
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(
                  filteredActivities.reduce((acc, activity) => {
                    if (!acc[activity.type]) {
                      acc[activity.type] = { count: 0, distance: 0, time: 0 };
                    }
                    acc[activity.type].count++;
                    acc[activity.type].distance += activity.distance;
                    acc[activity.type].time += activity.moving_time;
                    return acc;
                  }, {} as Record<string, { count: number; distance: number; time: number }>)
                )
                  .sort(([, a], [, b]) => b.count - a.count)
                  .map(([type, stats]) => (
                    <tr
                      key={type}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">
                        {type}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                        {stats.count}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                        {(stats.distance / 1000).toFixed(2)} km
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                        {Math.floor(stats.time / 3600)}h {Math.floor((stats.time % 3600) / 60)}m
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

