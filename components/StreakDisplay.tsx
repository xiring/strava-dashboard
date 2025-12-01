'use client';

import { StreakInfo } from '@/lib/streaks';

interface StreakDisplayProps {
  streaks: StreakInfo;
}

export default function StreakDisplay({ streaks }: StreakDisplayProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Activity Streaks</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Streak */}
        <div className="text-center p-4 bg-gradient-to-br from-strava-orange to-orange-600 rounded-lg">
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
        <div className="text-center p-4 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg">
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
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
            💪 Start a new streak today! Complete an activity to begin.
          </p>
        </div>
      )}
    </div>
  );
}

