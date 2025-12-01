import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/strava';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/?error=no_code', request.url)
    );
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const redirectUri = process.env.STRAVA_REDIRECT_URI || `${request.nextUrl.origin}/api/auth/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL('/?error=missing_config', request.url)
    );
  }

  try {
    const tokenData = await exchangeCodeForToken(code, clientId, clientSecret);

    // Store tokens in cookies (in production, use httpOnly cookies and encrypt)
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set('strava_access_token', tokenData.access_token, {
      maxAge: tokenData.expires_in,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    response.cookies.set('strava_refresh_token', tokenData.refresh_token, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    response.cookies.set('strava_expires_at', tokenData.expires_at.toString(), {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('Token exchange error:', error);
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error.message || 'token_exchange_failed')}`, request.url)
    );
  }
}

