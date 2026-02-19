'use client';

import { useEffect, useState } from 'react';
import { storage } from '@/lib/storage';
import { StravaActivity, StravaAthlete } from '@/lib/strava';
import AppHeader from '@/components/AppHeader';
import PageHeader from '@/components/PageHeader';
import { FormField, Input, Select, Button } from '@/components/ui';
import { scheduleGoalReminder } from '@/lib/notifications';

interface Goal {
  id: string;
  type: 'distance' | 'activities' | 'elevation' | 'time';
  target: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  unit: string;
  current: number;
  progress: number;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [athlete, setAthlete] = useState<StravaAthlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    type: 'distance',
    period: 'monthly',
    target: 100,
    unit: 'km',
  });

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
    loadGoals();
    loadActivities();
  }, []);

  const loadGoals = () => {
    const saved = storage.preferences.get();
    setGoals(saved.goals || []);
  };

  const loadActivities = async () => {
    try {
      // Load fewer activities - goals can be calculated from a reasonable sample
      const response = await fetch('/api/activities?per_page=100&page=1');
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
        updateGoalProgress(data);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const updateGoalProgress = (activities: StravaActivity[]) => {
    const now = new Date();
    const updatedGoals = goals.map((goal) => {
      let filtered = [...activities];

      // Filter by period
      switch (goal.period) {
        case 'daily':
          filtered = filtered.filter(
            (a) => new Date(a.start_date_local).toDateString() === now.toDateString()
          );
          break;
        case 'weekly':
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          filtered = filtered.filter((a) => new Date(a.start_date_local) >= weekAgo);
          break;
        case 'monthly':
          filtered = filtered.filter(
            (a) => new Date(a.start_date_local).getMonth() === now.getMonth() &&
                   new Date(a.start_date_local).getFullYear() === now.getFullYear()
          );
          break;
        case 'yearly':
          filtered = filtered.filter(
            (a) => new Date(a.start_date_local).getFullYear() === now.getFullYear()
          );
          break;
      }

      // Calculate current value
      let current = 0;
      switch (goal.type) {
        case 'distance':
          current = filtered.reduce((sum, a) => sum + a.distance, 0) / 1000; // km
          break;
        case 'activities':
          current = filtered.length;
          break;
        case 'elevation':
          current = filtered.reduce((sum, a) => sum + a.total_elevation_gain, 0); // meters
          break;
        case 'time':
          current = filtered.reduce((sum, a) => sum + a.moving_time, 0) / 3600; // hours
          break;
      }

      const progress = Math.min((current / goal.target) * 100, 100);

      // Send notification if goal is achieved or close
      scheduleGoalReminder(goal.type, current, goal.target);

      return { ...goal, current, progress };
    });

    setGoals(updatedGoals);
  };

  const saveGoal = () => {
    const goal: Goal = {
      id: Date.now().toString(),
      type: newGoal.type || 'distance',
      target: newGoal.target || 100,
      period: newGoal.period || 'monthly',
      unit: newGoal.unit || 'km',
      current: 0,
      progress: 0,
    };

    const updated = [...goals, goal];
    setGoals(updated);
    const prefs = storage.preferences.get();
    storage.preferences.set({ ...prefs, goals: updated });
    setShowAddGoal(false);
    setNewGoal({ type: 'distance', period: 'monthly', target: 100, unit: 'km' });
    updateGoalProgress(activities);
  };

  const deleteGoal = (id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    setGoals(updated);
    const prefs = storage.preferences.get();
    storage.preferences.set({ ...prefs, goals: updated });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-palette-light mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader athlete={athlete} />
      <PageHeader
        title="Goals & Targets"
        actions={
          <button
            onClick={() => setShowAddGoal(true)}
            className="px-4 py-2 bg-palette-light hover:bg-palette-medium text-palette-darkest font-semibold rounded-lg transition-colors flex items-center space-x-2"
          >
            <span>+</span>
            <span className="hidden sm:inline">Add Goal</span>
          </button>
        }
      />

      <main className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10">
        {showAddGoal && (
          <div className="glass p-6 mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">New Goal</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <FormField label="Type">
                <Select
                  value={newGoal.type}
                  onChange={(e) => {
                    const type = e.target.value as Goal['type'];
                    setNewGoal({
                      ...newGoal,
                      type,
                      unit: type === 'distance' ? 'km' : type === 'elevation' ? 'm' : type === 'time' ? 'hours' : '',
                    });
                  }}
                >
                  <option value="distance">Distance</option>
                  <option value="activities">Activities</option>
                  <option value="elevation">Elevation</option>
                  <option value="time">Time</option>
                </Select>
              </FormField>
              <FormField label="Period">
                <Select
                  value={newGoal.period}
                  onChange={(e) => setNewGoal({ ...newGoal, period: e.target.value as Goal['period'] })}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </Select>
              </FormField>
              <FormField label="Target">
                <Input
                  type="number"
                  value={newGoal.target}
                  onChange={(e) => setNewGoal({ ...newGoal, target: parseFloat(e.target.value) })}
                  placeholder="100"
                />
              </FormField>
              <div className="flex items-end gap-2">
                <Button onClick={saveGoal} className="flex-1">
                  Save Goal
                </Button>
                <Button variant="secondary" onClick={() => setShowAddGoal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {goals.length === 0 ? (
          <div className="glass p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
              No goals set yet. Create your first goal to track your progress!
            </p>
            <button
              onClick={() => setShowAddGoal(true)}
              className="px-6 py-3 bg-palette-light hover:bg-palette-medium text-palette-darkest font-semibold rounded-lg transition-colors"
            >
              Create Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="glass p-6 border-l-4 border-strava"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                      {goal.type} - {goal.period}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Target: {goal.target} {goal.unit}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {goal.current.toFixed(goal.type === 'activities' ? 0 : 1)} {goal.unit}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {goal.progress.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        goal.progress >= 100
                          ? 'bg-green-500'
                          : goal.progress >= 75
                          ? 'bg-palette-light'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {goal.progress >= 100 && (
                  <div className="text-center text-green-600 dark:text-green-400 font-semibold">
                    🎉 Goal Achieved!
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

