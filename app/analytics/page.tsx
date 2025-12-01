'use client';

import { useEffect, useState, useMemo } from 'react';
import { StravaActivity, StravaAthlete } from '@/lib/strava';
import AppHeader from '@/components/AppHeader';
import PageHeader from '@/components/PageHeader';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AnalyticsPage() {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [athlete, setAthlete] = useState<StravaAthlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const athleteResponse = await fetch('/api/athlete');
        if (athleteResponse.ok) {
          const athleteData = await athleteResponse.json();
          setAthlete(athleteData.athlete);
        }

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

    fetchData();
  }, []);

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
      default:
        return activities;
    }

    return activities.filter((a) => new Date(a.start_date_local) >= cutoff);
  }, [activities, timeRange]);

  // Power curve analysis (for runs)
  const powerCurve = useMemo(() => {
    const runs = filteredActivities.filter((a) => a.type === 'Run');
    const distances = [100, 400, 1000, 5000, 10000, 21097.5, 42195]; // 100m to marathon

    return distances.map((distance) => {
      const bestTimes = runs
        .map((run) => {
          // Estimate time for distance based on average pace
          const pace = run.moving_time / (run.distance / 1000); // seconds per km
          const estimatedTime = (pace * distance) / 1000;
          return { time: estimatedTime, date: run.start_date_local };
        })
        .filter((t) => t.time > 0)
        .sort((a, b) => a.time - b.time);

      return {
        distance: distance < 1000 ? `${distance}m` : `${distance / 1000}km`,
        time: bestTimes[0]?.time || 0,
        pace: bestTimes[0] ? bestTimes[0].time / (distance / 1000) : 0,
      };
    }).filter((p) => p.time > 0);
  }, [filteredActivities]);

  // Heart rate zones
  const heartRateZones = useMemo(() => {
    const withHR = filteredActivities.filter((a) => a.average_heartrate);
    if (withHR.length === 0) return null;

    const maxHR = Math.max(...withHR.map((a) => a.max_heartrate || 0));
    const zones = [
      { name: 'Zone 1 (50-60%)', min: maxHR * 0.5, max: maxHR * 0.6, count: 0 },
      { name: 'Zone 2 (60-70%)', min: maxHR * 0.6, max: maxHR * 0.7, count: 0 },
      { name: 'Zone 3 (70-80%)', min: maxHR * 0.7, max: maxHR * 0.8, count: 0 },
      { name: 'Zone 4 (80-90%)', min: maxHR * 0.8, max: maxHR * 0.9, count: 0 },
      { name: 'Zone 5 (90-100%)', min: maxHR * 0.9, max: maxHR, count: 0 },
    ];

    withHR.forEach((activity) => {
      const avgHR = activity.average_heartrate || 0;
      zones.forEach((zone) => {
        if (avgHR >= zone.min && avgHR < zone.max) {
          zone.count++;
        }
      });
    });

    return zones;
  }, [filteredActivities]);

  // Cadence analysis
  const cadenceData = useMemo(() => {
    const withCadence = filteredActivities
      .filter((a) => a.average_cadence)
      .map((a) => ({
        date: new Date(a.start_date_local).toLocaleDateString(),
        cadence: a.average_cadence || 0,
        type: a.type,
      }))
      .slice(-20); // Last 20 activities

    return withCadence;
  }, [filteredActivities]);

  // Activity type distribution
  const typeDistribution = useMemo(() => {
    const types = new Map<string, number>();
    filteredActivities.forEach((a) => {
      types.set(a.type, (types.get(a.type) || 0) + 1);
    });

    return Array.from(types.entries()).map(([type, count]) => ({
      name: type,
      value: count,
    }));
  }, [filteredActivities]);

  const COLORS = ['#FC4C02', '#FF6B35', '#F7931E', '#FFB84D', '#FFD700'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-strava-orange mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AppHeader athlete={athlete} />
      <PageHeader title="Advanced Analytics" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Time Range Selector */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Time Range:
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-strava-orange"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Activity Type Distribution */}
        {typeDistribution.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Activity Type Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Power Curve */}
        {powerCurve.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Power Curve (Estimated)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={powerCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="distance" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  formatter={(value: number) => `${Math.floor(value / 60)}:${(value % 60).toFixed(0).padStart(2, '0')}`}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="time" fill="#FC4C02" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Heart Rate Zones */}
        {heartRateZones && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Heart Rate Zone Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={heartRateZones}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="#FC4C02" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Cadence Analysis */}
        {cadenceData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Cadence Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cadenceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Line type="monotone" dataKey="cadence" stroke="#FC4C02" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </main>
    </div>
  );
}

