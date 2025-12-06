'use client';

import { useEffect, useState } from 'react';
import { StravaActivity, StravaAthlete } from '@/lib/strava';
import AppHeader from '@/components/AppHeader';
import PageHeader from '@/components/PageHeader';
import ActivityHeatmap from '@/components/ActivityHeatmap';

export default function HeatmapPage() {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [athlete, setAthlete] = useState<StravaAthlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch athlete
        const athleteResponse = await fetch('/api/athlete');
        if (athleteResponse.ok) {
          const athleteData = await athleteResponse.json();
          setAthlete(athleteData.athlete);
        }

        // Fetch all activities for heatmap
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

  // Get available years from activities
  const availableYears = Array.from(
    new Set(
      activities.map((a) => new Date(a.start_date_local).getFullYear())
    )
  ).sort((a, b) => b - a);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-palette-light mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading heatmap...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AppHeader athlete={athlete} />
      <PageHeader title="Activity Heatmap" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Year Selector */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Year:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-palette-light"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Heatmap */}
        <ActivityHeatmap activities={activities} year={selectedYear} />

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Activities</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {activities.filter(
                (a) => new Date(a.start_date_local).getFullYear() === selectedYear
              ).length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Distance</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {(
                activities
                  .filter((a) => new Date(a.start_date_local).getFullYear() === selectedYear)
                  .reduce((sum, a) => sum + a.distance, 0) / 1000
              ).toFixed(1)}{' '}
              km
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Active Days</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {
                new Set(
                  activities
                    .filter((a) => new Date(a.start_date_local).getFullYear() === selectedYear)
                    .map((a) => new Date(a.start_date_local).toISOString().split('T')[0])
                ).size
              }
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

