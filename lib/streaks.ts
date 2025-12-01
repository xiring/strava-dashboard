import { StravaActivity } from './strava';

export interface StreakInfo {
  current: number;
  longest: number;
  currentStartDate: string | null;
  longestStartDate: string | null;
  longestEndDate: string | null;
}

export function calculateStreaks(activities: StravaActivity[]): StreakInfo {
  if (activities.length === 0) {
    return {
      current: 0,
      longest: 0,
      currentStartDate: null,
      longestStartDate: null,
      longestEndDate: null,
    };
  }

  // Get unique activity dates
  const activityDates = new Set<string>();
  activities.forEach((activity) => {
    const date = new Date(activity.start_date_local);
    const dateKey = date.toISOString().split('T')[0];
    activityDates.add(dateKey);
  });

  const sortedDates = Array.from(activityDates).sort().reverse();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = today.toISOString().split('T')[0];

  // Calculate current streak
  let currentStreak = 0;
  let currentStartDate: string | null = null;
  let checkDate = new Date(today);

  // Check if there's an activity today or yesterday (allows for same-day streak)
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().split('T')[0];

  if (activityDates.has(todayKey) || activityDates.has(yesterdayKey)) {
    // Start from today or yesterday
    let dateToCheck = activityDates.has(todayKey) ? today : yesterday;
    let consecutiveDays = 0;

    while (true) {
      const dateKey = dateToCheck.toISOString().split('T')[0];
      if (activityDates.has(dateKey)) {
        consecutiveDays++;
        if (currentStartDate === null) {
          currentStartDate = dateKey;
        }
        dateToCheck.setDate(dateToCheck.getDate() - 1);
      } else {
        break;
      }
    }

    currentStreak = consecutiveDays;
  }

  // Calculate longest streak
  let longestStreak = 0;
  let longestStartDate: string | null = null;
  let longestEndDate: string | null = null;
  let currentStreakCount = 1; // Start at 1 for the first date
  let streakStartDate: string | null = sortedDates[0] || null;

  // Work backwards through sorted dates (newest to oldest)
  for (let i = 1; i < sortedDates.length; i++) {
    const currentDate = new Date(sortedDates[i]);
    const prevDate = new Date(sortedDates[i - 1]);

    const daysDiff = Math.floor(
      (prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 1) {
      // Consecutive day (prevDate is 1 day after currentDate, so they're consecutive)
      currentStreakCount++;
    } else {
      // Streak broken - save current streak if it's the longest
      if (currentStreakCount > longestStreak) {
        longestStreak = currentStreakCount;
        longestStartDate = streakStartDate;
        longestEndDate = sortedDates[i - 1];
      }
      // Start new streak
      currentStreakCount = 1;
      streakStartDate = sortedDates[i];
    }
  }

  // Check if the last streak is the longest
  if (currentStreakCount > longestStreak) {
    longestStreak = currentStreakCount;
    longestStartDate = streakStartDate;
    longestEndDate = sortedDates[sortedDates.length - 1];
  }

  return {
    current: currentStreak,
    longest: longestStreak,
    currentStartDate,
    longestStartDate,
    longestEndDate,
  };
}

