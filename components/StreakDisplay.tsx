'use client';

import { StreakInfo } from '@/lib/streaks';

interface StreakDisplayProps {
  streaks: StreakInfo;
}

export default function StreakDisplay({ streaks }: StreakDisplayProps) {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Streak */}
        <div className="text-center p-6 bg-gradient-to-br from-strava/90 to-strava-hover/90 backdrop-blur-sm rounded-2xl shadow-soft border border-white/20">
          <div className="text-sm text-white/80 mb-1">Current Streak</div>
          <div className="text-4xl font-bold text-white mb-2">{streaks.current}</div>
          <div className="text-sm text-white/80">
            {streaks.current > 0 ? 'days' : 'No active streak'}
          </div>
          {streaks.currentStartDate && (
            <div className="text-xs text-white/70 mt-2">
              Started {new Date(streaks.currentStartDate).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Longest Streak */}
        <div className="text-center p-6 bg-gradient-to-br from-slate-600/90 to-slate-800/90 backdrop-blur-sm rounded-2xl shadow-soft border border-white/10">
          <div className="text-sm text-white/80 mb-1">Longest Streak</div>
          <div className="text-4xl font-bold text-white mb-2">{streaks.longest}</div>
          <div className="text-sm text-white/80">days</div>
          {streaks.longestStartDate && streaks.longestEndDate && (
            <div className="text-xs text-white/70 mt-2">
              {new Date(streaks.longestStartDate).toLocaleDateString()} -{' '}
              {new Date(streaks.longestEndDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {streaks.current === 0 && (
        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
            💪 Start a new streak today! Complete an activity to begin.
          </p>
        </div>
      )}
    </div>
  );
}

