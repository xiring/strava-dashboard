import { NextRequest, NextResponse } from 'next/server';
import { getValidAccessToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = await getValidAccessToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const timestamp = searchParams.get('timestamp');

    if (!lat || !lon) {
      return NextResponse.json({ error: 'Latitude and longitude required' }, { status: 400 });
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Add OPENWEATHER_API_KEY to .env for weather. Get a free key at openweathermap.org' },
        { status: 503 }
      );
    }

    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    // Try historical API first if timestamp provided (One Call Time Machine - may require paid plan)
    let data: any;
    if (timestamp) {
      const historicalUrl = `https://api.openweathermap.org/data/2.5/onecall/timemachine?lat=${lat}&lon=${lon}&dt=${timestamp}&appid=${apiKey}&units=metric`;
      const histResponse = await fetch(historicalUrl);
      if (histResponse.ok) {
        data = await histResponse.json();
      } else {
        // Historical API often requires paid subscription; fall back to current weather
        const currResponse = await fetch(currentWeatherUrl);
        if (!currResponse.ok) {
          const err = await currResponse.json().catch(() => ({}));
          return NextResponse.json(
            { error: err.message || 'Failed to fetch weather' },
            { status: currResponse.status }
          );
        }
        data = await currResponse.json();
      }
    } else {
      const response = await fetch(currentWeatherUrl);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return NextResponse.json(
          { error: err.message || 'Failed to fetch weather' },
          { status: response.status }
        );
      }
      data = await response.json();
    }

    const weatherData = data.current
      ? {
          temperature: data.current.temp,
          humidity: data.current.humidity ?? 0,
          windSpeed: data.current.wind_speed ?? 0,
          conditions: data.current.weather?.[0]?.main ?? 'Unknown',
          icon: data.current.weather?.[0]?.icon ?? '01d',
        }
      : {
          temperature: data.main?.temp ?? 0,
          humidity: data.main?.humidity ?? 0,
          windSpeed: data.wind?.speed ?? 0,
          conditions: data.weather?.[0]?.main ?? 'Unknown',
          icon: data.weather?.[0]?.icon ?? '01d',
        };

    return NextResponse.json(weatherData);
  } catch (error: any) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch weather' },
      { status: 500 }
    );
  }
}

