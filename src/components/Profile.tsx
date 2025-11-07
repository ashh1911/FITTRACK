import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, UserProfile } from '../lib/supabase';
import { User, Save } from 'lucide-react';

interface ProfileProps {
  profile: UserProfile | null;
  onProfileUpdated: () => void;
}

export function Profile({ profile, onProfileUpdated }: ProfileProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    goal_type: 'maintenance' as 'weight_loss' | 'muscle_gain' | 'maintenance',
    daily_calorie_target: 2000,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        goal_type: profile.goal_type,
        daily_calorie_target: profile.daily_calorie_target,
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users_profiles')
        .update({
          name: formData.name,
          goal_type: formData.goal_type,
          daily_calorie_target: formData.daily_calorie_target,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      onProfileUpdated();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
        <User className="w-6 h-6 mr-2 text-blue-600" />
        Profile Settings
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
          />
          <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fitness Goal</label>
          <select
            value={formData.goal_type}
            onChange={(e) =>
              setFormData({
                ...formData,
                goal_type: e.target.value as 'weight_loss' | 'muscle_gain' | 'maintenance',
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="weight_loss">Weight Loss</option>
            <option value="muscle_gain">Muscle Gain</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Daily Calorie Target (kcal)
          </label>
          <input
            type="number"
            value={formData.daily_calorie_target}
            onChange={(e) =>
              setFormData({ ...formData, daily_calorie_target: parseInt(e.target.value) })
            }
            min="1000"
            max="5000"
            step="50"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Adjust based on your fitness goal and activity level
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">Calorie Target Guidance</h3>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
            <li>Weight Loss: 500 cal deficit (typically 1500-1800 cal/day)</li>
            <li>Muscle Gain: 300-500 cal surplus (typically 2500-3000 cal/day)</li>
            <li>Maintenance: Match your daily energy expenditure</li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Save className="w-5 h-5 mr-2" />
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
