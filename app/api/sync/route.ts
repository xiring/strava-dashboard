import { NextRequest, NextResponse } from 'next/server';
import { syncService } from '@/lib/sync';
import { getValidAccessToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const tokenData = await getValidAccessToken();
    const body = await request.json().catch(() => ({}));
    const { type, force, syncAll } = body;

    // Get athlete ID first
    const { stravaClient } = await import('@/lib/strava');
    stravaClient.setAccessToken(tokenData.accessToken);
    const athlete = await stravaClient.getAthlete();
    const athleteId = athlete.id;

    let result: any = {};

    switch (type) {
      case 'athlete':
        result.athlete = await syncService.syncAthlete();
        break;
      case 'activities':
        // If syncAll is true, pass 0 to sync all activities (no limit)
        result.activities = await syncService.syncActivities(syncAll ? 0 : 200, force || false);
        break;
      case 'stats':
        result.stats = await syncService.syncAthleteStats(athleteId);
        break;
      case 'all':
        result = await syncService.syncAll(athleteId, force || false, syncAll || false);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid sync type. Use: athlete, activities, stats, or all' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error syncing:', error);
    
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
      { error: error.message || 'Failed to sync' },
      { status: error.status || 500 }
    );
  }
}

