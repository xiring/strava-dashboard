'use client';

import Link from 'next/link';
import {
  ACHIEVEMENTS,
  getUnlockedAchievements,
  getAchievementProgress,
  type Achievement,
} from '@/lib/achievements';
import { StravaActivity } from '@/lib/strava';

interface AchievementBadgesProps {
  activities: StravaActivity[];
  compact?: boolean;
}

export default function AchievementBadges({ activities, compact }: AchievementBadgesProps) {
  const unlocked = getUnlockedAchievements(activities);

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {unlocked.slice(0, 8).map((a) => (
          <span
            key={a.id}
            title={`${a.name}: ${a.description}`}
            className="text-2xl opacity-90 hover:opacity-100 transition-opacity"
          >
            {a.icon}
          </span>
        ))}
        {unlocked.length > 8 && (
          <span className="text-sm text-slate-500 dark:text-slate-400 self-center">
            +{unlocked.length - 8} more
          </span>
        )}
      </div>
    );
  }

  const locked = ACHIEVEMENTS.filter((a) => !unlocked.some((u) => u.id === a.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Achievements
        </h3>
        <Link
          href="/achievements"
          className="text-sm font-medium text-strava hover:text-strava-hover"
        >
          View all →
        </Link>
      </div>

      {/* Unlocked */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {unlocked.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} unlocked />
        ))}
      </div>

      {/* Locked (next few) */}
      {locked.length > 0 && (
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            Next to unlock
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {locked.slice(0, 4).map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                activities={activities}
                unlocked={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AchievementCard({
  achievement,
  unlocked,
  activities,
}: {
  achievement: Achievement;
  unlocked: boolean;
  activities?: StravaActivity[];
}) {
  const progress = !unlocked && activities && achievement.progress
    ? getAchievementProgress(achievement, activities)
    : null;

  return (
    <div
      className={`p-3 rounded-xl border transition-all ${
        unlocked
          ? 'bg-white/60 dark:bg-white/5 border-white/30 dark:border-white/10'
          : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-75'
      }`}
      title={achievement.description}
    >
      <div className="flex items-center gap-2">
        <span className={`text-2xl ${!unlocked ? 'grayscale opacity-60' : ''}`}>
          {achievement.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
            {achievement.name}
          </p>
          {progress && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {progress.current} / {progress.target}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
