'use client';

import { StravaSplit } from '@/lib/strava';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface PaceBreakdownProps {
  splits: StravaSplit[];
  activityType: string;
  averageSpeed: number;
}

function formatPace(metersPerSecond: number, activityType: string): string {
  if (activityType === 'Run' || activityType === 'Walk' || activityType === 'Hike') {
    // Convert to min/km pace
    const secondsPerKm = 1000 / metersPerSecond;
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.floor(secondsPerKm % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  } else {
    // Convert to km/h
    const kmh = (metersPerSecond * 3600) / 1000;
    return `${kmh.toFixed(1)} km/h`;
  }
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function getPaceColor(pace: number, averagePace: number, activityType: string): string {
  if (activityType === 'Run' || activityType === 'Walk' || activityType === 'Hike') {
    // For running, lower pace (faster) is better
    if (pace < averagePace * 0.95) return '#10B981'; // Green - faster than average
    if (pace > averagePace * 1.05) return '#EF4444'; // Red - slower than average
    return '#FC4C02'; // Orange - close to average
  } else {
    // For cycling, higher speed (faster) is better
    if (pace > averagePace * 1.05) return '#10B981'; // Green - faster than average
    if (pace < averagePace * 0.95) return '#EF4444'; // Red - slower than average
    return '#FC4C02'; // Orange - close to average
  }
}

export default function PaceBreakdown({ splits, activityType, averageSpeed }: PaceBreakdownProps) {
  if (!splits || splits.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Pace Breakdown</h2>
        <p className="text-gray-500 dark:text-gray-400">No split data available for this activity</p>
      </div>
    );
  }

  // Prepare data for chart
  const chartData = splits.map((split, index) => {
    const pace = split.average_speed;
    return {
      split: `Split ${split.split || index + 1}`,
      pace: activityType === 'Run' || activityType === 'Walk' || activityType === 'Hike' 
        ? 1000 / pace // Convert to seconds per km for running
        : (pace * 3600) / 1000, // Convert to km/h for cycling
      paceFormatted: formatPace(pace, activityType),
      time: formatDuration(split.moving_time),
      distance: (split.distance / 1000).toFixed(2),
      elevation: split.elevation_difference > 0 ? `+${Math.round(split.elevation_difference)}m` : `${Math.round(split.elevation_difference)}m`,
    };
  });

  const averagePace = activityType === 'Run' || activityType === 'Walk' || activityType === 'Hike'
    ? 1000 / averageSpeed
    : (averageSpeed * 3600) / 1000;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Pace Breakdown</h2>
      
      {/* Chart */}
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="split" 
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
              label={{ 
                value: activityType === 'Run' || activityType === 'Walk' || activityType === 'Hike' 
                  ? 'Pace (min/km)' 
                  : 'Speed (km/h)', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: '#9CA3AF' }
              }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F3F4F6'
              }}
              formatter={(value: number, name: string) => {
                if (name === 'pace') {
                  return activityType === 'Run' || activityType === 'Walk' || activityType === 'Hike'
                    ? `${Math.floor(value / 60)}:${Math.floor(value % 60).toString().padStart(2, '0')} /km`
                    : `${value.toFixed(1)} km/h`;
                }
                return value;
              }}
            />
            <Bar dataKey="pace" name={activityType === 'Run' || activityType === 'Walk' || activityType === 'Hike' ? 'Pace' : 'Speed'}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getPaceColor(
                    activityType === 'Run' || activityType === 'Walk' || activityType === 'Hike'
                      ? 1000 / splits[index].average_speed
                      : (splits[index].average_speed * 3600) / 1000,
                    averagePace,
                    activityType
                  )} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Split</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Distance</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Time</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                {activityType === 'Run' || activityType === 'Walk' || activityType === 'Hike' ? 'Pace' : 'Speed'}
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Elevation</th>
            </tr>
          </thead>
          <tbody>
            {splits.map((split, index) => {
              const pace = split.average_speed;
              const paceValue = activityType === 'Run' || activityType === 'Walk' || activityType === 'Hike'
                ? 1000 / pace
                : (pace * 3600) / 1000;
              const isFaster = activityType === 'Run' || activityType === 'Walk' || activityType === 'Hike'
                ? paceValue < averagePace
                : paceValue > averagePace;
              
              return (
                <tr 
                  key={index} 
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">
                    {split.split || index + 1}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                    {(split.distance / 1000).toFixed(2)} km
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                    {formatDuration(split.moving_time)}
                  </td>
                  <td className={`py-3 px-4 text-right font-semibold ${
                    isFaster 
                      ? 'text-green-600 dark:text-green-400' 
                      : paceValue === averagePace
                      ? 'text-palette-dark'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatPace(pace, activityType)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                    {split.elevation_difference > 0 ? (
                      <span className="text-red-600 dark:text-red-400">
                        +{Math.round(split.elevation_difference)}m
                      </span>
                    ) : split.elevation_difference < 0 ? (
                      <span className="text-green-600 dark:text-green-400">
                        {Math.round(split.elevation_difference)}m
                      </span>
                    ) : (
                      <span>0m</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 dark:bg-gray-700 font-semibold">
              <td className="py-3 px-4 text-gray-900 dark:text-white">Average</td>
              <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                {(splits.reduce((sum, s) => sum + s.distance, 0) / 1000).toFixed(2)} km
              </td>
              <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                {formatDuration(splits.reduce((sum, s) => sum + s.moving_time, 0))}
              </td>
              <td className="py-3 px-4 text-right text-palette-dark">
                {formatPace(averageSpeed, activityType)}
              </td>
              <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                {Math.round(splits.reduce((sum, s) => sum + s.elevation_difference, 0))}m
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

