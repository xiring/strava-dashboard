import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { syncService } from '@/lib/sync';
import { getValidAccessToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const forceSync = searchParams.get('force_sync') === 'true';
    const tokenData = await getValidAccessToken();

    // Get athlete from Strava API first to get the ID
    const { stravaClient } = await import('@/lib/strava');
    stravaClient.setAccessToken(tokenData.accessToken);
    
    // Sync athlete first to get the athlete ID
    let athlete = await syncService.syncAthlete().catch(async () => {
      // If sync fails, get directly from API
      return await stravaClient.getAthlete();
    });
    
    if (!athlete) {
      return NextResponse.json(
        { error: 'Failed to fetch athlete data' },
        { status: 401 }
      );
    }
    
    const athleteId = athlete.id;

    // Try to get from database
    let dbAthlete = await db.getAthlete(athleteId);
    if (dbAthlete && !forceSync) {
      athlete = dbAthlete;
    }

    // Get stats
    let stats = await db.getAthleteStats();
    if (!stats || forceSync) {
      try {
        stats = await syncService.syncAthleteStats(athleteId);
      } catch (syncError: any) {
        console.warn('Sync stats failed, getting from API:', syncError);
        stats = await stravaClient.getAthleteStats(athleteId);
      }
    }

    if (!athlete || !stats) {
      return NextResponse.json(
        { error: 'Athlete data not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ athlete, stats });
  } catch (error: any) {
    console.error('Error fetching athlete:', error);
    
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
      { error: error.message || 'Failed to fetch athlete' },
      { status: error.status || 401 }
    );
  }
}

