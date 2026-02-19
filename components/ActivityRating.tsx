'use client';

import { useState } from 'react';
import { storage } from '@/lib/storage';

interface ActivityRatingProps {
  activityId: number;
  size?: 'sm' | 'md';
  className?: string;
}

export default function ActivityRating({ activityId, size = 'md', className = '' }: ActivityRatingProps) {
  const [rating, setRating] = useState<number | null>(() => storage.activityRatings.getRating(activityId));
  const [hover, setHover] = useState<number | null>(null);

  const handleClick = (value: number) => {
    const newRating = rating === value ? 0 : value;
    setRating(newRating || null);
    storage.activityRatings.setRating(activityId, newRating || 0);
  };

  const sizeClass = size === 'sm' ? 'text-sm' : 'text-lg';

  return (
    <div className={`flex items-center gap-0.5 ${className}`} onClick={(e) => e.stopPropagation()}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (hover ?? rating ?? 0) >= star;
        return (
          <button
            key={star}
            type="button"
            className={`p-0.5 transition-colors ${sizeClass} ${
              filled ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'
            } hover:text-amber-400 focus:outline-none`}
            onClick={() => handleClick(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(null)}
            aria-label={`Rate ${star} stars`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
