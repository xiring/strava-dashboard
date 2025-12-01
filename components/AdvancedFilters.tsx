'use client';

import { useState } from 'react';

interface AdvancedFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  activityTypes: string[];
}

export interface FilterState {
  searchQuery: string;
  activityTypes: string[];
  dateRange: { start: string; end: string };
  distanceRange: { min: number; max: number };
  elevationRange: { min: number; max: number };
  durationRange: { min: number; max: number };
  tags: string[];
}

export default function AdvancedFilters({ onFilterChange, activityTypes }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    activityTypes: [],
    dateRange: { start: '', end: '' },
    distanceRange: { min: 0, max: 1000 },
    elevationRange: { min: 0, max: 5000 },
    durationRange: { min: 0, max: 86400 },
    tags: [],
  });

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    const resetFilters: FilterState = {
      searchQuery: '',
      activityTypes: [],
      dateRange: { start: '', end: '' },
      distanceRange: { min: 0, max: 1000 },
      elevationRange: { min: 0, max: 5000 },
      durationRange: { min: 0, max: 86400 },
      tags: [],
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Advanced Filters</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-strava-orange hover:text-orange-600 font-medium"
        >
          {isOpen ? 'Hide' : 'Show'} Filters
        </button>
      </div>

      {isOpen && (
        <div className="space-y-4">
          {/* Activity Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Activity Types
            </label>
            <div className="flex flex-wrap gap-2">
              {activityTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    const newTypes = filters.activityTypes.includes(type)
                      ? filters.activityTypes.filter(t => t !== type)
                      : [...filters.activityTypes, type];
                    handleFilterChange('activityTypes', newTypes);
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filters.activityTypes.includes(type)
                      ? 'bg-strava-orange text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Distance Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Distance: {filters.distanceRange.min} - {filters.distanceRange.max} km
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Min (km)"
                value={filters.distanceRange.min}
                onChange={(e) => handleFilterChange('distanceRange', { ...filters.distanceRange, min: parseFloat(e.target.value) || 0 })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="number"
                placeholder="Max (km)"
                value={filters.distanceRange.max}
                onChange={(e) => handleFilterChange('distanceRange', { ...filters.distanceRange, max: parseFloat(e.target.value) || 1000 })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Elevation Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Elevation Gain: {filters.elevationRange.min} - {filters.elevationRange.max} m
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Min (m)"
                value={filters.elevationRange.min}
                onChange={(e) => handleFilterChange('elevationRange', { ...filters.elevationRange, min: parseFloat(e.target.value) || 0 })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="number"
                placeholder="Max (m)"
                value={filters.elevationRange.max}
                onChange={(e) => handleFilterChange('elevationRange', { ...filters.elevationRange, max: parseFloat(e.target.value) || 5000 })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Duration Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Duration: {Math.floor(filters.durationRange.min / 60)} - {Math.floor(filters.durationRange.max / 60)} minutes
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Min (minutes)"
                value={Math.floor(filters.durationRange.min / 60)}
                onChange={(e) => handleFilterChange('durationRange', { ...filters.durationRange, min: (parseFloat(e.target.value) || 0) * 60 })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="number"
                placeholder="Max (minutes)"
                value={Math.floor(filters.durationRange.max / 60)}
                onChange={(e) => handleFilterChange('durationRange', { ...filters.durationRange, max: (parseFloat(e.target.value) || 1440) * 60 })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Reset Button */}
          <div className="flex justify-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

