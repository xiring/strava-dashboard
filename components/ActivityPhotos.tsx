'use client';

import { useEffect, useState } from 'react';

interface StravaPhoto {
  id: number;
  unique_id: string;
  urls: Record<string, string>;
  caption?: string;
  source: number;
}

interface ActivityPhotosProps {
  activityId: number;
}

export default function ActivityPhotos({ activityId }: ActivityPhotosProps) {
  const [photos, setPhotos] = useState<StravaPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const response = await fetch(`/api/activities/${activityId}/photos`);
        if (response.ok) {
          const data = await response.json();
          setPhotos(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching photos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [activityId]);

  if (loading || photos.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Photos</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => {
          const url = photo.urls['500'] || photo.urls['100'] || Object.values(photo.urls)[0];
          if (!url) return null;
          return (
            <a
              key={photo.id}
              href={photo.urls['1000'] || photo.urls['500'] || url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:opacity-90 transition-opacity"
            >
              <img
                src={url}
                alt={photo.caption || 'Activity photo'}
                className="w-full h-32 object-cover"
              />
              {photo.caption && (
                <p className="p-2 text-xs text-gray-600 dark:text-gray-400 truncate">
                  {photo.caption}
                </p>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}
