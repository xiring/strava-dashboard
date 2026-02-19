'use client';

import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';

interface FavoriteButtonProps {
  activityId: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function FavoriteButton({ activityId, className = '', size = 'md' }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    setIsFavorite(storage.favoriteActivities.has(activityId));
  }, [activityId]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFavorite) {
      storage.favoriteActivities.remove(activityId);
    } else {
      storage.favoriteActivities.add(activityId);
    }
    setIsFavorite(!isFavorite);
  };

  const sizeClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <button
      onClick={toggle}
      className={`${sizeClasses[size]} p-1 rounded transition-colors hover:scale-110 focus:outline-none focus:ring-2 focus:ring-palette-light ${className}`}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={isFavorite}
    >
      {isFavorite ? '⭐' : '☆'}
    </button>
  );
}
