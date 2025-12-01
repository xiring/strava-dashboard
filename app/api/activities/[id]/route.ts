import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { syncService } from '@/lib/sync';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const forceSync = searchParams.get('force_sync') === 'true';

    const activityId = parseInt(id);
    if (isNaN(activityId)) {
      return NextResponse.json(
        { error: 'Invalid activity ID' },
        { status: 400 }
      );
    }

    // Try to get from database first
    let activity = await db.getActivity(activityId);

    // If not in DB or force sync, sync from Strava
    if (!activity || forceSync) {
      try {
        activity = await syncService.syncActivity(activityId);
      } catch (syncError: any) {
        // If sync fails but we have data in DB, return that
        if (activity) {
          console.warn('Sync failed, returning cached data:', syncError);
        } else {
          throw syncError;
        }
      }
    }

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(activity);
  } catch (error: any) {
    console.error('Error fetching activity:', error);
    
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
      { error: error.message || 'Failed to fetch activity' },
      { status: error.status || (error.message?.includes('404') ? 404 : 401) }
    );
  }
}

