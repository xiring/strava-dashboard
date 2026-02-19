import { PrismaClient } from '@prisma/client';
import { StravaActivity, StravaAthlete, StravaStats } from './strava';

// Prisma Client singleton pattern for Next.js
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Database service functions
export class DatabaseService {
  // Athlete operations
  async upsertAthlete(athlete: StravaAthlete) {
    return await prisma.athlete.upsert({
      where: { id: athlete.id },
      update: {
        username: athlete.username,
        firstname: athlete.firstname,
        lastname: athlete.lastname,
        profile: athlete.profile,
        profile_medium: athlete.profile_medium,
        city: athlete.city,
        state: athlete.state,
        country: athlete.country,
        sex: athlete.sex,
        weight: athlete.weight,
        follower_count: athlete.follower_count,
        friend_count: athlete.friend_count,
        measurement_preference: athlete.measurement_preference,
        ftp: athlete.ftp,
        updated_at: new Date(),
      },
      create: {
        id: athlete.id,
        username: athlete.username,
        firstname: athlete.firstname,
        lastname: athlete.lastname,
        profile: athlete.profile,
        profile_medium: athlete.profile_medium,
        city: athlete.city,
        state: athlete.state,
        country: athlete.country,
        sex: athlete.sex,
        weight: athlete.weight,
        follower_count: athlete.follower_count,
        friend_count: athlete.friend_count,
        measurement_preference: athlete.measurement_preference,
        ftp: athlete.ftp,
      },
    });
  }

  async getAthlete(id: number) {
    return await prisma.athlete.findUnique({
      where: { id },
    });
  }

  private safeStringify(val: unknown): string | null {
    if (val == null) return null;
    try {
      const s = JSON.stringify(val);
      return s && s !== 'undefined' ? s : null;
    } catch {
      return null;
    }
  }

  // Activity operations - Prisma requires null (not undefined) and valid types
  private toPrismaActivity(activity: StravaActivity) {
    const num = (v: number | string | undefined): number =>
      v === undefined || v === null ? 0 : typeof v === 'string' ? parseFloat(v) || 0 : Number(v);
    const optNum = (v: number | string | undefined): number | null => {
      if (v === undefined || v === null) return null;
      const n = typeof v === 'string' ? parseFloat(v) : Number(v);
      return Number.isFinite(n) ? n : null;
    };
    // For optional fields: use null when 0 (avoids Prisma edge cases with zero)
    const optNumOrNull = (v: number | string | undefined): number | null => {
      const n = optNum(v);
      return n === 0 ? null : n;
    };
    const int = (v: number | string | undefined): number =>
      v === undefined || v === null ? 0 : Math.floor(Number(v)) || 0;

    return {
      name: String(activity.name ?? ''),
      distance: num(activity.distance),
      moving_time: int(activity.moving_time),
      elapsed_time: int(activity.elapsed_time),
      total_elevation_gain: num(activity.total_elevation_gain),
      type: String(activity.type ?? 'Workout'),
      commute: Boolean((activity as any).commute),
      start_date: String(activity.start_date ?? ''),
      start_date_local: String(activity.start_date_local ?? ''),
      timezone: activity.timezone ? String(activity.timezone) : null,
      average_speed: num(activity.average_speed),
      max_speed: optNumOrNull(activity.max_speed),
      average_cadence: optNum(activity.average_cadence),
      average_heartrate: optNum(activity.average_heartrate),
      max_heartrate: optNum(activity.max_heartrate),
      elev_high: optNumOrNull(activity.elev_high),
      elev_low: optNumOrNull(activity.elev_low),
      calories: activity.calories != null ? int(activity.calories) : null,
      achievement_count: int(activity.achievement_count),
      kudos_count: int(activity.kudos_count),
      comment_count: int(activity.comment_count),
      athlete_count: int(activity.athlete_count),
      summary_polyline: activity.map?.summary_polyline ? String(activity.map.summary_polyline) : null,
      polyline: activity.map?.polyline ? String(activity.map.polyline) : null,
      splits_metric: this.safeStringify(activity.splits_metric),
      splits_standard: this.safeStringify(activity.splits_standard),
      segment_efforts: this.safeStringify((activity as any).segment_efforts),
    };
  }

  private stripUndefined<T extends Record<string, unknown>>(obj: T): T {
    return Object.fromEntries(
      Object.entries(obj).filter(([, v]) => v !== undefined)
    ) as T;
  }

  async upsertActivity(activity: StravaActivity) {
    const activityId = activity.id.toString();
    const data = this.stripUndefined(this.toPrismaActivity(activity) as Record<string, unknown>);
    const updateData = this.stripUndefined({ ...data, synced_at: new Date() });
    const createData = { id: activityId, ...data };

    try {
      return await prisma.activity.update({
        where: { id: activityId },
        data: updateData,
      });
    } catch (e: any) {
      if (e.code === 'P2025') {
        return await prisma.activity.create({ data: createData as any });
      }
      throw e;
    }
  }

  async getActivity(id: number | bigint | string) {
    // Convert to string for Prisma
    const activityId = typeof id === 'string' ? id : id.toString();
    const activity = await prisma.activity.findUnique({
      where: { id: activityId } as any,
    });
    if (!activity) return null;
    return this.mapActivityToStravaFormat(activity);
  }

  async getActivities(limit: number = 30, offset: number = 0, type?: string) {
    const where = type && type !== 'All' ? { type } : {};
    const activities = await prisma.activity.findMany({
      where,
      orderBy: { start_date: 'desc' },
      take: limit,
      skip: offset,
    });
    return activities.map((a: any) => this.mapActivityToStravaFormat(a));
  }

  async getActivitiesCount(type?: string) {
    const where = type && type !== 'All' ? { type } : {};
    return await prisma.activity.count({ where });
  }

  async getActivityNeighbors(activityId: string): Promise<{ prev: number | null; next: number | null }> {
    const current = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { start_date: true },
    });
    if (!current) return { prev: null, next: null };

    const [prevAct, nextAct] = await Promise.all([
      prisma.activity.findFirst({
        where: { start_date: { lt: current.start_date } },
        orderBy: { start_date: 'desc' },
        select: { id: true },
      }),
      prisma.activity.findFirst({
        where: { start_date: { gt: current.start_date } },
        orderBy: { start_date: 'asc' },
        select: { id: true },
      }),
    ]);
    return {
      prev: prevAct?.id != null ? parseInt(prevAct.id, 10) : null,
      next: nextAct?.id != null ? parseInt(nextAct.id, 10) : null,
    };
  }

  async getLatestActivityDate() {
    const latest = await prisma.activity.findFirst({
      orderBy: { start_date: 'desc' },
      select: { start_date: true },
    });
    return latest?.start_date || null;
  }

  // Stats operations
  async upsertAthleteStats(athleteId: number, stats: StravaStats) {
    return await prisma.athleteStats.upsert({
      where: { id: 1 },
      update: {
        athlete_id: athleteId,
        biggest_ride_distance: stats.biggest_ride_distance,
        biggest_climb_elevation_gain: stats.biggest_climb_elevation_gain,
        recent_ride_totals: JSON.stringify(stats.recent_ride_totals),
        all_ride_totals: JSON.stringify(stats.all_ride_totals),
        recent_run_totals: JSON.stringify(stats.recent_run_totals),
        all_run_totals: JSON.stringify(stats.all_run_totals),
        recent_swim_totals: '{}', // Not in StravaStats interface
        all_swim_totals: '{}', // Not in StravaStats interface
        ytd_ride_totals: '{}', // Not in StravaStats interface
        ytd_run_totals: '{}', // Not in StravaStats interface
        ytd_swim_totals: '{}', // Not in StravaStats interface
        updated_at: new Date(),
      },
      create: {
        id: 1,
        athlete_id: athleteId,
        biggest_ride_distance: stats.biggest_ride_distance,
        biggest_climb_elevation_gain: stats.biggest_climb_elevation_gain,
        recent_ride_totals: JSON.stringify(stats.recent_ride_totals),
        all_ride_totals: JSON.stringify(stats.all_ride_totals),
        recent_run_totals: JSON.stringify(stats.recent_run_totals),
        all_run_totals: JSON.stringify(stats.all_run_totals),
        recent_swim_totals: '{}', // Not in StravaStats interface
        all_swim_totals: '{}', // Not in StravaStats interface
        ytd_ride_totals: '{}', // Not in StravaStats interface
        ytd_run_totals: '{}', // Not in StravaStats interface
        ytd_swim_totals: '{}', // Not in StravaStats interface
      },
    });
  }

  async getAthleteStats() {
    const stats = await prisma.athleteStats.findUnique({
      where: { id: 1 },
    });
    if (!stats) return null;
    return {
      biggest_ride_distance: stats.biggest_ride_distance,
      biggest_climb_elevation_gain: stats.biggest_climb_elevation_gain,
      recent_ride_totals: JSON.parse(stats.recent_ride_totals),
      all_ride_totals: JSON.parse(stats.all_ride_totals),
      recent_run_totals: JSON.parse(stats.recent_run_totals),
      all_run_totals: JSON.parse(stats.all_run_totals),
    } as StravaStats;
  }

  // Sync log operations
  async createSyncLog(syncType: string, status: string, itemsSynced: number = 0, errorMessage?: string) {
    return await prisma.syncLog.create({
      data: {
        sync_type: syncType,
        status,
        items_synced: itemsSynced,
        error_message: errorMessage || null,
      },
    });
  }

  // Helper to map database activity to Strava format
  private mapActivityToStravaFormat(activity: {
    id: string;
    name: string;
    distance: number;
    moving_time: number;
    elapsed_time: number;
    total_elevation_gain: number;
    type: string;
    commute: boolean;
    start_date: string;
    start_date_local: string;
    timezone: string | null;
    average_speed: number;
    max_speed: number | null;
    average_cadence: number | null;
    average_heartrate: number | null;
    max_heartrate: number | null;
    elev_high: number | null;
    elev_low: number | null;
    calories: number | null;
    achievement_count: number;
    kudos_count: number;
    comment_count: number;
    athlete_count: number;
    summary_polyline: string | null;
    polyline: string | null;
    splits_metric: string | null;
    splits_standard: string | null;
    segment_efforts: string | null;
  }): StravaActivity {
    return {
      id: typeof activity.id === 'string' ? parseInt(activity.id) : Number(activity.id),
      name: activity.name,
      distance: activity.distance,
      moving_time: activity.moving_time,
      elapsed_time: activity.elapsed_time,
      total_elevation_gain: activity.total_elevation_gain,
      type: activity.type,
      commute: activity.commute ?? false,
      start_date: activity.start_date,
      start_date_local: activity.start_date_local,
      timezone: activity.timezone || '',
      average_speed: activity.average_speed,
      max_speed: activity.max_speed || 0,
      average_cadence: activity.average_cadence ? activity.average_cadence : undefined,
      average_heartrate: activity.average_heartrate ? activity.average_heartrate : undefined,
      max_heartrate: activity.max_heartrate ? activity.max_heartrate : undefined,
      elev_high: activity.elev_high ? activity.elev_high : undefined,
      elev_low: activity.elev_low ? activity.elev_low : undefined,
      calories: activity.calories ? activity.calories : undefined,
      achievement_count: activity.achievement_count,
      kudos_count: activity.kudos_count,
      comment_count: activity.comment_count,
      athlete_count: activity.athlete_count,
      map: {
        id: activity.id.toString(),
        summary_polyline: (activity.summary_polyline || '') as string,
        polyline: (activity.polyline || '') as string,
      },
      splits_metric: activity.splits_metric ? JSON.parse(activity.splits_metric) : undefined,
      splits_standard: activity.splits_standard ? JSON.parse(activity.splits_standard) : undefined,
      segment_efforts: activity.segment_efforts ? JSON.parse(activity.segment_efforts) : undefined,
    };
  }
}

export const db = new DatabaseService();

