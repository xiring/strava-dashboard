'use client';

import { StravaSegmentEffort } from '@/lib/strava';

interface SegmentEffortsDisplayProps {
  segmentEfforts: StravaSegmentEffort[];
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${meters} m`;
}

export default function SegmentEffortsDisplay({ segmentEfforts }: SegmentEffortsDisplayProps) {
  if (!segmentEfforts || segmentEfforts.length === 0) return null;

  return (
    <div className="glass p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Segment Efforts</h2>
      <div className="space-y-3">
        {segmentEfforts.map((effort) => (
          <div
            key={effort.id}
            className="flex items-center justify-between p-3 rounded-lg bg-white/40 dark:bg-white/5"
          >
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 dark:text-white truncate">
                {effort.segment?.name || effort.name}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                <span>{formatDistance(effort.distance)}</span>
                {effort.segment?.average_grade !== undefined && (
                  <span>Avg grade: {effort.segment.average_grade.toFixed(1)}%</span>
                )}
                {effort.segment?.climb_category !== undefined && effort.segment.climb_category > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs">
                    Cat {effort.segment.climb_category}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 ml-4 flex-shrink-0">
              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {formatDuration(effort.moving_time)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Time</div>
              </div>
              {effort.pr_rank !== undefined && effort.pr_rank > 0 && (
                <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm font-medium">
                  PR #{effort.pr_rank}
                </span>
              )}
              {effort.kom_rank !== undefined && effort.kom_rank > 0 && (
                <span className="px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-sm font-medium">
                  KOM #{effort.kom_rank}
                </span>
              )}
              <a
                href={`https://www.strava.com/segment_efforts/${effort.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-palette-light hover:underline"
              >
                View →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
