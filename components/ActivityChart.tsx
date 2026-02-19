'use client';

import { StravaActivity } from '@/lib/strava';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ActivityChartProps {
  activities: StravaActivity[];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDistance(meters: number): number {
  return Math.round(meters / 1000 * 10) / 10;
}

export default function ActivityChart({ activities }: ActivityChartProps) {
  // Prepare data for the chart - last 7 activities
  const chartData = activities
    .slice(0, 7)
    .reverse()
    .map((activity) => ({
      date: formatDate(activity.start_date_local),
      distance: formatDistance(activity.distance),
      elevation: Math.round(activity.total_elevation_gain),
    }));

  if (chartData.length === 0) {
    return (
      <p className="text-slate-500 dark:text-slate-400 text-center py-8">No data available for chart</p>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Activity Overview (Last 7 Activities)
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
          <XAxis 
            dataKey="date" 
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            yAxisId="left"
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
            label={{ value: 'Distance (km)', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
            label={{ value: 'Elevation (m)', angle: 90, position: 'insideRight', style: { fill: '#9CA3AF' } }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#F3F4F6'
            }}
          />
          <Legend />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="distance" 
            stroke="#FC4C02" 
            strokeWidth={2}
            name="Distance (km)"
            dot={{ fill: '#FC4C02', r: 4 }}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="elevation" 
            stroke="#10B981" 
            strokeWidth={2}
            name="Elevation (m)"
            dot={{ fill: '#10B981', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

