import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, FoodItem, MealLog } from '../lib/supabase';
import { Plus, Search, Trash2, Utensils } from 'lucide-react';

interface MealLoggingProps {
  onMealLogged: () => void;
}

export function MealLogging({ onMealLogged }: MealLoggingProps) {
  const { user } = useAuth();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<FoodItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState(1);
  const [category, setCategory] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFoods();
    loadMealLogs();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = foods.filter((food) =>
        food.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFoods(filtered);
    } else {
      setFilteredFoods(foods);
    }
  }, [searchTerm, foods]);

  const loadFoods = async () => {
    const { data } = await supabase
      .from('food_items')
      .select('*')
      .order('name');

    if (data) {
      setFoods(data);
      setFilteredFoods(data);
    }
  };

  const loadMealLogs = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('meal_logs')
      .select('*, food_items(*)')
      .eq('user_id', user.id)
      .gte('logged_at', today)
      .order('logged_at', { ascending: false });

    if (data) setMealLogs(data);
  };

  const handleLogMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFood) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('meal_logs').insert({
        user_id: user.id,
        food_id: selectedFood.id,
        servings,
        category,
        logged_at: new Date().toISOString(),
      });

      if (error) throw error;

      setSelectedFood(null);
      setServings(1);
      setSearchTerm('');
      await loadMealLogs();
      onMealLogged();
    } catch (error) {
      console.error('Error logging meal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('meal_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadMealLogs();
      onMealLogged();
    } catch (error) {
      console.error('Error deleting meal:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Utensils className="w-6 h-6 mr-2 text-blue-600" />
          Log Meal
        </h2>

        <form onSubmit={handleLogMeal} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Food</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search for food..."
              />
            </div>

            {searchTerm && (
              <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                {filteredFoods.map((food) => (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => {
                      setSelectedFood(food);
                      setSearchTerm('');
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                  >
                    <p className="font-medium text-gray-900">{food.name}</p>
                    <p className="text-sm text-gray-600">
                      {food.calories} cal | P: {food.protein}g | C: {food.carbs}g | F: {food.fats}g
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedFood && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="font-medium text-gray-900 mb-2">{selectedFood.name}</p>
              <div className="grid grid-cols-4 gap-2 text-sm text-gray-600">
                <div>
                  <p className="font-medium">{selectedFood.calories}</p>
                  <p>Calories</p>
                </div>
                <div>
                  <p className="font-medium">{selectedFood.protein}g</p>
                  <p>Protein</p>
                </div>
                <div>
                  <p className="font-medium">{selectedFood.carbs}g</p>
                  <p>Carbs</p>
                </div>
                <div>
                  <p className="font-medium">{selectedFood.fats}g</p>
                  <p>Fats</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Servings</label>
            <input
              type="number"
              value={servings}
              onChange={(e) => setServings(Number(e.target.value))}
              min="0.1"
              step="0.1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!selectedFood || loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            {loading ? 'Logging...' : 'Log Meal'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Today's Meals</h2>

        {mealLogs.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No meals logged today</p>
        ) : (
          <div className="space-y-3">
            {mealLogs.map((meal) => (
              <div
                key={meal.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{meal.food_items?.name}</p>
                  <p className="text-sm text-gray-600 capitalize">
                    {meal.category} | {meal.servings} serving(s)
                  </p>
                  <p className="text-sm text-gray-600">
                    {meal.food_items && Math.round(meal.food_items.calories * meal.servings)} cal
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteMeal(meal.id)}
                  className="text-red-600 hover:text-red-700 p-2"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
