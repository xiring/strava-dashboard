'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StravaActivity, StravaAthlete } from '@/lib/strava';
import AppHeader from '@/components/AppHeader';
import PageHeader from '@/components/PageHeader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ComparePage() {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [athlete, setAthlete] = useState<StravaAthlete | null>(null);
  const [selectedActivities, setSelectedActivities] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

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
      const response = await fetch('/api/activities?per_page=50&page=1');
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const toggleActivity = (id: number) => {
    setSelectedActivities((prev) => {
      if (prev.includes(id)) {
        return prev.filter((a) => a !== id);
      }
      if (prev.length < 2) {
        return [...prev, id];
      }
      return prev;
    });
  };

  const selected = activities.filter((a) => selectedActivities.includes(a.id));

  const comparisonData = selected.map((activity) => ({
    name: activity.name.substring(0, 20) + (activity.name.length > 20 ? '...' : ''),
    distance: (activity.distance / 1000).toFixed(2),
    time: activity.moving_time / 3600,
    elevation: activity.total_elevation_gain,
    speed: ((activity.average_speed * 3600) / 1000).toFixed(1),
  }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-palette-light mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader athlete={athlete} />
      <PageHeader title="Compare Activities" />

      <main className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10">
        <div className="glass p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Select up to 2 activities to compare
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {activities.map((activity) => {
              const isSelected = selectedActivities.includes(activity.id);
              return (
                <button
                  key={activity.id}
                  onClick={() => toggleActivity(activity.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? 'border-palette-light bg-palette-light/20 dark:bg-palette-dark/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  disabled={!isSelected && selectedActivities.length >= 2}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900 dark:text-white truncate">
                      {activity.name}
                    </span>
                    {isSelected && <span className="text-palette-dark">✓</span>}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(activity.start_date_local).toLocaleDateString()}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {selected.length === 2 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {selected.map((activity, index) => (
                <div
                  key={activity.id}
                  className="glass p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Activity {index + 1}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Name</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {activity.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Distance</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {(activity.distance / 1000).toFixed(2)} km
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Time</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {Math.floor(activity.moving_time / 3600)}h{' '}
                        {Math.floor((activity.moving_time % 3600) / 60)}m
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Elevation</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {Math.round(activity.total_elevation_gain)} m
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Avg Speed</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {((activity.average_speed * 3600) / 1000).toFixed(1)} km/h
                      </span>
                    </div>
                    <Link
                      href={`/activities/${activity.id}`}
                      className="block mt-4 text-center text-palette-dark hover:text-palette-darkest font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Comparison Chart
              </h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
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
                  <Bar dataKey="time" fill="#10B981" name="Time (hours)" />
                  <Bar dataKey="elevation" fill="#3B82F6" name="Elevation (m)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {selected.length < 2 && selected.length > 0 && (
          <div className="glass p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Select one more activity to compare
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

