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
        { error: 'Weather API key not configured' },
        { status: 500 }
      );
    }

    // Use current weather or historical if timestamp provided
    const url = timestamp
      ? `https://api.openweathermap.org/data/2.5/onecall/timemachine?lat=${lat}&lon=${lon}&dt=${timestamp}&appid=${apiKey}&units=metric`
      : `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch weather data' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    const weatherData = timestamp
      ? {
          temperature: data.current?.temp || data.temp,
          humidity: data.current?.humidity || data.humidity,
          windSpeed: data.current?.wind_speed || data.wind_speed || 0,
          conditions: data.current?.weather?.[0]?.main || data.weather?.[0]?.main || 'Unknown',
          icon: data.current?.weather?.[0]?.icon || data.weather?.[0]?.icon || '01d',
        }
      : {
          temperature: data.main.temp,
          humidity: data.main.humidity,
          windSpeed: data.wind?.speed || 0,
          conditions: data.weather[0].main,
          icon: data.weather[0].icon,
        };

    return NextResponse.json(weatherData);
  } catch (error: any) {
    console.error('Error fetching weather:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch weather' },
      { status: 500 }
    );
  }
}

