import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { syncService } from '@/lib/sync';
import { getValidAccessToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const perPage = parseInt(searchParams.get('per_page') || '30');
    const page = parseInt(searchParams.get('page') || '1');
    const forceSync = searchParams.get('force_sync') === 'true';
    const offset = (page - 1) * perPage;

    // Try to get from database first
    let activities = await db.getActivities(perPage, offset);

    // If no activities in DB or force sync, sync from Strava
    if (activities.length === 0 || forceSync) {
      try {
        await syncService.syncActivities(200, forceSync);
        // Fetch again from DB after sync
        activities = await db.getActivities(perPage, offset);
      } catch (syncError: any) {
        // If sync fails but we have data in DB, return that
        if (activities.length > 0) {
          console.warn('Sync failed, returning cached data:', syncError);
        } else {
          throw syncError;
        }
      }
    }

    return NextResponse.json(activities);
  } catch (error: any) {
    console.error('Error fetching activities:', error);
    
    // Handle rate limit errors
    if (error.isRateLimit || error.status === 429) {
      return NextResponse.json(
        { 
          error: 'Rate Limit Exceeded',
          message: 'You have exceeded the Strava API rate limit. Please try again later.',
          rateLimitLimit: error.rateLimitLimit,
          rateLimitUsage: error.rateLimitUsage,
          retryAfter: error.retryAfter,
          isRateLimit: true
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch activities' },
      { status: error.status || 401 }
    );
  }
}

