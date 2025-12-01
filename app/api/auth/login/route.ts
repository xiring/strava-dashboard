import { NextRequest, NextResponse } from 'next/server';
import { getStravaAuthUrl } from '@/lib/strava';

export async function GET(request: NextRequest) {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = process.env.STRAVA_REDIRECT_URI || `${request.nextUrl.origin}/api/auth/callback`;

  if (!clientId) {
    return NextResponse.json(
      { error: 'STRAVA_CLIENT_ID not configured' },
      { status: 500 }
    );
  }

  const authUrl = getStravaAuthUrl(clientId, redirectUri);
  return NextResponse.redirect(authUrl);
}

