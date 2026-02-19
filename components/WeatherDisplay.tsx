'use client';

import { useEffect, useState } from 'react';

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  conditions: string;
  icon: string;
}

interface WeatherDisplayProps {
  lat: number;
  lon: number;
  timestamp?: number;
}

export default function WeatherDisplay({ lat, lon, timestamp }: WeatherDisplayProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const params = new URLSearchParams({
          lat: lat.toString(),
          lon: lon.toString(),
        });
        if (timestamp) {
          params.append('timestamp', timestamp.toString());
        }

        const response = await fetch(`/api/weather?${params}`);
        if (response.ok) {
          const data = await response.json();
          setWeather(data);
        }
      } catch (error) {
        console.error('Error fetching weather:', error);
      } finally {
        setLoading(false);
      }
    };

    if (lat && lon) {
      fetchWeather();
    }
  }, [lat, lon, timestamp]);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-palette-light"></div>
        <span className="text-sm">Loading weather...</span>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <div className="flex items-center space-x-4 p-4 glass">
      {weather.icon && (
        <img
          src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
          alt={weather.conditions}
          className="w-16 h-16"
        />
      )}
      <div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {Math.round(weather.temperature)}°C
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
          {weather.conditions}
        </div>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
        <div>Humidity: {weather.humidity}%</div>
        <div>Wind: {weather.windSpeed.toFixed(1)} m/s</div>
      </div>
    </div>
  );
}

