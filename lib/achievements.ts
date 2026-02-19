import { StravaActivity } from './strava';
import { calculateStreaks } from './streaks';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'distance' | 'streak' | 'milestone' | 'variety' | 'elevation' | 'speed';
  check: (activities: StravaActivity[], stats?: AchievementStats) => boolean;
  progress?: (activities: StravaActivity[], stats?: AchievementStats) => { current: number; target: number };
}

export interface AchievementStats {
  totalDistance: number;
  totalElevation: number;
  totalActivities: number;
  runCount: number;
  rideCount: number;
  longestStreak: number;
}

function computeStats(activities: StravaActivity[]): AchievementStats {
  const runs = activities.filter((a) => a.type === 'Run');
  const rides = activities.filter((a) => a.type === 'Ride');
  const streakInfo = calculateStreaks(activities);
  return {
    totalDistance: activities.reduce((sum, a) => sum + a.distance, 0) / 1000,
    totalElevation: activities.reduce((sum, a) => sum + a.total_elevation_gain, 0),
    totalActivities: activities.length,
    runCount: runs.length,
    rideCount: rides.length,
    longestStreak: streakInfo.longest,
  };
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-run',
    name: 'First Steps',
    description: 'Complete your first run',
    icon: '🏃',
    category: 'milestone',
    check: (activities) => activities.some((a) => a.type === 'Run'),
  },
  {
    id: 'first-ride',
    name: 'Wheels Rolling',
    description: 'Complete your first ride',
    icon: '🚴',
    category: 'milestone',
    check: (activities) => activities.some((a) => a.type === 'Ride'),
  },
  {
    id: '10-activities',
    name: 'Getting Started',
    description: 'Log 10 activities',
    icon: '📊',
    category: 'milestone',
    check: (activities) => activities.length >= 10,
    progress: (activities) => ({ current: activities.length, target: 10 }),
  },
  {
    id: '50-activities',
    name: 'Dedicated',
    description: 'Log 50 activities',
    icon: '💪',
    category: 'milestone',
    check: (activities) => activities.length >= 50,
    progress: (activities) => ({ current: activities.length, target: 50 }),
  },
  {
    id: '100-activities',
    name: 'Century Club',
    description: 'Log 100 activities',
    icon: '🏅',
    category: 'milestone',
    check: (activities) => activities.length >= 100,
    progress: (activities) => ({ current: activities.length, target: 100 }),
  },
  {
    id: '100km-total',
    name: '100 km Club',
    description: 'Run or ride 100 km total',
    icon: '🛣️',
    category: 'distance',
    check: (activities, stats) => (stats?.totalDistance ?? 0) >= 100,
    progress: (activities, stats) => {
      const s = stats ?? computeStats(activities);
      return { current: Math.round(s.totalDistance), target: 100 };
    },
  },
  {
    id: '500km-total',
    name: '500 km Explorer',
    description: 'Run or ride 500 km total',
    icon: '🗺️',
    category: 'distance',
    check: (activities, stats) => (stats?.totalDistance ?? 0) >= 500,
    progress: (activities, stats) => {
      const s = stats ?? computeStats(activities);
      return { current: Math.round(s.totalDistance), target: 500 };
    },
  },
  {
    id: '1000km-total',
    name: '1000 km Legend',
    description: 'Run or ride 1000 km total',
    icon: '🌟',
    category: 'distance',
    check: (activities, stats) => (stats?.totalDistance ?? 0) >= 1000,
    progress: (activities, stats) => {
      const s = stats ?? computeStats(activities);
      return { current: Math.round(s.totalDistance), target: 1000 };
    },
  },
  {
    id: '7-day-streak',
    name: 'Week Warrior',
    description: '7-day activity streak',
    icon: '🔥',
    category: 'streak',
    check: (activities, stats) => (stats?.longestStreak ?? 0) >= 7,
    progress: (activities, stats) => {
      const s = stats ?? computeStats(activities);
      return { current: s.longestStreak, target: 7 };
    },
  },
  {
    id: '14-day-streak',
    name: 'Two Week Champion',
    description: '14-day activity streak',
    icon: '⚡',
    category: 'streak',
    check: (activities, stats) => (stats?.longestStreak ?? 0) >= 14,
    progress: (activities, stats) => {
      const s = stats ?? computeStats(activities);
      return { current: s.longestStreak, target: 14 };
    },
  },
  {
    id: 'half-marathon',
    name: 'Half Marathon',
    description: 'Complete a half marathon (21.1 km)',
    icon: '🏁',
    category: 'distance',
    check: (activities) =>
      activities.some((a) => a.type === 'Run' && a.distance >= 21000),
  },
  {
    id: 'marathon',
    name: 'Marathon Finisher',
    description: 'Complete a marathon (42.2 km)',
    icon: '🎖️',
    category: 'distance',
    check: (activities) =>
      activities.some((a) => a.type === 'Run' && a.distance >= 42195),
  },
  {
    id: 'century-ride',
    name: 'Century Ride',
    description: 'Complete a 100 km ride',
    icon: '🚵',
    category: 'distance',
    check: (activities) =>
      activities.some((a) => a.type === 'Ride' && a.distance >= 100000),
  },
  {
    id: '1000m-elevation',
    name: 'Mountain Goat',
    description: 'Climb 1000 m in a single activity',
    icon: '⛰️',
    category: 'elevation',
    check: (activities) =>
      activities.some((a) => a.total_elevation_gain >= 1000),
  },
  {
    id: '10k-elevation-total',
    name: 'Elevation Master',
    description: 'Climb 10,000 m total',
    icon: '🏔️',
    category: 'elevation',
    check: (activities, stats) => (stats?.totalElevation ?? 0) >= 10000,
    progress: (activities, stats) => {
      const s = stats ?? computeStats(activities);
      return { current: Math.round(s.totalElevation), target: 10000 };
    },
  },
  {
    id: 'variety',
    name: 'Multi-Sport',
    description: 'Log runs, rides, and one other activity type',
    icon: '🎯',
    category: 'variety',
    check: (activities) => {
      const types = new Set(activities.map((a) => a.type));
      return types.has('Run') && types.has('Ride') && types.size >= 3;
    },
  },
];

export function getUnlockedAchievements(
  activities: StravaActivity[]
): Achievement[] {
  const stats = computeStats(activities);
  return ACHIEVEMENTS.filter((a) => a.check(activities, stats));
}

export function getAchievementProgress(
  achievement: Achievement,
  activities: StravaActivity[]
): { current: number; target: number } | null {
  if (!achievement.progress) return null;
  const stats = computeStats(activities);
  return achievement.progress(activities, stats);
}
