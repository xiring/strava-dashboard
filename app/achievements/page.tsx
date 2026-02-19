'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StravaActivity, StravaAthlete } from '@/lib/strava';
import AppHeader from '@/components/AppHeader';
import PageHeader from '@/components/PageHeader';
import {
  ACHIEVEMENTS,
  getUnlockedAchievements,
  getAchievementProgress,
  type Achievement,
} from '@/lib/achievements';

const CATEGORY_LABELS: Record<string, string> = {
  distance: 'Distance',
  streak: 'Streaks',
  milestone: 'Milestones',
  variety: 'Variety',
  elevation: 'Elevation',
  speed: 'Speed',
};

export default function AchievementsPage() {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [athlete, setAthlete] = useState<StravaAthlete | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [athleteRes, activitiesRes] = await Promise.all([
          fetch('/api/athlete'),
          fetch('/api/activities?per_page=500&page=1'),
        ]);
        if (athleteRes.ok) {
          const data = await athleteRes.json();
          setAthlete(data.athlete);
        }
        if (activitiesRes.ok) {
          const data = await activitiesRes.json();
          setActivities(data);
        }
        setLoading(false);
      } catch {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-strava mx-auto" />
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading achievements...</p>
        </div>
      </div>
    );
  }

  const unlocked = getUnlockedAchievements(activities);
  const grouped = ACHIEVEMENTS.reduce<Record<string, Achievement[]>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {});

  return (
    <div className="min-h-screen">
      <AppHeader athlete={athlete} />
      <PageHeader
        title="Achievements"
        actions={
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {unlocked.length} / {ACHIEVEMENTS.length} unlocked
          </span>
        }
      />

      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10">
        <div className="glass p-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="text-5xl">🏆</div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Your Progress
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Unlock badges by hitting milestones in your training
              </p>
            </div>
          </div>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-strava rounded-full transition-all duration-500"
              style={{ width: `${(unlocked.length / ACHIEVEMENTS.length) * 100}%` }}
            />
          </div>
        </div>

        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="glass p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              {CATEGORY_LABELS[category] || category}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((achievement) => {
                const isUnlocked = unlocked.some((u) => u.id === achievement.id);
                const progress = !isUnlocked && achievement.progress
                  ? getAchievementProgress(achievement, activities)
                  : null;

                return (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-xl border ${
                      isUnlocked
                        ? 'bg-white/60 dark:bg-white/5 border-white/30'
                        : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`text-3xl flex-shrink-0 ${
                          !isUnlocked ? 'grayscale opacity-50' : ''
                        }`}
                      >
                        {achievement.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {achievement.name}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                          {achievement.description}
                        </p>
                        {progress && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                              <span>{progress.current} / {progress.target}</span>
                            </div>
                            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-strava/70 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    (progress.current / progress.target) * 100,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                        {isUnlocked && (
                          <span className="inline-block mt-2 text-xs font-medium text-green-600 dark:text-green-400">
                            ✓ Unlocked
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="text-center mt-8">
          <Link
            href="/"
            className="text-strava hover:text-strava-hover font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
