'use client';

import { useEffect } from 'react';
import { performanceMonitor } from '@/lib/performance';

export default function PerformanceMonitor() {
  useEffect(() => {
    performanceMonitor.init();
    return () => {
      performanceMonitor.clear();
    };
  }, []);

  return null;
}

