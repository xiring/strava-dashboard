import { StravaActivity } from './strava';

export interface TrainingLoadData {
  week: string;
  volume: number; // Total distance in km
  time: number; // Total time in hours
  activities: number;
  intensity: number; // Average intensity score
  stressScore: number; // Estimated training stress
}

export interface RecoveryRecommendation {
  status: 'fresh' | 'ready' | 'tired' | 'overtrained';
  message: string;
  recommendation: string;
  score: number; // 0-100 recovery score (100 = fully recovered)
}

export function calculateTrainingLoad(activities: StravaActivity[], period: 'week' | 'month' = 'week'): TrainingLoadData[] {
  const now = new Date();
  const weeks: Map<string, TrainingLoadData> = new Map();

  activities.forEach((activity) => {
    const date = new Date(activity.start_date_local);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weeks.has(weekKey)) {
      weeks.set(weekKey, {
        week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        volume: 0,
        time: 0,
        activities: 0,
        intensity: 0,
        stressScore: 0,
      });
    }

    const weekData = weeks.get(weekKey)!;
    weekData.volume += activity.distance / 1000; // Convert to km
    weekData.time += activity.moving_time / 3600; // Convert to hours
    weekData.activities += 1;

    // Calculate intensity (based on average speed relative to activity type)
    const intensity = calculateIntensity(activity);
    weekData.intensity = (weekData.intensity * (weekData.activities - 1) + intensity) / weekData.activities;

    // Estimate training stress (simplified TSS-like calculation)
    const stress = (activity.moving_time / 3600) * intensity * 10;
    weekData.stressScore += stress;
  });

  return Array.from(weeks.values())
    .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime())
    .slice(-(period === 'week' ? 4 : 12)); // Last 4 weeks or 12 weeks
}

function calculateIntensity(activity: StravaActivity): number {
  // Simplified intensity calculation
  // For runs: based on pace
  // For rides: based on speed
  // Returns 0-1 scale

  if (activity.type === 'Run' || activity.type === 'Walk' || activity.type === 'Hike') {
    // Pace-based intensity (faster = higher intensity)
    const pace = activity.moving_time / (activity.distance / 1000); // seconds per km
    // Normalize: assume 3:00/km is max intensity, 8:00/km is low intensity
    const minPace = 180; // 3:00/km
    const maxPace = 480; // 8:00/km
    return Math.max(0, Math.min(1, 1 - (pace - minPace) / (maxPace - minPace)));
  } else if (activity.type === 'Ride') {
    // Speed-based intensity
    const speed = activity.average_speed * 3.6; // m/s to km/h
    // Normalize: assume 30 km/h is high intensity, 15 km/h is low
    return Math.max(0, Math.min(1, (speed - 15) / 15));
  }

  return 0.5; // Default moderate intensity
}

export function getRecoveryRecommendation(
  recentLoad: TrainingLoadData[],
  currentWeek: TrainingLoadData
): RecoveryRecommendation {
  if (recentLoad.length === 0) {
    return {
      status: 'fresh',
      message: 'No recent training data',
      recommendation: 'Start with light activities and gradually increase volume.',
      score: 100,
    };
  }

  const avgVolume = recentLoad.reduce((sum, w) => sum + w.volume, 0) / recentLoad.length;
  const avgStress = recentLoad.reduce((sum, w) => sum + w.stressScore, 0) / recentLoad.length;

  const volumeIncrease = avgVolume > 0 ? ((currentWeek.volume - avgVolume) / avgVolume) * 100 : 0;
  const stressIncrease = avgStress > 0 ? ((currentWeek.stressScore - avgStress) / avgStress) * 100 : 0;

  if (currentWeek.stressScore > avgStress * 1.5 || volumeIncrease > 50) {
    return {
      status: 'overtrained',
      message: 'High training load detected',
      recommendation: 'Consider taking a rest day or reducing intensity. Recovery is important for progress.',
      score: 25,
    };
  } else if (currentWeek.stressScore > avgStress * 1.2 || volumeIncrease > 20) {
    return {
      status: 'tired',
      message: 'Elevated training load',
      recommendation: 'Monitor fatigue levels. Consider an easy day or active recovery.',
      score: 50,
    };
  } else if (currentWeek.stressScore < avgStress * 0.8) {
    return {
      status: 'fresh',
      message: 'Low training load',
      recommendation: 'You\'re well recovered. Good time for a challenging workout!',
      score: 95,
    };
  } else {
    return {
      status: 'ready',
      message: 'Balanced training load',
      recommendation: 'Maintain current training volume. You\'re in a good training zone.',
      score: 75,
    };
  }
}

