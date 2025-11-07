import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, WeightLog } from '../lib/supabase';
import { Plus, Trash2, Scale } from 'lucide-react';

export function WeightTracking() {
  const { user } = useAuth();
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWeightLogs();
  }, []);

  const loadWeightLogs = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(30);

    if (data) setWeightLogs(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('weight_logs').insert({
        user_id: user.id,
        weight: parseFloat(weight),
        date,
      });

      if (error) throw error;

      setWeight('');
      setDate(new Date().toISOString().split('T')[0]);
      await loadWeightLogs();
    } catch (error) {
      console.error('Error logging weight:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('weight_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadWeightLogs();
    } catch (error) {
      console.error('Error deleting weight log:', error);
    }
  };

  const weightChange = weightLogs.length >= 2
    ? weightLogs[0].weight - weightLogs[weightLogs.length - 1].weight
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Scale className="w-6 h-6 mr-2 text-green-600" />
          Log Weight
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              step="0.1"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="70.5"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            {loading ? 'Logging...' : 'Log Weight'}
          </button>
        </form>

        {weightLogs.length >= 2 && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Progress</h3>
            <p className="text-2xl font-bold text-gray-900">
              {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
            </p>
            <p className="text-sm text-gray-600">Since first log</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Weight History</h2>

        {weightLogs.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No weight logs yet</p>
        ) : (
          <div className="space-y-3">
            {weightLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div>
                  <p className="text-2xl font-bold text-gray-900">{log.weight} kg</p>
                  <p className="text-sm text-gray-600">
                    {new Date(log.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(log.id)}
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
