'use client';

import { useEffect, useState } from 'react';
import { StravaAthlete } from '@/lib/strava';
import AppHeader from '@/components/AppHeader';
import PageHeader from '@/components/PageHeader';
import dynamic from 'next/dynamic';

const RouteMap = dynamic(() => import('@/components/RouteMap'), { ssr: false });

interface Route {
  id: string;
  name: string;
  description?: string;
  polyline: string;
  distance: number;
  elevation_gain?: number;
  athlete_id: number;
  is_public: boolean;
  is_favorite: boolean;
  createdAt: string;
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [athlete, setAthlete] = useState<StravaAthlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [newRoute, setNewRoute] = useState({
    name: '',
    description: '',
    polyline: '',
    distance: '',
    elevation_gain: '',
    is_public: false,
    is_favorite: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const athleteResponse = await fetch('/api/athlete');
        if (athleteResponse.ok) {
          const athleteData = await athleteResponse.json();
          setAthlete(athleteData.athlete);
        }

        const response = await fetch('/api/routes');
        if (response.ok) {
          const data = await response.json();
          setRoutes(data);
        }
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddRoute = async () => {
    try {
      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRoute,
          distance: parseFloat(newRoute.distance) * 1000, // Convert km to meters
          elevation_gain: newRoute.elevation_gain ? parseFloat(newRoute.elevation_gain) : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRoutes([...routes, data]);
        setNewRoute({
          name: '',
          description: '',
          polyline: '',
          distance: '',
          elevation_gain: '',
          is_public: false,
          is_favorite: false,
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding route:', error);
    }
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters.toFixed(0)}m`;
    return `${(meters / 1000).toFixed(2)} km`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-palette-light mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading routes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AppHeader athlete={athlete} />
      <PageHeader
        title="Route Planning"
        actions={
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-palette-light hover:bg-palette-medium text-palette-darkest font-semibold rounded-lg transition-colors"
          >
            {showAddForm ? 'Cancel' : '+ New Route'}
          </button>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Route Form */}
        {showAddForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create New Route</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Route Name *
                </label>
                <input
                  type="text"
                  value={newRoute.name}
                  onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Morning Loop"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Distance (km) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newRoute.distance}
                  onChange={(e) => setNewRoute({ ...newRoute, distance: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Elevation Gain (m)
                </label>
                <input
                  type="number"
                  value={newRoute.elevation_gain}
                  onChange={(e) => setNewRoute({ ...newRoute, elevation_gain: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Polyline (encoded)
                </label>
                <input
                  type="text"
                  value={newRoute.polyline}
                  onChange={(e) => setNewRoute({ ...newRoute, polyline: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Paste encoded polyline here"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newRoute.description}
                  onChange={(e) => setNewRoute({ ...newRoute, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newRoute.is_favorite}
                    onChange={(e) => setNewRoute({ ...newRoute, is_favorite: e.target.checked })}
                    className="w-4 h-4 text-palette-dark border-gray-300 rounded focus:ring-palette-light"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Favorite</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newRoute.is_public}
                    onChange={(e) => setNewRoute({ ...newRoute, is_public: e.target.checked })}
                    className="w-4 h-4 text-palette-dark border-gray-300 rounded focus:ring-palette-light"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Public</span>
                </label>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleAddRoute}
                disabled={!newRoute.name || !newRoute.distance}
                className="px-6 py-2 bg-palette-light hover:bg-palette-medium text-palette-darkest font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Route
              </button>
            </div>
          </div>
        )}

        {/* Routes List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.map((route) => (
            <div
              key={route.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-palette-light cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedRoute(route)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{route.name}</h3>
                  {route.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{route.description}</p>
                  )}
                </div>
                {route.is_favorite && (
                  <span className="text-yellow-500 text-xl">⭐</span>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Distance</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDistance(route.distance)}
                  </span>
                </div>
                {route.elevation_gain && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Elevation</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {Math.round(route.elevation_gain)}m
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {routes.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
              No routes saved yet.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-palette-light hover:bg-palette-medium text-palette-darkest font-semibold rounded-lg transition-colors"
            >
              Create Your First Route
            </button>
          </div>
        )}

        {/* Route Detail Modal */}
        {selectedRoute && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedRoute.name}</h2>
                    {selectedRoute.description && (
                      <p className="text-gray-600 dark:text-gray-400 mt-2">{selectedRoute.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedRoute(null)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Distance</span>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatDistance(selectedRoute.distance)}
                    </p>
                  </div>
                  {selectedRoute.elevation_gain && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Elevation Gain</span>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {Math.round(selectedRoute.elevation_gain)}m
                      </p>
                    </div>
                  )}
                </div>
                {selectedRoute.polyline && (
                  <div className="h-96 mb-4">
                    <RouteMap polyline={selectedRoute.polyline} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

