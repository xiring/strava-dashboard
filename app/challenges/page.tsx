'use client';

import { useEffect, useState, useMemo } from 'react';
import { storage } from '@/lib/storage';
import { StravaActivity, StravaAthlete } from '@/lib/strava';
import AppHeader from '@/components/AppHeader';
import PageHeader from '@/components/PageHeader';
import { calculateStreaks } from '@/lib/streaks';

type ChallengeType = 'distance' | 'streak' | 'elevation' | 'activities';

interface Challenge {
  id: string;
  type: ChallengeType;
  name: string;
  target: number;
  period: 'week' | 'month' | 'year';
  unit: string;
  activityTypes?: string[]; // e.g. ['Run'] for "Run every day"
}

const CHALLENGE_TEMPLATES: Partial<Challenge>[] = [
  { type: 'distance', name: '100 km this month', target: 100, period: 'month', unit: 'km' },
  { type: 'distance', name: '500 km this year', target: 500, period: 'year', unit: 'km' },
  { type: 'streak', name: 'Run every day for 7 days', target: 7, period: 'week', unit: 'days', activityTypes: ['Run'] },
  { type: 'streak', name: 'Activity every day for 14 days', target: 14, period: 'week', unit: 'days' },
  { type: 'elevation', name: '1000 m elevation this month', target: 1000, period: 'month', unit: 'm' },
  { type: 'activities', name: '20 activities this month', target: 20, period: 'month', unit: 'activities' },
];

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [athlete, setAthlete] = useState<StravaAthlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    const fetchAthlete = async () => {
      try {
        const response = await fetch('/api/athlete');
        if (response.ok) {
          const data = await response.json();
          setAthlete(data.athlete);
        }
      } catch (err) {
        // Ignore
      }
    };
    fetchAthlete();
    loadChallenges();
    loadActivities();
  }, []);

  const loadChallenges = () => {
    const prefs = storage.preferences.get() as any;
    setChallenges(prefs?.challenges || []);
  };

  const loadActivities = async () => {
    try {
      const response = await fetch('/api/activities?per_page=500&page=1');
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const addChallenge = (template: Partial<Challenge>) => {
    const challenge: Challenge = {
      id: Date.now().toString(),
      type: (template.type || 'distance') as ChallengeType,
      name: template.name || 'New Challenge',
      target: template.target || 100,
      period: (template.period || 'month') as Challenge['period'],
      unit: template.unit || 'km',
      activityTypes: template.activityTypes,
    };
    const updated = [...challenges, challenge];
    setChallenges(updated);
    const prefs = storage.preferences.get() as any;
    storage.preferences.set({ ...prefs, challenges: updated });
    setShowAdd(false);
  };

  const removeChallenge = (id: string) => {
    const updated = challenges.filter((c) => c.id !== id);
    setChallenges(updated);
    const prefs = storage.preferences.get() as any;
    storage.preferences.set({ ...prefs, challenges: updated });
  };

  const getChallengeProgress = (challenge: Challenge) => {
    const now = new Date();
    let filtered = [...activities];

    switch (challenge.period) {
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        filtered = filtered.filter((a) => new Date(a.start_date_local) >= weekAgo);
        break;
      case 'month':
        filtered = filtered.filter(
          (a) =>
            new Date(a.start_date_local).getMonth() === now.getMonth() &&
            new Date(a.start_date_local).getFullYear() === now.getFullYear()
        );
        break;
      case 'year':
        filtered = filtered.filter((a) => new Date(a.start_date_local).getFullYear() === now.getFullYear());
        break;
    }

    if (challenge.activityTypes?.length) {
      filtered = filtered.filter((a) => challenge.activityTypes!.includes(a.type));
    }

    let current = 0;
    if (challenge.type === 'distance') {
      current = filtered.reduce((sum, a) => sum + a.distance, 0) / 1000;
    } else if (challenge.type === 'elevation') {
      current = filtered.reduce((sum, a) => sum + a.total_elevation_gain, 0);
    } else if (challenge.type === 'activities') {
      current = filtered.length;
    } else if (challenge.type === 'streak') {
      const streaks = calculateStreaks(activities, challenge.activityTypes);
      current = streaks[0]?.count ?? 0;
    }

    const progress = Math.min((current / challenge.target) * 100, 100);
    return { current, progress };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-palette-light" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader athlete={athlete} />
      <PageHeader
        title="Custom Challenges"
        actions={
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2 bg-palette-light hover:bg-palette-medium text-palette-darkest font-semibold rounded-lg flex items-center gap-2"
          >
            <span>+</span>
            <span className="hidden sm:inline">Add Challenge</span>
          </button>
        }
      />

      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10">
        {showAdd && (
          <div className="glass p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add a challenge</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CHALLENGE_TEMPLATES.map((t, i) => (
                <button
                  key={i}
                  onClick={() => addChallenge(t)}
                  className="p-4 text-left rounded-lg border border-white/40 dark:border-white/10 hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
                >
                  <span className="font-medium text-gray-900 dark:text-white">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {challenges.length === 0 && !showAdd ? (
          <div className="glass p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No challenges yet. Add one to get started!</p>
            <button
              onClick={() => setShowAdd(true)}
              className="px-4 py-2 bg-palette-light hover:bg-palette-medium text-palette-darkest font-semibold rounded-lg"
            >
              Add Challenge
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {challenges.map((challenge) => {
              const { current, progress } = getChallengeProgress(challenge);
              const done = progress >= 100;
              return (
                <div
                  key={challenge.id}
                  className="glass p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{challenge.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {current.toFixed(1)} / {challenge.target} {challenge.unit}
                    </p>
                    <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${done ? 'bg-green-500' : 'bg-palette-light'}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {done && (
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                        Done!
                      </span>
                    )}
                    <button
                      onClick={() => removeChallenge(challenge.id)}
                      className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
