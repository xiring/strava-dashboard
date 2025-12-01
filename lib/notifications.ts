// Browser notifications utility

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function showNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  new Notification(title, {
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    ...options,
  });
}

export function scheduleGoalReminder(goalName: string, progress: number, target: number) {
  if (progress >= target) {
    showNotification('🎯 Goal Achieved!', {
      body: `Congratulations! You've reached your goal: ${goalName}`,
    });
  } else if (progress >= target * 0.9) {
    showNotification('🎯 Goal Almost There!', {
      body: `You're ${((1 - progress / target) * 100).toFixed(0)}% away from your goal: ${goalName}`,
    });
  }
}

export function scheduleWeeklySummary(totalActivities: number, totalDistance: number) {
  // Only show notification once per week
  const lastNotification = localStorage.getItem('lastWeeklySummary');
  const now = new Date();
  const lastDate = lastNotification ? new Date(lastNotification) : null;
  
  if (!lastDate || (now.getTime() - lastDate.getTime()) > 7 * 24 * 60 * 60 * 1000) {
    showNotification('📊 Weekly Summary', {
      body: `You completed ${totalActivities} activities covering ${(totalDistance / 1000).toFixed(1)} km this week!`,
    });
    localStorage.setItem('lastWeeklySummary', now.toISOString());
  }
}

