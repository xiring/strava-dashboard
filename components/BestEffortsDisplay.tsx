'use client';

import Link from 'next/link';
import { BestEffort, formatDistance, formatTime } from '@/lib/bestEfforts';

interface BestEffortsDisplayProps {
  bestEfforts: Map<number, BestEffort>;
}

export default function BestEffortsDisplay({ bestEfforts }: BestEffortsDisplayProps) {
  const effortsArray = Array.from(bestEfforts.values()).sort((a, b) => a.distance - b.distance);

  if (effortsArray.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Best Efforts</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center py-8">
          No best efforts recorded yet. Complete activities at common distances to track your personal bests!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Best Efforts</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Distance
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Time
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Pace
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Date
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Activity
              </th>
            </tr>
          </thead>
          <tbody>
            {effortsArray.map((effort) => {
              const paceMinutes = Math.floor(effort.pace / 60);
              const paceSeconds = Math.floor(effort.pace % 60);
              const paceString = `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')} /km`;

              return (
                <tr
                  key={effort.distance}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">
                    {formatDistance(effort.distance)}
                  </td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">
                    {formatTime(effort.time)}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{paceString}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {new Date(effort.activityDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/activities/${effort.activityId}`}
                      className="text-strava-orange hover:text-orange-600 font-medium truncate max-w-xs block"
                      title={effort.activityName}
                    >
                      {effort.activityName}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

