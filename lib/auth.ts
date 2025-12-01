import { cookies } from 'next/headers';
import { refreshAccessToken } from './strava';

export interface TokenData {
  accessToken: string;
  needsRefresh: boolean;
  newTokenData?: {
    access_token: string;
    expires_at: number;
    expires_in: number;
  };
}

export async function getValidAccessToken(): Promise<TokenData> {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get('strava_access_token')?.value;
  const refreshToken = cookieStore.get('strava_refresh_token')?.value;
  const expiresAt = cookieStore.get('strava_expires_at')?.value;

  // Check if token is expired or about to expire (within 5 minutes)
  if (expiresAt && parseInt(expiresAt) * 1000 < Date.now() + 5 * 60 * 1000) {
    if (refreshToken) {
      const clientId = process.env.STRAVA_CLIENT_ID;
      const clientSecret = process.env.STRAVA_CLIENT_SECRET;

      if (clientId && clientSecret) {
        try {
          const tokenData = await refreshAccessToken(refreshToken, clientId, clientSecret);
          
          // Update cookies immediately
          cookieStore.set('strava_access_token', tokenData.access_token, {
            maxAge: tokenData.expires_in,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
          });
          cookieStore.set('strava_expires_at', tokenData.expires_at.toString(), {
            maxAge: 60 * 60 * 24 * 365,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
          });
          
          return {
            accessToken: tokenData.access_token,
            needsRefresh: true,
            newTokenData: {
              access_token: tokenData.access_token,
              expires_at: tokenData.expires_at,
              expires_in: tokenData.expires_in,
            },
          };
        } catch (error) {
          console.error('Token refresh failed:', error);
          throw new Error('Failed to refresh token');
        }
      }
    }
  }

  if (!accessToken) {
    throw new Error('No access token available');
  }

  return {
    accessToken,
    needsRefresh: false,
  };
}


