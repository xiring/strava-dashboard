'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { StravaActivity, StravaAthlete } from '@/lib/strava';
import ActivityCard from '@/components/ActivityCard';
import AdvancedFilters, { FilterState } from '@/components/AdvancedFilters';
import { debounce } from '@/lib/debounce';
import ExportDropdown from '@/components/ExportDropdown';
import ActivityCalendar from '@/components/ActivityCalendar';
import { ActivityCardSkeleton } from '@/components/LoadingSkeleton';
import AppHeader from '@/components/AppHeader';
import PageHeader from '@/components/PageHeader';
import { FormField, Input, Select } from '@/components/ui';
import { storage } from '@/lib/storage';

type SortOption = 'date_desc' | 'date_asc' | 'distance_desc' | 'distance_asc' | 'duration_desc' | 'duration_asc';
type ActivityType = 'All' | 'Run' | 'Ride' | 'Walk' | 'Hike' | 'Swim' | 'Workout';

export default function AllActivitiesPage() {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [athlete, setAthlete] = useState<StravaAthlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(24);
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [filterType, setFilterType] = useState<ActivityType>('All');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<FilterState | null>(null);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const increment = 24;
  const recentSearches = storage.recentSearches.get() ?? [];

  useEffect(() => {
    const fetchAthlete = async () => {
      try {
        const response = await fetch('/api/athlete');
        if (response.ok) {
          const data = await response.json();
          setAthlete(data.athlete);
        }
      } catch (err) {
        // Ignore errors
      }
    };
    fetchAthlete();
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      // Load more activities for filtering/sorting on client side
      const response = await fetch(`/api/activities?per_page=200&page=1`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load activities');
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load activities');
      setLoading(false);
    }
  };

  // Debounced search to avoid excessive filtering
  const [searchDebounced, setSearchDebounced] = useState(searchQuery);
  
  useEffect(() => {
    const debounced = debounce(() => {
      setSearchDebounced(searchQuery);
    }, 300);
    debounced();
  }, [searchQuery]);

  // Add to recent searches when user searches (non-empty, applied)
  useEffect(() => {
    if (searchDebounced.trim()) {
      storage.recentSearches.add(searchDebounced.trim());
    }
  }, [searchDebounced]);

  // Filter and sort activities
  const filteredAndSortedActivities = useMemo(() => {
    let filtered = [...activities];

    // Filter by type
    if (filterType !== 'All') {
      filtered = filtered.filter((activity) => activity.type === filterType);
    }

    // Filter by favorites
    if (favoritesOnly) {
      const favorites = storage.favoriteActivities.get() || [];
      filtered = filtered.filter((activity) => favorites.includes(activity.id));
    }

    // Filter by rating
    if (ratingFilter !== 'all') {
      const ratings = storage.activityRatings.get() || {};
      filtered = filtered.filter((a) => ratings[String(a.id)] === ratingFilter);
    }

    // Filter by search query (using debounced value)
    if (searchDebounced.trim()) {
      const query = searchDebounced.toLowerCase();
      filtered = filtered.filter(
        (activity) =>
          activity.name.toLowerCase().includes(query) ||
          activity.type.toLowerCase().includes(query)
      );
    }

    // Apply advanced filters
    if (advancedFilters) {
      // Commute filter
      if (advancedFilters.commuteFilter === 'commute') {
        filtered = filtered.filter((activity) => (activity as any).commute === true);
      } else if (advancedFilters.commuteFilter === 'non-commute') {
        filtered = filtered.filter((activity) => (activity as any).commute !== true);
      }

      // Activity types filter
      if (advancedFilters.activityTypes.length > 0) {
        filtered = filtered.filter((activity) =>
          advancedFilters.activityTypes.includes(activity.type)
        );
      }

      // Date range filter
      if (advancedFilters.dateRange.start) {
        const startDate = new Date(advancedFilters.dateRange.start);
        filtered = filtered.filter(
          (activity) => new Date(activity.start_date_local) >= startDate
        );
      }
      if (advancedFilters.dateRange.end) {
        const endDate = new Date(advancedFilters.dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(
          (activity) => new Date(activity.start_date_local) <= endDate
        );
      }

      // Distance range filter
      filtered = filtered.filter(
        (activity) =>
          activity.distance / 1000 >= advancedFilters.distanceRange.min &&
          activity.distance / 1000 <= advancedFilters.distanceRange.max
      );

      // Elevation range filter
      filtered = filtered.filter(
        (activity) =>
          activity.total_elevation_gain >= advancedFilters.elevationRange.min &&
          activity.total_elevation_gain <= advancedFilters.elevationRange.max
      );

      // Duration range filter
      filtered = filtered.filter(
        (activity) =>
          activity.moving_time >= advancedFilters.durationRange.min &&
          activity.moving_time <= advancedFilters.durationRange.max
      );
    }

    // Sort activities
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.start_date_local).getTime() - new Date(a.start_date_local).getTime();
        case 'date_asc':
          return new Date(a.start_date_local).getTime() - new Date(b.start_date_local).getTime();
        case 'distance_desc':
          return b.distance - a.distance;
        case 'distance_asc':
          return a.distance - b.distance;
        case 'duration_desc':
          return b.moving_time - a.moving_time;
        case 'duration_asc':
          return a.moving_time - b.moving_time;
        default:
          return 0;
      }
    });

    return filtered;
  }, [activities, filterType, favoritesOnly, ratingFilter, searchDebounced, sortBy, advancedFilters]);

  // Visible activities (infinite scroll)
  const visibleActivities = useMemo(() => {
    return filteredAndSortedActivities.slice(0, visibleCount);
  }, [filteredAndSortedActivities, visibleCount]);

  const hasMore = visibleCount < filteredAndSortedActivities.length;

  // Infinite scroll: load more when sentinel is visible
  useEffect(() => {
    if (!hasMore || !loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => c + increment);
        }
      },
      { rootMargin: '100px' }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, visibleCount]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(increment);
  }, [filterType, favoritesOnly, ratingFilter, searchQuery, sortBy, advancedFilters]);

  const activityTypes: ActivityType[] = ['All', 'Run', 'Ride', 'Walk', 'Hike', 'Swim', 'Workout'];
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Listen for keyboard shortcut to focus search
  useEffect(() => {
    const handler = () => searchInputRef.current?.focus();
    window.addEventListener('strava-focus-search', handler);
    return () => window.removeEventListener('strava-focus-search', handler);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-palette-light mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading activities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full glass p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block bg-palette-light hover:bg-palette-medium text-palette-darkest font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AppHeader athlete={athlete} />
      <PageHeader
        title="All Activities"
        actions={<ExportDropdown activities={filteredAndSortedActivities} />}
      />

      {/* Main Content */}
      <main className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10">
        {/* Advanced Filters */}
        <AdvancedFilters
          onFilterChange={setAdvancedFilters}
          activityTypes={['Run', 'Ride', 'Walk', 'Hike', 'Swim', 'Workout']}
        />

        {/* Filters and Search */}
        <div className="glass p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FormField label="Search">
              <div className="relative">
                <Input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowRecentSearches(true)}
                  onBlur={() => setTimeout(() => setShowRecentSearches(false), 150)}
                  placeholder="Search activities... (press / to focus)"
                />
                {showRecentSearches && recentSearches.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-50 glass rounded-xl overflow-hidden shadow-lg border border-white/20 dark:border-white/5">
                    <div className="p-2 border-b border-white/10">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Recent searches</span>
                    </div>
                    <ul className="max-h-48 overflow-y-auto">
                      {recentSearches.map((s) => (
                        <li key={s}>
                          <button
                            type="button"
                            className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
                            onClick={() => {
                              setSearchQuery(s);
                              setShowRecentSearches(false);
                              searchInputRef.current?.blur();
                            }}
                          >
                            {s}
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => {
                        storage.recentSearches.set([]);
                        setShowRecentSearches(false);
                      }}
                      className="w-full px-4 py-2 text-xs text-slate-500 dark:text-slate-400 hover:bg-white/20 dark:hover:bg-white/5"
                    >
                      Clear recent
                    </button>
                  </div>
                )}
              </div>
            </FormField>

            <FormField label="Activity Type">
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as ActivityType)}
              >
                {activityTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Rating">
              <Select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              >
                <option value="all">Any rating</option>
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>{r} ★</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Favorites">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={favoritesOnly}
                  onChange={(e) => setFavoritesOnly(e.target.checked)}
                  className="rounded border-slate-300 text-strava focus:ring-strava"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Favorites only</span>
              </label>
            </FormField>

            <FormField label="Sort By">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                <option value="date_desc">Date (Newest First)</option>
                <option value="date_asc">Date (Oldest First)</option>
                <option value="distance_desc">Distance (Longest First)</option>
                <option value="distance_asc">Distance (Shortest First)</option>
                <option value="duration_desc">Duration (Longest First)</option>
                <option value="duration_asc">Duration (Shortest First)</option>
              </Select>
            </FormField>

            <FormField label="View">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-strava text-white'
                      : 'bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/10'
                  }`}
                >
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'calendar'
                      ? 'bg-strava text-white'
                      : 'bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/10'
                  }`}
                >
                  Calendar
                </button>
              </div>
            </FormField>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
            {viewMode === 'grid'
              ? `Showing ${visibleActivities.length} of ${filteredAndSortedActivities.length} activities`
              : `${filteredAndSortedActivities.length} activities`}
          </div>
        </div>

        {/* Activities Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <ActivityCardSkeleton key={i} />
            ))}
          </div>
        ) : viewMode === 'calendar' ? (
          <ActivityCalendar activities={filteredAndSortedActivities} />
        ) : visibleActivities.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 mb-8">
              {visibleActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            {hasMore && <div ref={loadMoreRef} className="h-4" aria-hidden="true" />}
          </>
        ) : (
          <div className="glass p-16 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              No activities found matching your filters.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

