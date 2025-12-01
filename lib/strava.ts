import axios from 'axios';
import { apiCache, getCacheKey } from './cache';
import { requestQueue } from './requestQueue';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

export interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  athlete: {
    id: number;
    username: string;
    firstname: string;
    lastname: string;
    profile: string;
  };
}

export interface StravaSplit {
  distance: number;
  elapsed_time: number;
  elevation_difference: number;
  moving_time: number;
  split: number;
  average_speed: number;
  pace_zone: number;
}

export interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  start_date: string;
  start_date_local: string;
  timezone: string;
  average_speed: number;
  max_speed: number;
  average_cadence?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  elev_high?: number;
  elev_low?: number;
  calories?: number;
  achievement_count: number;
  kudos_count: number;
  comment_count: number;
  athlete_count: number;
  map: {
    id: string;
    summary_polyline: string;
    polyline: string;
  };
  splits_metric?: StravaSplit[];
  splits_standard?: StravaSplit[];
}

export interface StravaAthlete {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  profile: string;
  profile_medium: string;
  city: string;
  state: string;
  country: string;
  sex: string;
  weight: number;
  follower_count: number;
  friend_count: number;
  measurement_preference: string;
  ftp?: number;
}

export interface StravaStats {
  biggest_ride_distance: number;
  biggest_climb_elevation_gain: number;
  recent_ride_totals: {
    count: number;
    distance: number;
    moving_time: number;
    elapsed_time: number;
    elevation_gain: number;
  };
  all_ride_totals: {
    count: number;
    distance: number;
    moving_time: number;
    elapsed_time: number;
    elevation_gain: number;
  };
  recent_run_totals: {
    count: number;
    distance: number;
    moving_time: number;
    elapsed_time: number;
    elevation_gain: number;
  };
  all_run_totals: {
    count: number;
    distance: number;
    moving_time: number;
    elapsed_time: number;
    elevation_gain: number;
  };
}

class StravaClient {
  private accessToken: string | null = null;

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  private async request(endpoint: string, options: RequestInit = {}, priority: number = 0) {
    if (!this.accessToken) {
      throw new Error('Access token not set');
    }

    // Use request queue to manage rate limits
    return requestQueue.add(
      endpoint,
      async () => {
        const response = await fetch(`${STRAVA_API_BASE}${endpoint}`, {
          ...options,
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        if (!response.ok) {
          // Handle rate limiting
          if (response.status === 429) {
            const rateLimitLimit = response.headers.get('X-RateLimit-Limit');
            const rateLimitUsage = response.headers.get('X-RateLimit-Usage');
            const retryAfter = response.headers.get('Retry-After');
            
            const error: any = await response.json().catch(() => ({ message: 'Rate Limit Exceeded' }));
            
            const rateLimitError: any = new Error(error.message || 'Rate Limit Exceeded');
            rateLimitError.status = 429;
            rateLimitError.rateLimitLimit = rateLimitLimit;
            rateLimitError.rateLimitUsage = rateLimitUsage;
            rateLimitError.retryAfter = retryAfter ? parseInt(retryAfter) : null;
            rateLimitError.isRateLimit = true;
            
            throw rateLimitError;
          }
          
          const error = await response.json().catch(() => ({ message: 'Unknown error' }));
          const apiError: any = new Error(error.message || `HTTP error! status: ${response.status}`);
          apiError.status = response.status;
          throw apiError;
        }

        return response.json();
      },
      priority
    );
  }

  async getAthlete(useCache: boolean = true): Promise<StravaAthlete> {
    const cacheKey = getCacheKey('/athlete');
    if (useCache) {
      const cached = apiCache.get<StravaAthlete>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // High priority - user profile is important
    const data = await this.request('/athlete', {}, 10);
    // Cache athlete data for 10 minutes (changes infrequently)
    apiCache.set(cacheKey, data, 10 * 60 * 1000);
    return data;
  }

  async getAthleteStats(athleteId: number, useCache: boolean = true): Promise<StravaStats> {
    const cacheKey = getCacheKey(`/athletes/${athleteId}/stats`);
    if (useCache) {
      const cached = apiCache.get<StravaStats>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // High priority - stats are important for dashboard
    const data = await this.request(`/athletes/${athleteId}/stats`, {}, 9);
    // Cache stats for 5 minutes
    apiCache.set(cacheKey, data, 5 * 60 * 1000);
    return data;
  }

  async getActivities(perPage: number = 30, page: number = 1, useCache: boolean = true): Promise<StravaActivity[]> {
    const cacheKey = getCacheKey('/athlete/activities', { per_page: perPage, page });
    if (useCache) {
      const cached = apiCache.get<StravaActivity[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Lower priority for older pages, higher for recent
    const priority = page === 1 ? 8 : 5;
    const data = await this.request(`/athlete/activities?per_page=${perPage}&page=${page}`, {}, priority);
    // Cache activities for 2 minutes (page 1) or 5 minutes (other pages)
    // Recent activities change more frequently
    const ttl = page === 1 ? 2 * 60 * 1000 : 5 * 60 * 1000;
    apiCache.set(cacheKey, data, ttl);
    return data;
  }

  async getActivity(id: number, useCache: boolean = true): Promise<StravaActivity> {
    const cacheKey = getCacheKey(`/activities/${id}`, { include_all_efforts: true });
    if (useCache) {
      const cached = apiCache.get<StravaActivity>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Medium priority - user requested specific activity
    const data = await this.request(`/activities/${id}?include_all_efforts=true`, {}, 7);
    // Cache individual activities for 10 minutes (they don't change)
    apiCache.set(cacheKey, data, 10 * 60 * 1000);
    return data;
  }

  // Clear cache (useful for testing or when data needs to be refreshed)
  clearCache(): void {
    apiCache.clear();
  }
}

export const stravaClient = new StravaClient();

export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string
): Promise<StravaTokenResponse> {
  const response = await axios.post('https://www.strava.com/oauth/token', {
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
  });

  return response.data;
}

export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<StravaTokenResponse> {
  const response = await axios.post('https://www.strava.com/oauth/token', {
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  return response.data;
}

export function getStravaAuthUrl(clientId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'read,activity:read',
    approval_prompt: 'force',
  });

  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
}

