/**
 * Analytics utilities: pace zones, estimated race times, personal insights
 */
import { StravaActivity } from './strava';

// Pace zones for running (min/km) - easy, tempo, threshold, VO2max
export const PACE_ZONES = {
  easy: { min: 6.5, max: 8.0, label: 'Easy', color: '#22c55e' },
  tempo: { min: 5.0, max: 6.5, label: 'Tempo', color: '#eab308' },
  threshold: { min: 4.0, max: 5.0, label: 'Threshold', color: '#f97316' },
  vo2max: { min: 0, max: 4.0, label: 'VO2max', color: '#ef4444' },
};

export interface PaceZoneData {
  zone: string;
  label: string;
  color: string;
  timeSeconds: number;
  percent: number;
}

export function calculatePaceZones(activities: StravaActivity[]): PaceZoneData[] {
  const runs = activities.filter((a) => a.type === 'Run' && a.distance > 0 && a.moving_time > 0);
  if (runs.length === 0) return [];

  const zoneTotals: Record<string, number> = {
    easy: 0,
    tempo: 0,
    threshold: 0,
    vo2max: 0,
  };

  runs.forEach((run) => {
    const paceMinPerKm = (run.moving_time / 60) / (run.distance / 1000);
    const splits = run.splits_metric || run.splits_standard || [];
    if (splits.length === 0) {
      // Use overall pace for the whole run
      if (paceMinPerKm >= PACE_ZONES.easy.min && paceMinPerKm <= PACE_ZONES.easy.max) {
        zoneTotals.easy += run.moving_time;
      } else if (paceMinPerKm >= PACE_ZONES.tempo.min && paceMinPerKm < PACE_ZONES.tempo.max) {
        zoneTotals.tempo += run.moving_time;
      } else if (paceMinPerKm >= PACE_ZONES.threshold.min && paceMinPerKm < PACE_ZONES.threshold.max) {
        zoneTotals.threshold += run.moving_time;
      } else if (paceMinPerKm < PACE_ZONES.vo2max.max) {
        zoneTotals.vo2max += run.moving_time;
      } else {
        zoneTotals.easy += run.moving_time;
      }
    } else {
      splits.forEach((split: { moving_time: number; average_speed: number }) => {
        if (!split.average_speed || split.average_speed <= 0) return;
        const splitPace = 1000 / split.average_speed / 60; // min per km
        if (splitPace >= PACE_ZONES.easy.min && splitPace <= PACE_ZONES.easy.max) {
          zoneTotals.easy += split.moving_time;
        } else if (splitPace >= PACE_ZONES.tempo.min && splitPace < PACE_ZONES.tempo.max) {
          zoneTotals.tempo += split.moving_time;
        } else if (splitPace >= PACE_ZONES.threshold.min && splitPace < PACE_ZONES.threshold.max) {
          zoneTotals.threshold += split.moving_time;
        } else if (splitPace < PACE_ZONES.vo2max.max) {
          zoneTotals.vo2max += split.moving_time;
        } else {
          zoneTotals.easy += split.moving_time;
        }
      });
    }
  });

  const totalSeconds = Object.values(zoneTotals).reduce((a, b) => a + b, 0);
  if (totalSeconds === 0) return [];

  return [
    { zone: 'easy', ...PACE_ZONES.easy, timeSeconds: zoneTotals.easy, percent: (zoneTotals.easy / totalSeconds) * 100 },
    { zone: 'tempo', ...PACE_ZONES.tempo, timeSeconds: zoneTotals.tempo, percent: (zoneTotals.tempo / totalSeconds) * 100 },
    { zone: 'threshold', ...PACE_ZONES.threshold, timeSeconds: zoneTotals.threshold, percent: (zoneTotals.threshold / totalSeconds) * 100 },
    { zone: 'vo2max', ...PACE_ZONES.vo2max, timeSeconds: zoneTotals.vo2max, percent: (zoneTotals.vo2max / totalSeconds) * 100 },
  ].filter((z) => z.timeSeconds > 0);
}

// Jack Daniels VDOT-based race time estimates (simplified)
export interface EstimatedRaceTime {
  distance: string;
  distanceMeters: number;
  estimatedTime: number;
  pace: string;
}

export function estimateRaceTimes(activities: StravaActivity[]): EstimatedRaceTime[] {
  const runs = activities
    .filter((a) => a.type === 'Run' && a.distance >= 1000 && a.moving_time > 0)
    .sort((a, b) => new Date(b.start_date_local).getTime() - new Date(a.start_date_local).getTime())
    .slice(0, 20);

  if (runs.length === 0) return [];

  // Use best recent pace (from shortest "race-like" effort) to estimate
  const raceDistances = [
    { name: '5K', meters: 5000 },
    { name: '10K', meters: 10000 },
    { name: 'Half Marathon', meters: 21097.5 },
    { name: 'Marathon', meters: 42195 },
  ];

  // Find best pace from runs (prefer 5-10K range for accuracy)
  const paceRuns = runs.filter((r) => r.distance >= 3000 && r.distance <= 15000);
  const referenceRuns = paceRuns.length > 0 ? paceRuns : runs;
  const bestPaceRun = referenceRuns.reduce((best, r) => {
    const pace = r.moving_time / (r.distance / 1000);
    return pace < best.pace ? { run: r, pace } : best;
  }, { run: referenceRuns[0], pace: referenceRuns[0].moving_time / (referenceRuns[0].distance / 1000) });

  const basePaceSecPerKm = bestPaceRun.pace;

  // Riegel formula: T2 = T1 * (D2/D1)^1.06
  return raceDistances.map(({ name, meters }) => {
    const baseDistance = bestPaceRun.run.distance;
    const baseTime = bestPaceRun.run.moving_time;
    const estimatedSeconds = baseTime * Math.pow(meters / baseDistance, 1.06);
    const paceSecPerKm = estimatedSeconds / (meters / 1000);
    const paceMin = Math.floor(paceSecPerKm / 60);
    const paceSec = Math.floor(paceSecPerKm % 60);
    return {
      distance: name,
      distanceMeters: meters,
      estimatedTime: Math.round(estimatedSeconds),
      pace: `${paceMin}:${paceSec.toString().padStart(2, '0')}/km`,
    };
  });
}

export interface PersonalInsight {
  type: 'positive' | 'neutral' | 'milestone';
  message: string;
  icon: string;
}

export function generatePersonalInsights(
  activities: StravaActivity[],
  timeRange: 'week' | 'month' | 'year'
): PersonalInsight[] {
  const insights: PersonalInsight[] = [];
  const now = new Date();
  let cutoff: Date;

  switch (timeRange) {
    case 'week':
      cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 7);
      break;
    case 'month':
      cutoff = new Date(now);
      cutoff.setMonth(cutoff.getMonth() - 1);
      break;
    case 'year':
      cutoff = new Date(now);
      cutoff.setFullYear(cutoff.getFullYear() - 1);
      break;
    default:
      cutoff = new Date(0);
  }

  const recent = activities.filter((a) => new Date(a.start_date_local) >= cutoff);
  const previousCutoff = new Date(cutoff);
  previousCutoff.setTime(previousCutoff.getTime() - (now.getTime() - cutoff.getTime()));
  const previous = activities.filter(
    (a) => new Date(a.start_date_local) >= previousCutoff && new Date(a.start_date_local) < cutoff
  );

  const recentDistance = recent.reduce((s, a) => s + a.distance, 0);
  const previousDistance = previous.reduce((s, a) => s + a.distance, 0);
  const recentCount = recent.length;
  const previousCount = previous.length;

  if (previousDistance > 0 && recentDistance > 0) {
    const pctChange = ((recentDistance - previousDistance) / previousDistance) * 100;
    if (pctChange >= 15) {
      insights.push({
        type: 'positive',
        message: `You've increased your ${timeRange}ly distance by ${Math.round(pctChange)}% compared to the previous period.`,
        icon: '📈',
      });
    } else if (pctChange <= -20) {
      insights.push({
        type: 'neutral',
        message: `Your ${timeRange}ly distance is down ${Math.round(-pctChange)}% from the previous period. Recovery is important too!`,
        icon: '💪',
      });
    }
  }

  if (recentCount > previousCount && previousCount > 0) {
    insights.push({
      type: 'positive',
      message: `You completed ${recentCount - previousCount} more activities this ${timeRange} than last.`,
      icon: '🎯',
    });
  }

  const runs = recent.filter((a) => a.type === 'Run');
  const totalRunDistance = runs.reduce((s, a) => s + a.distance, 0);
  if (totalRunDistance >= 100000 && timeRange === 'week') {
    insights.push({
      type: 'milestone',
      message: "You hit 100km of running this week! That's a huge week.",
      icon: '🏆',
    });
  }

  const thisMonth = recent.filter((a) => {
    const d = new Date(a.start_date_local);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthDistance = thisMonth.reduce((s, a) => s + a.distance, 0);
  if (monthDistance >= 500000 && timeRange === 'month') {
    insights.push({
      type: 'milestone',
      message: "You've logged over 500km this month! Incredible consistency.",
      icon: '🌟',
    });
  }

  if (insights.length === 0 && recent.length > 0) {
    insights.push({
      type: 'neutral',
      message: `You've been consistent with ${recentCount} activities. Keep it up!`,
      icon: '👍',
    });
  }

  return insights.slice(0, 5);
}
