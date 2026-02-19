'use client';

import { useEffect, useState } from 'react';
import { storage } from '@/lib/storage';
import { StravaAthlete } from '@/lib/strava';
import AppHeader from '@/components/AppHeader';
import PageHeader from '@/components/PageHeader';
import { useTheme } from '@/components/ThemeProvider';
import AccessibilityControls from '@/components/AccessibilityControls';
import { FormField, Input, Select, Button } from '@/components/ui';

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AppHeader athlete={athlete} />
      <PageHeader title="Settings" />

      <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10">
        <div className="glass p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Preferences</h2>
          
          <div className="space-y-6 max-w-md">
            <FormField label="Theme">
              <Select
                value={preferences.theme}
                onChange={(e) => handleThemeChange(e.target.value as 'light' | 'dark' | 'auto')}
              >
                <option value="auto">Auto (System)</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </Select>
            </FormField>

            <FormField label="Items Per Page" hint="Number of activities to show per page (6–24)">
              <Input
                type="number"
                min={6}
                max={24}
                value={preferences.itemsPerPage}
                onChange={(e) =>
                  setPreferences({ ...preferences, itemsPerPage: parseInt(e.target.value) || 12 })
                }
              />
            </FormField>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={savePreferences} size="lg">
                Save Preferences
              </Button>
              {saved && (
                <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium animate-fade-in">
                  ✓ Saved
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="glass p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Data Management</h2>
          
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-white/40 dark:bg-white/5 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Sync All Activities
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
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
                className="px-4 py-2.5 bg-strava hover:bg-strava-hover text-white font-semibold rounded-xl transition-colors"
              >
                Sync All Activities
              </button>
            </div>

            <div className="p-4 rounded-xl bg-white/40 dark:bg-white/5 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Clear Cache
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Clear all cached data. This will force fresh data to be loaded from Strava API.
              </p>
              <button
                onClick={() => {
                  if (confirm('Clear all cached data?')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-colors"
              >
                Clear Cache
              </button>
            </div>

            <div className="p-4 rounded-xl bg-white/40 dark:bg-white/5 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Export Data
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
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
                className="px-4 py-2.5 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors"
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

        <div className="glass p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">About</h2>
          <div className="space-y-2 text-slate-600 dark:text-slate-400">
            <p>Strava Dashboard v1.0.0</p>
            <p>Built with Next.js, React, and Tailwind CSS</p>
            <p className="mt-4">
              <a
                href="https://www.strava.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-strava hover:text-strava-hover font-medium"
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

