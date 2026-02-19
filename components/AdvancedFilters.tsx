'use client';

import { useState } from 'react';
import { FormField, Input, Select, Button } from '@/components/ui';

interface AdvancedFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  activityTypes: string[];
}

export interface FilterState {
  searchQuery: string;
  activityTypes: string[];
  commuteFilter: 'all' | 'commute' | 'non-commute';
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
    commuteFilter: 'all',
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
      commuteFilter: 'all',
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
    <div className="glass p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Advanced Filters</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-sm font-medium text-strava hover:text-strava-hover transition-colors"
        >
          {isOpen ? 'Hide' : 'Show'} Filters
        </button>
      </div>

      {isOpen && (
        <div className="space-y-5 pt-2 border-t border-slate-200 dark:border-slate-700">
          <FormField label="Commute">
            <Select
              value={filters.commuteFilter}
              onChange={(e) => handleFilterChange('commuteFilter', e.target.value as FilterState['commuteFilter'])}
            >
              <option value="all">All activities</option>
              <option value="commute">Commute only</option>
              <option value="non-commute">Non-commute only</option>
            </Select>
          </FormField>

          <FormField label="Activity Types">
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
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    filters.activityTypes.includes(type)
                      ? 'bg-strava text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Quick Date Presets">
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Last 7 days', getRange: () => {
                  const end = new Date();
                  const start = new Date();
                  start.setDate(start.getDate() - 7);
                  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
                }},
                { label: 'Last 30 days', getRange: () => {
                  const end = new Date();
                  const start = new Date();
                  start.setDate(start.getDate() - 30);
                  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
                }},
                { label: 'This month', getRange: () => {
                  const now = new Date();
                  const start = new Date(now.getFullYear(), now.getMonth(), 1);
                  const end = new Date();
                  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
                }},
                { label: 'This year', getRange: () => {
                  const now = new Date();
                  const start = new Date(now.getFullYear(), 0, 1);
                  const end = new Date();
                  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
                }},
                { label: 'Clear dates', getRange: () => ({ start: '', end: '' }) },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleFilterChange('dateRange', preset.getRange())}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Date">
              <Input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
              />
            </FormField>
            <FormField label="End Date">
              <Input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label={`Distance: ${filters.distanceRange.min} - ${filters.distanceRange.max} km`}>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Min (km)"
                value={filters.distanceRange.min}
                onChange={(e) => handleFilterChange('distanceRange', { ...filters.distanceRange, min: parseFloat(e.target.value) || 0 })}
              />
              <Input
                type="number"
                placeholder="Max (km)"
                value={filters.distanceRange.max}
                onChange={(e) => handleFilterChange('distanceRange', { ...filters.distanceRange, max: parseFloat(e.target.value) || 1000 })}
              />
            </div>
          </FormField>

          <FormField label={`Elevation: ${filters.elevationRange.min} - ${filters.elevationRange.max} m`}>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Min (m)"
                value={filters.elevationRange.min}
                onChange={(e) => handleFilterChange('elevationRange', { ...filters.elevationRange, min: parseFloat(e.target.value) || 0 })}
              />
              <Input
                type="number"
                placeholder="Max (m)"
                value={filters.elevationRange.max}
                onChange={(e) => handleFilterChange('elevationRange', { ...filters.elevationRange, max: parseFloat(e.target.value) || 5000 })}
              />
            </div>
          </FormField>

          <FormField label={`Duration: ${Math.floor(filters.durationRange.min / 60)} - ${Math.floor(filters.durationRange.max / 60)} min`}>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Min (min)"
                value={Math.floor(filters.durationRange.min / 60)}
                onChange={(e) => handleFilterChange('durationRange', { ...filters.durationRange, min: (parseFloat(e.target.value) || 0) * 60 })}
              />
              <Input
                type="number"
                placeholder="Max (min)"
                value={Math.floor(filters.durationRange.max / 60)}
                onChange={(e) => handleFilterChange('durationRange', { ...filters.durationRange, max: (parseFloat(e.target.value) || 1440) * 60 })}
              />
            </div>
          </FormField>

          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

