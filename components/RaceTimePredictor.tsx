'use client';

import Link from 'next/link';
import { estimateRaceTimes } from '@/lib/analytics';
import { StravaActivity } from '@/lib/strava';

interface RaceTimePredictorProps {
  activities: StravaActivity[];
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function RaceTimePredictor({ activities }: RaceTimePredictorProps) {
  const raceTimes = estimateRaceTimes(activities);

  if (raceTimes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Log runs of 1km+ to see estimated race times
        </p>
        <Link
          href="/analytics"
          className="mt-2 inline-block text-sm font-medium text-strava hover:text-strava-hover"
        >
          View Analytics →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Based on your recent best efforts (Riegel formula)
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {raceTimes.map((rt) => (
          <div
            key={rt.distance}
            className="p-4 rounded-xl bg-white/40 dark:bg-white/5 text-center border border-white/20 dark:border-white/5"
          >
            <div className="font-bold text-slate-900 dark:text-white">{rt.distance}</div>
            <div className="text-lg font-semibold text-strava mt-1">
              {formatTime(rt.estimatedTime)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{rt.pace}/km</div>
          </div>
        ))}
      </div>
      <Link
        href="/analytics"
        className="mt-4 inline-block text-sm font-medium text-strava hover:text-strava-hover"
      >
        Full analytics →
      </Link>
    </div>
  );
}
