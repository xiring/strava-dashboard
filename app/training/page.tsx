'use client';

import { useEffect, useState, useMemo } from 'react';
import { StravaActivity, StravaAthlete } from '@/lib/strava';
import AppHeader from '@/components/AppHeader';
import PageHeader from '@/components/PageHeader';
import { calculateTrainingLoad, getRecoveryRecommendation, TrainingLoadData } from '@/lib/trainingLoad';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function TrainingLoadPage() {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [athlete, setAthlete] = useState<StravaAthlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month'>('week');

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

  const trainingLoad = useMemo(() => calculateTrainingLoad(activities, period), [activities, period]);
  const currentWeek = trainingLoad[trainingLoad.length - 1];
  const recentWeeks = trainingLoad.slice(0, -1);
  const recommendation = useMemo(
    () => (currentWeek ? getRecoveryRecommendation(recentWeeks, currentWeek) : null),
    [currentWeek, recentWeeks]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-palette-light mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading training data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AppHeader athlete={athlete} />
      <PageHeader title="Training Load Analysis" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Period Selector */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Period:
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'week' | 'month')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-palette-light"
            >
              <option value="week">Last 4 Weeks</option>
              <option value="month">Last 12 Weeks</option>
            </select>
          </div>
        </div>

        {/* Recovery Recommendation */}
        {recommendation && (
          <div
            className={
              recommendation.status === 'overtrained'
                ? 'mb-6 p-6 rounded-lg shadow-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                : recommendation.status === 'tired'
                ? 'mb-6 p-6 rounded-lg shadow-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                : recommendation.status === 'ready'
                ? 'mb-6 p-6 rounded-lg shadow-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                : 'mb-6 p-6 rounded-lg shadow-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            }
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Recovery Status: {recommendation.status.charAt(0).toUpperCase() + recommendation.status.slice(1)}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">{recommendation.message}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{recommendation.recommendation}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {recommendation.score}/100
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Recovery Score</div>
                <div className="text-2xl mt-2">
                  {recommendation.status === 'overtrained' ? '⚠️' :
                   recommendation.status === 'tired' ? '😴' :
                   recommendation.status === 'ready' ? '✅' : '💪'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Current Week Stats */}
        {currentWeek && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Volume</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentWeek.volume.toFixed(1)} km
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Time</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentWeek.time.toFixed(1)}h
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Activities</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentWeek.activities}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Stress Score</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(currentWeek.stressScore)}
              </div>
            </div>
          </div>
        )}

        {/* Training Load Chart */}
        {trainingLoad.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Training Volume Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trainingLoad}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="week" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#FC4C02"
                  fill="#FC4C02"
                  fillOpacity={0.3}
                  name="Volume (km)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Training Stress Chart */}
        {trainingLoad.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Training Stress Score</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trainingLoad}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="week" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="stressScore"
                  stroke="#FC4C02"
                  strokeWidth={2}
                  name="Stress Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Training Load Table */}
        {trainingLoad.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Weekly Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Week</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Volume (km)</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Time (h)</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Activities</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Intensity</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Stress Score</th>
                  </tr>
                </thead>
                <tbody>
                  {trainingLoad.map((week, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-900 dark:text-white">{week.week}</td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-white">{week.volume.toFixed(1)}</td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-white">{week.time.toFixed(1)}</td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-white">{week.activities}</td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-white">{(week.intensity * 100).toFixed(0)}%</td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-white">{Math.round(week.stressScore)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

