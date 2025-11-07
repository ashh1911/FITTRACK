import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, MealLog, WeightLog, UserProfile } from '../lib/supabase';
import { TrendingDown, TrendingUp, Target, Activity, Apple, Scale, Ruler, LogOut } from 'lucide-react';
import { MealLogging } from './MealLogging';
import { WeightTracking } from './WeightTracking';
import { MeasurementTracking } from './MeasurementTracking';
import { ProgressCharts } from './ProgressCharts';
import { AIRecommendation } from './AIRecommendation';
import { Profile } from './Profile';

type Tab = 'dashboard' | 'meals' | 'weight' | 'measurements' | 'progress' | 'profile';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todayCalories, setTodayCalories] = useState(0);
  const [todayMacros, setTodayMacros] = useState({ protein: 0, carbs: 0, fats: 0 });
  const [recentWeight, setRecentWeight] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: profileData } = await supabase
        .from('users_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      setProfile(profileData);

      const today = new Date().toISOString().split('T')[0];
      const { data: mealsData } = await supabase
        .from('meal_logs')
        .select('*, food_items(*)')
        .eq('user_id', user.id)
        .gte('logged_at', today)
        .lt('logged_at', `${today}T23:59:59`);

      if (mealsData) {
        let calories = 0;
        let protein = 0;
        let carbs = 0;
        let fats = 0;

        mealsData.forEach((meal: MealLog) => {
          if (meal.food_items) {
            calories += meal.food_items.calories * meal.servings;
            protein += meal.food_items.protein * meal.servings;
            carbs += meal.food_items.carbs * meal.servings;
            fats += meal.food_items.fats * meal.servings;
          }
        });

        setTodayCalories(Math.round(calories));
        setTodayMacros({ protein: Math.round(protein), carbs: Math.round(carbs), fats: Math.round(fats) });
      }

      const { data: weightData } = await supabase
        .from('weight_logs')
        .select('weight')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      setRecentWeight(weightData?.weight ?? null);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const calorieProgress = profile ? (todayCalories / profile.daily_calorie_target) * 100 : 0;

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: Activity },
    { id: 'meals' as const, label: 'Meals', icon: Apple },
    { id: 'weight' as const, label: 'Weight', icon: Scale },
    { id: 'measurements' as const, label: 'Measurements', icon: Ruler },
    { id: 'progress' as const, label: 'Progress', icon: TrendingUp },
    { id: 'profile' as const, label: 'Profile', icon: Target },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 rounded-lg p-2">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">FitTrack</h1>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-1 bg-white rounded-lg shadow-sm p-1 mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Welcome back, {profile?.name}!</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-700">Today's Calories</h3>
                    <Apple className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {todayCalories} <span className="text-lg text-gray-600">/ {profile?.daily_calorie_target}</span>
                  </p>
                  <div className="mt-3 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(calorieProgress, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-700">Current Weight</h3>
                    <Scale className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {recentWeight ? `${recentWeight} kg` : 'Not set'}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-700">Goal Type</h3>
                    <Target className="w-5 h-5 text-yellow-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 capitalize">
                    {profile?.goal_type.replace('_', ' ')}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-medium text-gray-700 mb-4">Today's Macros</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{todayMacros.protein}g</p>
                    <p className="text-sm text-gray-600">Protein</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{todayMacros.carbs}g</p>
                    <p className="text-sm text-gray-600">Carbs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{todayMacros.fats}g</p>
                    <p className="text-sm text-gray-600">Fats</p>
                  </div>
                </div>
              </div>
            </div>

            <AIRecommendation onRecommendationGenerated={loadDashboardData} />
          </div>
        )}

        {activeTab === 'meals' && <MealLogging onMealLogged={loadDashboardData} />}
        {activeTab === 'weight' && <WeightTracking />}
        {activeTab === 'measurements' && <MeasurementTracking />}
        {activeTab === 'progress' && <ProgressCharts />}
        {activeTab === 'profile' && <Profile profile={profile} onProfileUpdated={loadDashboardData} />}
      </div>
    </div>
  );
}
