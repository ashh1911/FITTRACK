import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, AIRecommendation as AIRec, MealLog, WeightLog, UserProfile } from '../lib/supabase';
import { Sparkles, RefreshCw } from 'lucide-react';

interface AIRecommendationProps {
  onRecommendationGenerated: () => void;
}

export function AIRecommendation({ onRecommendationGenerated }: AIRecommendationProps) {
  const { user } = useAuth();
  const [recommendation, setRecommendation] = useState<AIRec | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLatestRecommendation();
  }, []);

  const loadLatestRecommendation = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('ai_recommendations')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) setRecommendation(data);
  };

  const generateRecommendation = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('users_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: meals } = await supabase
        .from('meal_logs')
        .select('*, food_items(*)')
        .eq('user_id', user.id)
        .gte('logged_at', sevenDaysAgo.toISOString());

      const { data: weights } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(2);

      const recommendationText = analyzeAndRecommend(profile, meals, weights);

      const { error } = await supabase.from('ai_recommendations').insert({
        user_id: user.id,
        recommendation_text: recommendationText,
        date: new Date().toISOString().split('T')[0],
      });

      if (error) throw error;

      await loadLatestRecommendation();
      onRecommendationGenerated();
    } catch (error) {
      console.error('Error generating recommendation:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeAndRecommend = (
    profile: UserProfile | null,
    meals: MealLog[] | null,
    weights: WeightLog[] | null
  ): string => {
    if (!profile) return 'Complete your profile to get personalized recommendations.';

    let recommendations: string[] = [];

    if (!meals || meals.length === 0) {
      recommendations.push('Start logging your meals to track your calorie and macro intake.');
    } else {
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFats = 0;
      const daysLogged = new Set<string>();

      meals.forEach((meal) => {
        if (meal.food_items) {
          totalCalories += meal.food_items.calories * meal.servings;
          totalProtein += meal.food_items.protein * meal.servings;
          totalCarbs += meal.food_items.carbs * meal.servings;
          totalFats += meal.food_items.fats * meal.servings;
          daysLogged.add(meal.logged_at.split('T')[0]);
        }
      });

      const avgDailyCalories = totalCalories / Math.max(daysLogged.size, 1);
      const targetCalories = profile.daily_calorie_target;

      if (avgDailyCalories < targetCalories * 0.8) {
        recommendations.push(
          `Your average daily intake (${Math.round(avgDailyCalories)} cal) is below your target (${targetCalories} cal). Consider adding nutrient-dense snacks.`
        );
      } else if (avgDailyCalories > targetCalories * 1.2) {
        recommendations.push(
          `Your average daily intake (${Math.round(avgDailyCalories)} cal) exceeds your target (${targetCalories} cal). Focus on portion control and choose lower-calorie options.`
        );
      } else {
        recommendations.push(
          `Great job! Your calorie intake (${Math.round(avgDailyCalories)} cal) is aligned with your target.`
        );
      }

      const avgProtein = totalProtein / Math.max(daysLogged.size, 1);
      if (avgProtein < 50 && profile.goal_type === 'muscle_gain') {
        recommendations.push(
          'For muscle gain, increase your protein intake. Aim for lean meats, fish, eggs, and legumes.'
        );
      }
    }

    if (weights && weights.length >= 2) {
      const weightChange = weights[0].weight - weights[1].weight;
      if (profile.goal_type === 'weight_loss' && weightChange > 0) {
        recommendations.push(
          `Your weight increased by ${weightChange.toFixed(1)} kg. Review your calorie deficit and increase physical activity.`
        );
      } else if (profile.goal_type === 'muscle_gain' && weightChange < 0) {
        recommendations.push(
          `Your weight decreased by ${Math.abs(weightChange).toFixed(1)} kg. Increase calorie intake and focus on protein-rich foods.`
        );
      } else if (weightChange < 0 && profile.goal_type === 'weight_loss') {
        recommendations.push(
          `Excellent progress! You've lost ${Math.abs(weightChange).toFixed(1)} kg. Keep up the good work!`
        );
      }
    } else {
      recommendations.push('Log your weight regularly to track progress and adjust your plan accordingly.');
    }

    if (profile.goal_type === 'weight_loss') {
      recommendations.push(
        'Tip: Focus on whole foods, increase fiber intake, and stay hydrated. Aim for consistent calorie deficit.'
      );
    } else if (profile.goal_type === 'muscle_gain') {
      recommendations.push(
        'Tip: Prioritize protein intake (1.6-2.2g per kg body weight), progressive resistance training, and adequate rest.'
      );
    } else {
      recommendations.push(
        'Tip: Maintain balanced macros, stay active, and monitor your weight to ensure you remain at maintenance.'
      );
    }

    return recommendations.join('\n\n');
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 rounded-xl shadow-sm p-6 border-2 border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Sparkles className="w-6 h-6 mr-2 text-blue-600" />
          AI Recommendation
        </h2>
        <button
          onClick={generateRecommendation}
          disabled={loading}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Generating...' : 'Generate New'}</span>
        </button>
      </div>

      {recommendation ? (
        <div className="bg-white rounded-lg p-6">
          <p className="text-sm text-gray-600 mb-3">
            Generated on{' '}
            {new Date(recommendation.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <div className="text-gray-800 whitespace-pre-line leading-relaxed">
            {recommendation.recommendation_text}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg p-6 text-center">
          <p className="text-gray-600 mb-4">No recommendations yet</p>
          <button
            onClick={generateRecommendation}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Recommendation'}
          </button>
        </div>
      )}
    </div>
  );
}
