import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserProfile {
  id: string;
  name: string;
  goal_type: 'weight_loss' | 'muscle_gain' | 'maintenance';
  daily_calorie_target: number;
  created_at: string;
  updated_at: string;
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  barcode?: string;
  created_at: string;
}

export interface MealLog {
  id: string;
  user_id: string;
  food_id: string;
  servings: number;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  logged_at: string;
  created_at: string;
  food_items?: FoodItem;
}

export interface WeightLog {
  id: string;
  user_id: string;
  weight: number;
  date: string;
  created_at: string;
}

export interface Measurement {
  id: string;
  user_id: string;
  date: string;
  waist?: number;
  chest?: number;
  arms?: number;
  hips?: number;
  thighs?: number;
  created_at: string;
}

export interface AIRecommendation {
  id: string;
  user_id: string;
  recommendation_text: string;
  date: string;
  created_at: string;
}
