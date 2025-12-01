import { detectBestEfforts } from '@/lib/bestEfforts';
import { StravaActivity } from '@/lib/strava';

describe('detectBestEfforts', () => {
  const createRunActivity = (distance: number, time: number): StravaActivity => ({
    id: Date.now() + Math.random(),
    name: 'Test Run',
    distance,
    moving_time: time,
    elapsed_time: time,
    total_elevation_gain: 0,
    type: 'Run',
    start_date: new Date().toISOString(),
    start_date_local: new Date().toISOString(),
    timezone: 'UTC',
    average_speed: distance / time,
    max_speed: distance / time * 1.2,
    achievement_count: 0,
    kudos_count: 0,
    comment_count: 0,
    athlete_count: 1,
    map: {
      id: '1',
      summary_polyline: '',
      polyline: '',
    },
  });

  it('should find best effort for 1km', () => {
    const activities = [
      createRunActivity(1000, 240), // 4:00 min/km
      createRunActivity(1000, 300), // 5:00 min/km
      createRunActivity(1000, 360), // 6:00 min/km
    ];

    const bestEffortsMap = detectBestEfforts(activities);
    const oneKm = bestEffortsMap.get(1000);

    expect(oneKm).toBeDefined();
    expect(oneKm?.time).toBe(240);
  });

  it('should find best effort for 5km', () => {
    const activities = [
      createRunActivity(5000, 1200), // 4:00 min/km
      createRunActivity(5000, 1500), // 5:00 min/km
    ];

    const bestEffortsMap = detectBestEfforts(activities);
    const fiveKm = bestEffortsMap.get(5000);

    expect(fiveKm).toBeDefined();
    expect(fiveKm?.time).toBe(1200);
  });

  it('should return empty map for no activities', () => {
    const bestEffortsMap = detectBestEfforts([]);
    expect(bestEffortsMap.size).toBe(0);
  });

  it('should handle activities shorter than target distance', () => {
    const activities = [
      createRunActivity(500, 120), // 0.5km
    ];

    const bestEffortsMap = detectBestEfforts(activities);
    const oneKm = bestEffortsMap.get(1000);
    expect(oneKm).toBeUndefined();
  });
});

