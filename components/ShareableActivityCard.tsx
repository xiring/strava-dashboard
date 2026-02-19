'use client';

import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { getActivityIcon } from '@/lib/activityIcons';

interface ShareableActivityCardProps {
  activity: {
    name: string;
    type: string;
    distance: number;
    moving_time: number;
    total_elevation_gain: number;
    start_date_local: string;
  };
  onClose?: () => void;
}

function formatDistance(m: number): string {
  const km = m / 1000;
  return km >= 1 ? `${km.toFixed(1)} km` : `${m} m`;
}

function formatDuration(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function ShareableActivityCard({ activity, onClose }: ShareableActivityCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleShare = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        backgroundColor: '#1f2937',
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `strava-${activity.name.replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image:', err);
    } finally {
      setDownloading(false);
    }
  };

  const date = new Date(activity.start_date_local).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-3">
      <div
        ref={cardRef}
        className="w-[400px] p-6 rounded-xl bg-gray-800 text-white font-sans"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{getActivityIcon(activity.type)}</span>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Strava</div>
            <h2 className="text-xl font-bold truncate max-w-[280px]">{activity.name}</h2>
          </div>
        </div>
        <div className="text-sm text-gray-400 mb-4">{date}</div>
        <div className="flex gap-6">
          <div>
            <div className="text-2xl font-bold text-orange-400">{formatDistance(activity.distance)}</div>
            <div className="text-xs text-gray-500">Distance</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-400">{formatDuration(activity.moving_time)}</div>
            <div className="text-xs text-gray-500">Time</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-400">{Math.round(activity.total_elevation_gain)}m</div>
            <div className="text-xs text-gray-500">Elevation</div>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleShare}
          disabled={downloading}
          className="px-4 py-2 bg-palette-light text-palette-darkest font-semibold rounded-lg hover:bg-palette-medium disabled:opacity-50"
        >
          {downloading ? 'Generating...' : 'Download image'}
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
