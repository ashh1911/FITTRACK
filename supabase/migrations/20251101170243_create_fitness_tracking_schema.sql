/*
  # Fitness Tracking App Database Schema

  ## Overview
  This migration creates the complete database schema for a fitness tracking application
  that allows users to log meals, track weight, record body measurements, and receive
  AI-powered recommendations.

  ## New Tables

  ### 1. users_profiles
  Extended user profile information beyond Supabase auth:
  - `id` (uuid, FK to auth.users) - Links to Supabase authentication
  - `name` (text) - User's full name
  - `goal_type` (text) - Fitness goal: 'weight_loss', 'muscle_gain', 'maintenance'
  - `daily_calorie_target` (integer) - Target daily calorie intake
  - `created_at` (timestamptz) - Profile creation timestamp
  - `updated_at` (timestamptz) - Last profile update

  ### 2. food_items
  Database of food items with nutritional information:
  - `id` (uuid) - Primary key
  - `name` (text) - Food item name
  - `calories` (numeric) - Calories per serving
  - `protein` (numeric) - Protein in grams
  - `carbs` (numeric) - Carbohydrates in grams
  - `fats` (numeric) - Fats in grams
  - `barcode` (text) - Product barcode for scanning
  - `created_at` (timestamptz) - Record creation timestamp

  ### 3. meal_logs
  Records of meals logged by users:
  - `id` (uuid) - Primary key
  - `user_id` (uuid, FK) - User who logged the meal
  - `food_id` (uuid, FK) - Food item consumed
  - `servings` (numeric) - Number of servings consumed
  - `category` (text) - Meal type: 'breakfast', 'lunch', 'dinner', 'snack'
  - `logged_at` (timestamptz) - When the meal was logged
  - `created_at` (timestamptz) - Record creation timestamp

  ### 4. weight_logs
  Weight tracking history:
  - `id` (uuid) - Primary key
  - `user_id` (uuid, FK) - User who logged the weight
  - `weight` (numeric) - Weight value in kg
  - `date` (date) - Date of measurement
  - `created_at` (timestamptz) - Record creation timestamp

  ### 5. measurements
  Body measurements tracking:
  - `id` (uuid) - Primary key
  - `user_id` (uuid, FK) - User who logged the measurements
  - `date` (date) - Date of measurement
  - `waist` (numeric) - Waist measurement in cm
  - `chest` (numeric) - Chest measurement in cm
  - `arms` (numeric) - Arms measurement in cm
  - `hips` (numeric) - Hips measurement in cm (optional)
  - `thighs` (numeric) - Thighs measurement in cm (optional)
  - `created_at` (timestamptz) - Record creation timestamp

  ### 6. ai_recommendations
  AI-generated personalized recommendations:
  - `id` (uuid) - Primary key
  - `user_id` (uuid, FK) - User receiving the recommendation
  - `recommendation_text` (text) - AI-generated recommendation
  - `date` (date) - Date recommendation was generated
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security

  Row Level Security (RLS) is enabled on all tables with the following policies:

  ### users_profiles
  - Users can view and update only their own profile
  - Users can insert their profile on first login

  ### food_items
  - All authenticated users can view food items (public database)
  - Only authenticated users can add new food items

  ### meal_logs, weight_logs, measurements
  - Users can only view, insert, and manage their own logs

  ### ai_recommendations
  - Users can only view their own recommendations
  - System can insert recommendations for any user

  ## Indexes

  Performance indexes are created on:
  - Foreign key columns for efficient joins
  - Date columns for time-based queries
  - Barcode column for quick food lookups
*/

-- Create users_profiles table
CREATE TABLE IF NOT EXISTS users_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  goal_type text NOT NULL DEFAULT 'maintenance' CHECK (goal_type IN ('weight_loss', 'muscle_gain', 'maintenance')),
  daily_calorie_target integer NOT NULL DEFAULT 2000,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create food_items table
CREATE TABLE IF NOT EXISTS food_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  calories numeric NOT NULL DEFAULT 0,
  protein numeric NOT NULL DEFAULT 0,
  carbs numeric NOT NULL DEFAULT 0,
  fats numeric NOT NULL DEFAULT 0,
  barcode text UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view food items"
  ON food_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can add food items"
  ON food_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for barcode lookup
CREATE INDEX IF NOT EXISTS idx_food_items_barcode ON food_items(barcode);

-- Create meal_logs table
CREATE TABLE IF NOT EXISTS meal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id uuid NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  servings numeric NOT NULL DEFAULT 1,
  category text NOT NULL CHECK (category IN ('breakfast', 'lunch', 'dinner', 'snack')),
  logged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal logs"
  ON meal_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal logs"
  ON meal_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal logs"
  ON meal_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal logs"
  ON meal_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for meal_logs
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_id ON meal_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_logs_logged_at ON meal_logs(logged_at);

-- Create weight_logs table
CREATE TABLE IF NOT EXISTS weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight numeric NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weight logs"
  ON weight_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight logs"
  ON weight_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weight logs"
  ON weight_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weight logs"
  ON weight_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for weight_logs
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_id ON weight_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_logs_date ON weight_logs(date);

-- Create measurements table
CREATE TABLE IF NOT EXISTS measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  waist numeric,
  chest numeric,
  arms numeric,
  hips numeric,
  thighs numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own measurements"
  ON measurements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own measurements"
  ON measurements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own measurements"
  ON measurements FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own measurements"
  ON measurements FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for measurements
CREATE INDEX IF NOT EXISTS idx_measurements_user_id ON measurements(user_id);
CREATE INDEX IF NOT EXISTS idx_measurements_date ON measurements(date);

-- Create ai_recommendations table
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_text text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendations"
  ON ai_recommendations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert recommendations"
  ON ai_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for ai_recommendations
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_id ON ai_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_date ON ai_recommendations(date);

-- Insert sample food items
INSERT INTO food_items (name, calories, protein, carbs, fats, barcode) VALUES
  ('Chicken Breast', 165, 31, 0, 3.6, '1234567890001'),
  ('Brown Rice', 216, 5, 45, 1.8, '1234567890002'),
  ('Broccoli', 55, 3.7, 11.2, 0.6, '1234567890003'),
  ('Salmon', 206, 22, 0, 13, '1234567890004'),
  ('Banana', 105, 1.3, 27, 0.4, '1234567890005'),
  ('Greek Yogurt', 100, 10, 3.6, 4, '1234567890006'),
  ('Eggs', 155, 13, 1.1, 11, '1234567890007'),
  ('Oatmeal', 158, 6, 28, 3, '1234567890008'),
  ('Almonds', 164, 6, 6, 14, '1234567890009'),
  ('Sweet Potato', 112, 2, 26, 0.1, '1234567890010')
ON CONFLICT (barcode) DO NOTHING;