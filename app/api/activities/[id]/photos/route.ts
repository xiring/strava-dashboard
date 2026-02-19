import { NextRequest, NextResponse } from 'next/server';
import { getValidAccessToken } from '@/lib/auth';
import { stravaClient } from '@/lib/strava';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tokenData = await getValidAccessToken();
    if (!tokenData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const activityId = parseInt(id);
    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'Invalid activity ID' }, { status: 400 });
    }

    stravaClient.setAccessToken(tokenData.accessToken);
    const photos = await stravaClient.getActivityPhotos(activityId);

    return NextResponse.json(photos);
  } catch (error: any) {
    console.error('Error fetching activity photos:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch photos' },
      { status: error.status || 500 }
    );
  }
}
