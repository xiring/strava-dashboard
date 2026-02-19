'use client';

import { useMemo } from 'react';
import { StravaActivity } from '@/lib/strava';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CumulativeDistanceChartProps {
  activities: StravaActivity[];
  year?: number;
}

export default function CumulativeDistanceChart({ activities, year }: CumulativeDistanceChartProps) {
  const data = useMemo(() => {
    const targetYear = year ?? new Date().getFullYear();
    const filtered = activities.filter((a) => new Date(a.start_date_local).getFullYear() === targetYear);
    const byDate = new Map<string, number>();

    filtered
      .sort((a, b) => new Date(a.start_date_local).getTime() - new Date(b.start_date_local).getTime())
      .forEach((a) => {
        const key = new Date(a.start_date_local).toISOString().split('T')[0];
        byDate.set(key, (byDate.get(key) || 0) + a.distance / 1000);
      });

    let cumulative = 0;
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, km]) => {
        cumulative += km;
        return {
          date,
          distance: Math.round(cumulative * 10) / 10,
          daily: Math.round(km * 10) / 10,
        };
      });
  }, [activities, year]);

  if (data.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400">No activities this year</p>
    );
  }

  return (
    <>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FC4C02" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#FC4C02" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
          <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number) => [`${value} km`, 'Cumulative']}
            labelFormatter={(label) => `Date: ${label}`}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Area type="monotone" dataKey="distance" stroke="#FC4C02" fill="url(#cumulativeGradient)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </>
  );
}
