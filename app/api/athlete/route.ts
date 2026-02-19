import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { syncService } from '@/lib/sync';
import { getValidAccessToken } from '@/lib/auth';
import type { StravaAthlete } from '@/lib/strava';

function toStravaAthlete(db: { id: number; username?: string | null; firstname: string; lastname: string; profile?: string | null; profile_medium?: string | null; city?: string | null; state?: string | null; country?: string | null; sex?: string | null; weight?: number | null; follower_count: number; friend_count: number; measurement_preference?: string | null; ftp?: number | null }): StravaAthlete {
  return {
    id: db.id,
    username: db.username ?? '',
    firstname: db.firstname,
    lastname: db.lastname,
    profile: db.profile ?? '',
    profile_medium: db.profile_medium ?? '',
    city: db.city ?? '',
    state: db.state ?? '',
    country: db.country ?? '',
    sex: db.sex ?? '',
    weight: db.weight ?? 0,
    follower_count: db.follower_count,
    friend_count: db.friend_count,
    measurement_preference: db.measurement_preference ?? '',
    ftp: db.ftp ?? undefined,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const forceSync = searchParams.get('force_sync') === 'true';
    const tokenData = await getValidAccessToken();

    // Get athlete from Strava API first to get the ID
    const { stravaClient } = await import('@/lib/strava');
    stravaClient.setAccessToken(tokenData.accessToken);
    
    // Sync athlete first to get the athlete ID
    let athlete: StravaAthlete | null = await syncService.syncAthlete().catch(async () => {
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
    const dbAthlete = await db.getAthlete(athleteId);
    if (dbAthlete && !forceSync) {
      athlete = toStravaAthlete(dbAthlete);
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

