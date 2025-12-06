'use client';

import { useEffect, useState } from 'react';
import { storage } from '@/lib/storage';
import { StravaAthlete } from '@/lib/strava';
import AppHeader from '@/components/AppHeader';
import PageHeader from '@/components/PageHeader';
import { useTheme } from '@/components/ThemeProvider';
import AccessibilityControls from '@/components/AccessibilityControls';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [athlete, setAthlete] = useState<StravaAthlete | null>(null);
  const [preferences, setPreferences] = useState({
    theme: theme,
    itemsPerPage: 12,
  });
  const [saved, setSaved] = useState(false);

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
  }, []);

  useEffect(() => {
    const prefs = storage.preferences.get();
    if (prefs) {
      setPreferences({ ...prefs, theme: theme });
    }
  }, [theme]);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
    setPreferences({ ...preferences, theme: newTheme });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const savePreferences = () => {
    storage.preferences.set(preferences);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AppHeader athlete={athlete} />
      <PageHeader title="Settings" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Preferences</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
              <select
                value={preferences.theme}
                onChange={(e) => handleThemeChange(e.target.value as 'light' | 'dark' | 'auto')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="auto">Auto (System)</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Items Per Page
              </label>
              <input
                type="number"
                min="6"
                max="24"
                value={preferences.itemsPerPage}
                onChange={(e) =>
                  setPreferences({ ...preferences, itemsPerPage: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <button
              onClick={savePreferences}
              className="px-6 py-3 bg-palette-light hover:bg-palette-medium text-palette-darkest font-semibold rounded-lg transition-colors"
            >
              Save Preferences
            </button>

            {saved && (
              <div className="p-4 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 rounded">
                Preferences saved!
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Data Management</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Sync All Activities
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Sync all your activities from Strava to the local database. This may take a few minutes depending on how many activities you have.
              </p>
              <button
                onClick={async () => {
                  if (confirm('Sync all activities from Strava? This may take a few minutes.')) {
                    try {
                      const response = await fetch('/api/sync', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'activities', force: true, syncAll: true }),
                      });
                      const data = await response.json();
                      if (data.success) {
                        alert(`Successfully synced ${data.activities} activities!`);
                        window.location.reload();
                      } else {
                        alert(`Error: ${data.error || 'Failed to sync activities'}`);
                      }
                    } catch (error: any) {
                      alert(`Error: ${error.message || 'Failed to sync activities'}`);
                    }
                  }
                }}
                className="px-4 py-2 bg-palette-light hover:bg-palette-medium text-palette-darkest font-semibold rounded-lg transition-colors"
              >
                Sync All Activities
              </button>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Clear Cache
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Clear all cached data. This will force fresh data to be loaded from Strava API.
              </p>
              <button
                onClick={() => {
                  if (confirm('Clear all cached data?')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-colors"
              >
                Clear Cache
              </button>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Export Data
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Export your preferences and saved data.
              </p>
              <button
                onClick={() => {
                  const data = {
                    preferences: storage.preferences.get(),
                    favorites: storage.favoriteActivities.get(),
                    recentSearches: storage.recentSearches.get(),
                  };
                  const blob = new Blob([JSON.stringify(data, null, 2)], {
                    type: 'application/json',
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'strava-dashboard-data.json';
                  link.click();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Export Settings
              </button>
            </div>
          </div>
        </div>

        {/* Accessibility */}
        <div className="mb-6">
          <AccessibilityControls />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About</h2>
          <div className="space-y-2 text-gray-600 dark:text-gray-400">
            <p>Strava Dashboard v1.0.0</p>
            <p>Built with Next.js, React, and Tailwind CSS</p>
            <p className="mt-4">
              <a
                href="https://www.strava.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-palette-dark hover:text-palette-darkest"
              >
                Powered by Strava API
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

