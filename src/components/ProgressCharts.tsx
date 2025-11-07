import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, MealLog, WeightLog } from '../lib/supabase';
import { TrendingUp, Calendar } from 'lucide-react';

export function ProgressCharts() {
  const { user } = useAuth();
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [dailyCalories, setDailyCalories] = useState<{ date: string; calories: number }[]>([]);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    loadProgressData();
  }, [period]);

  const loadProgressData = async () => {
    if (!user) return;

    const daysBack = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const { data: weights } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (weights) setWeightLogs(weights);

    const { data: meals } = await supabase
      .from('meal_logs')
      .select('*, food_items(*)')
      .eq('user_id', user.id)
      .gte('logged_at', startDate.toISOString())
      .order('logged_at', { ascending: true });

    if (meals) {
      const caloriesByDay = new Map<string, number>();

      meals.forEach((meal: MealLog) => {
        const date = meal.logged_at.split('T')[0];
        const calories = meal.food_items ? meal.food_items.calories * meal.servings : 0;
        caloriesByDay.set(date, (caloriesByDay.get(date) || 0) + calories);
      });

      const calorieData = Array.from(caloriesByDay.entries())
        .map(([date, calories]) => ({ date, calories: Math.round(calories) }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setDailyCalories(calorieData);
    }
  };

  const maxWeight = Math.max(...weightLogs.map((w) => w.weight), 0);
  const minWeight = Math.min(...weightLogs.map((w) => w.weight), maxWeight);
  const weightRange = maxWeight - minWeight || 1;

  const maxCalories = Math.max(...dailyCalories.map((d) => d.calories), 0);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-blue-600" />
            Progress Overview
          </h2>
          <div className="flex space-x-2">
            {(['week', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Weight Progress
            </h3>
            {weightLogs.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No weight data for this period</p>
            ) : (
              <div className="space-y-2">
                {weightLogs.map((log, index) => {
                  const heightPercent = ((log.weight - minWeight) / weightRange) * 100;
                  return (
                    <div key={log.id} className="flex items-center space-x-3">
                      <span className="text-sm text-gray-600 w-24">
                        {new Date(log.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-8 relative">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-600 h-8 rounded-full flex items-center justify-end px-3"
                          style={{ width: `${Math.max(heightPercent, 10)}%` }}
                        >
                          <span className="text-white font-medium text-sm">{log.weight} kg</span>
                        </div>
                      </div>
                      {index > 0 && (
                        <span
                          className={`text-sm font-medium w-16 text-right ${
                            log.weight < weightLogs[index - 1].weight
                              ? 'text-green-600'
                              : log.weight > weightLogs[index - 1].weight
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {log.weight - weightLogs[index - 1].weight > 0 ? '+' : ''}
                          {(log.weight - weightLogs[index - 1].weight).toFixed(1)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Daily Calorie Intake
            </h3>
            {dailyCalories.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No calorie data for this period</p>
            ) : (
              <div className="space-y-2">
                {dailyCalories.map((day) => {
                  const heightPercent = (day.calories / maxCalories) * 100;
                  return (
                    <div key={day.date} className="flex items-center space-x-3">
                      <span className="text-sm text-gray-600 w-24">
                        {new Date(day.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-8 relative">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-8 rounded-full flex items-center justify-end px-3"
                          style={{ width: `${Math.max(heightPercent, 10)}%` }}
                        >
                          <span className="text-white font-medium text-sm">{day.calories} cal</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
