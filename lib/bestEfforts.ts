import { StravaActivity } from './strava';

export interface BestEffort {
  distance: number; // in meters
  time: number; // in seconds
  pace: number; // in seconds per km
  speed: number; // in m/s
  activityId: number;
  activityDate: string;
  activityName: string;
}

// Common distance targets in meters
export const COMMON_DISTANCES = [
  1000, // 1km
  5000, // 5km
  10000, // 10km
  21097.5, // Half marathon
  42195, // Marathon
  50000, // 50km
  100000, // 100km
];

export function detectBestEfforts(activities: StravaActivity[]): Map<number, BestEffort> {
  const bestEfforts = new Map<number, BestEffort>();

  activities.forEach((activity) => {
    // Only process runs and walks for best efforts
    if (activity.type !== 'Run' && activity.type !== 'Walk') {
      return;
    }

    // Check if activity distance matches a common distance (within 2% tolerance)
    COMMON_DISTANCES.forEach((targetDistance) => {
      const tolerance = targetDistance * 0.02; // 2% tolerance
      if (
        Math.abs(activity.distance - targetDistance) <= tolerance &&
        activity.moving_time > 0
      ) {
        const existing = bestEfforts.get(targetDistance);
        const pace = (activity.moving_time / activity.distance) * 1000; // seconds per km
        const speed = activity.average_speed; // m/s

        if (!existing || activity.moving_time < existing.time) {
          bestEfforts.set(targetDistance, {
            distance: targetDistance,
            time: activity.moving_time,
            pace,
            speed,
            activityId: activity.id,
            activityDate: activity.start_date_local,
            activityName: activity.name,
          });
        }
      }
    });

    // Also check splits for best efforts at common distances
    if (activity.splits_metric) {
      activity.splits_metric.forEach((split: any, index: number) => {
        const splitDistance = (index + 1) * 1000; // Each split is 1km
        if (COMMON_DISTANCES.includes(splitDistance) && split.elapsed_time > 0) {
          const existing = bestEfforts.get(splitDistance);
          const pace = split.elapsed_time; // Already in seconds per km
          const speed = (splitDistance / split.elapsed_time) * 1000; // m/s

          if (!existing || split.elapsed_time < existing.time) {
            bestEfforts.set(splitDistance, {
              distance: splitDistance,
              time: split.elapsed_time,
              pace,
              speed,
              activityId: activity.id,
              activityDate: activity.start_date_local,
              activityName: activity.name,
            });
          }
        }
      });
    }
  });

  return bestEfforts;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  } else if (meters < 10000) {
    return `${(meters / 1000).toFixed(1)}km`;
  } else if (meters === 21097.5) {
    return 'Half Marathon';
  } else if (meters === 42195) {
    return 'Marathon';
  } else {
    return `${(meters / 1000).toFixed(0)}km`;
  }
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

