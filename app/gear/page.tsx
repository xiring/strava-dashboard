'use client';

import { useEffect, useState } from 'react';
import { StravaAthlete } from '@/lib/strava';
import AppHeader from '@/components/AppHeader';
import PageHeader from '@/components/PageHeader';

interface Gear {
  id: string;
  name: string;
  type: string;
  brand?: string;
  model?: string;
  distance: number;
  purchase_date?: string;
  purchase_price?: number;
  notes?: string;
  athlete_id: number;
  is_active: boolean;
}

export default function GearPage() {
  const [gear, setGear] = useState<Gear[]>([]);
  const [athlete, setAthlete] = useState<StravaAthlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGear, setNewGear] = useState<Partial<Gear>>({
    name: '',
    type: 'bike',
    brand: '',
    model: '',
    distance: 0,
    is_active: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const athleteResponse = await fetch('/api/athlete');
        if (athleteResponse.ok) {
          const athleteData = await athleteResponse.json();
          setAthlete(athleteData.athlete);
        }

        const response = await fetch('/api/gear');
        if (response.ok) {
          const data = await response.json();
          setGear(data);
        }
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddGear = async () => {
    try {
      const response = await fetch('/api/gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGear),
      });

      if (response.ok) {
        const data = await response.json();
        setGear([...gear, data]);
        setNewGear({
          name: '',
          type: 'bike',
          brand: '',
          model: '',
          distance: 0,
          is_active: true,
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding gear:', error);
    }
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters.toFixed(0)}m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-palette-light mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading gear...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AppHeader athlete={athlete} />
      <PageHeader
        title="Gear Tracking"
        actions={
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-palette-light hover:bg-palette-medium text-palette-darkest font-semibold rounded-lg transition-colors"
          >
            {showAddForm ? 'Cancel' : '+ Add Gear'}
          </button>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Gear Form */}
        {showAddForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add New Gear</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={newGear.name}
                  onChange={(e) => setNewGear({ ...newGear, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Road Bike"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type *
                </label>
                <select
                  value={newGear.type}
                  onChange={(e) => setNewGear({ ...newGear, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="bike">Bike</option>
                  <option value="shoes">Shoes</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  value={newGear.brand}
                  onChange={(e) => setNewGear({ ...newGear, brand: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Model
                </label>
                <input
                  type="text"
                  value={newGear.model}
                  onChange={(e) => setNewGear({ ...newGear, model: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleAddGear}
                disabled={!newGear.name}
                className="px-6 py-2 bg-palette-light hover:bg-palette-medium text-palette-darkest font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Gear
              </button>
            </div>
          </div>
        )}

        {/* Gear List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gear.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-palette-light"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                  {item.brand && item.model && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {item.brand} {item.model}
                    </p>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  item.is_active
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}>
                  {item.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Type</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {item.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total Distance</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDistance(item.distance)}
                  </span>
                </div>
                {item.purchase_date && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Purchase Date</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(item.purchase_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {gear.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
              No gear tracked yet.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-palette-light hover:bg-palette-medium text-palette-darkest font-semibold rounded-lg transition-colors"
            >
              Add Your First Gear
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

