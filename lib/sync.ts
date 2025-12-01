import { stravaClient } from './strava';
import { db } from './db';
import { getValidAccessToken } from './auth';
import { StravaActivity, StravaAthlete, StravaStats } from './strava';

export class SyncService {
  async syncAthlete(): Promise<StravaAthlete | null> {
    try {
      const tokenData = await getValidAccessToken();
      stravaClient.setAccessToken(tokenData.accessToken);

      const athlete = await stravaClient.getAthlete();
      await db.upsertAthlete(athlete);
      await db.createSyncLog('athlete', 'success', 1);
      return athlete;
    } catch (error: any) {
      console.error('Error syncing athlete:', error);
      await db.createSyncLog('athlete', 'error', 0, error.message);
      throw error;
    }
  }

  async syncActivities(limit: number = 200, force: boolean = false): Promise<number> {
    try {
      const tokenData = await getValidAccessToken();
      stravaClient.setAccessToken(tokenData.accessToken);

      // Check if we need to sync (if data is older than 5 minutes or force)
      if (!force && limit !== 0) {
        const latestDate = await db.getLatestActivityDate();
        if (latestDate) {
          const latest = new Date(latestDate);
          const now = new Date();
          const diffMinutes = (now.getTime() - latest.getTime()) / (1000 * 60);
          if (diffMinutes < 5) {
            console.log('Activities are recent, skipping sync');
            return 0;
          }
        }
      }

      let synced = 0;
      let page = 1;
      const perPage = 30; // Strava API limit
      let hasMore = true;
      const syncAll = limit === 0; // 0 means sync all

      console.log(`Starting sync: ${syncAll ? 'ALL activities' : `up to ${limit} activities`}`);

      while (hasMore && (syncAll || synced < limit)) {
        const activities = await stravaClient.getActivities(perPage, page, false); // Don't use cache for sync
        
        if (activities.length === 0) {
          hasMore = false;
          break;
        }

        // Upsert each activity
        for (const activity of activities) {
          await db.upsertActivity(activity);
          synced++;
          
          // Log progress every 50 activities
          if (synced % 50 === 0) {
            console.log(`Synced ${synced} activities...`);
          }
        }

        // If we got fewer activities than requested, we've reached the end
        if (activities.length < perPage) {
          hasMore = false;
        }

        page++;
        
        // Add a small delay to avoid rate limits
        if (page % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`Sync complete: ${synced} activities synced`);
      await db.createSyncLog('activities', 'success', synced);
      return synced;
    } catch (error: any) {
      console.error('Error syncing activities:', error);
      await db.createSyncLog('activities', 'error', 0, error.message);
      throw error;
    }
  }

  async syncActivity(id: number): Promise<StravaActivity | null> {
    try {
      const tokenData = await getValidAccessToken();
      stravaClient.setAccessToken(tokenData.accessToken);

      const activity = await stravaClient.getActivity(id, false); // Don't use cache for sync
      await db.upsertActivity(activity);
      return activity;
    } catch (error: any) {
      console.error(`Error syncing activity ${id}:`, error);
      throw error;
    }
  }

  async syncAthleteStats(athleteId: number): Promise<StravaStats | null> {
    try {
      const tokenData = await getValidAccessToken();
      stravaClient.setAccessToken(tokenData.accessToken);

      const stats = await stravaClient.getAthleteStats(athleteId, false); // Don't use cache for sync
      await db.upsertAthleteStats(athleteId, stats);
      await db.createSyncLog('stats', 'success', 1);
      return stats;
    } catch (error: any) {
      console.error('Error syncing athlete stats:', error);
      await db.createSyncLog('stats', 'error', 0, error.message);
      throw error;
    }
  }

  async syncAll(athleteId: number, force: boolean = false, syncAllActivities: boolean = false): Promise<{
    athlete: StravaAthlete | null;
    activities: number;
    stats: StravaStats | null;
  }> {
    try {
      // Sync athlete first
      const athlete = await this.syncAthlete().catch(() => null);
      
      // Sync activities (all if syncAllActivities is true, otherwise 200)
      const activitiesCount = await this.syncActivities(syncAllActivities ? 0 : 200, force).catch(() => 0);
      
      // Sync stats
      const stats = await this.syncAthleteStats(athleteId).catch(() => null);

      return {
        athlete,
        activities: activitiesCount,
        stats,
      };
    } catch (error: any) {
      console.error('Error syncing all:', error);
      throw error;
    }
  }
}

export const syncService = new SyncService();

