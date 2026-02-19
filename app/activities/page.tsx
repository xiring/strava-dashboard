'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { StravaActivity, StravaAthlete } from '@/lib/strava';
import ActivityCard from '@/components/ActivityCard';
import AdvancedFilters, { FilterState } from '@/components/AdvancedFilters';
import { debounce } from '@/lib/debounce';
import ExportDropdown from '@/components/ExportDropdown';
import { ActivityCardSkeleton } from '@/components/LoadingSkeleton';
import AppHeader from '@/components/AppHeader';
import PageHeader from '@/components/PageHeader';

type SortOption = 'date_desc' | 'date_asc' | 'distance_desc' | 'distance_asc' | 'duration_desc' | 'duration_asc';
type ActivityType = 'All' | 'Run' | 'Ride' | 'Walk' | 'Hike' | 'Swim' | 'Workout';

export default function AllActivitiesPage() {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [athlete, setAthlete] = useState<StravaAthlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [filterType, setFilterType] = useState<ActivityType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<FilterState | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const activitiesPerPage = 12;

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
  }, [currentPage]);

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

  // Filter and sort activities
  const filteredAndSortedActivities = useMemo(() => {
    let filtered = [...activities];

    // Filter by type
    if (filterType !== 'All') {
      filtered = filtered.filter((activity) => activity.type === filterType);
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
  }, [activities, filterType, searchDebounced, sortBy, advancedFilters]);

  // Calculate pagination
  const paginatedActivities = useMemo(() => {
    const total = filteredAndSortedActivities.length;
    const pages = Math.ceil(total / activitiesPerPage);
    setTotalPages(pages);

    const startIndex = (currentPage - 1) * activitiesPerPage;
    const endIndex = startIndex + activitiesPerPage;
    return filteredAndSortedActivities.slice(startIndex, endIndex);
  }, [filteredAndSortedActivities, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchQuery, sortBy, advancedFilters]);

  const activityTypes: ActivityType[] = ['All', 'Run', 'Ride', 'Walk', 'Hike', 'Swim', 'Workout'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-palette-light mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading activities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AppHeader athlete={athlete} />
      <PageHeader
        title="All Activities"
        actions={<ExportDropdown activities={filteredAndSortedActivities} />}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Advanced Filters */}
        <AdvancedFilters
          onFilterChange={setAdvancedFilters}
          activityTypes={['Run', 'Ride', 'Walk', 'Hike', 'Swim', 'Workout']}
        />

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search activities..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-palette-light focus:border-transparent"
              />
            </div>

            {/* Filter by Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Activity Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as ActivityType)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-palette-light focus:border-transparent"
              >
                {activityTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-palette-light focus:border-transparent"
              >
                <option value="date_desc">Date (Newest First)</option>
                <option value="date_asc">Date (Oldest First)</option>
                <option value="distance_desc">Distance (Longest First)</option>
                <option value="distance_asc">Distance (Shortest First)</option>
                <option value="duration_desc">Duration (Longest First)</option>
                <option value="duration_asc">Duration (Shortest First)</option>
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {paginatedActivities.length} of {filteredAndSortedActivities.length} activities
          </div>
        </div>

        {/* Activities Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <ActivityCardSkeleton key={i} />
            ))}
          </div>
        ) : paginatedActivities.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
              {paginatedActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? 'bg-palette-light text-palette-darkest'
                            : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No activities found matching your filters.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

