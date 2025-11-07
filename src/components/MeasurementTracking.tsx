import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Measurement } from '../lib/supabase';
import { Plus, Trash2, Ruler } from 'lucide-react';

export function MeasurementTracking() {
  const { user } = useAuth();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    waist: '',
    chest: '',
    arms: '',
    hips: '',
    thighs: '',
  });

  useEffect(() => {
    loadMeasurements();
  }, []);

  const loadMeasurements = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('measurements')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(30);

    if (data) setMeasurements(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('measurements').insert({
        user_id: user.id,
        date: formData.date,
        waist: formData.waist ? parseFloat(formData.waist) : null,
        chest: formData.chest ? parseFloat(formData.chest) : null,
        arms: formData.arms ? parseFloat(formData.arms) : null,
        hips: formData.hips ? parseFloat(formData.hips) : null,
        thighs: formData.thighs ? parseFloat(formData.thighs) : null,
      });

      if (error) throw error;

      setFormData({
        date: new Date().toISOString().split('T')[0],
        waist: '',
        chest: '',
        arms: '',
        hips: '',
        thighs: '',
      });
      await loadMeasurements();
    } catch (error) {
      console.error('Error logging measurements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('measurements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadMeasurements();
    } catch (error) {
      console.error('Error deleting measurement:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Ruler className="w-6 h-6 mr-2 text-yellow-600" />
          Log Measurements
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Waist (cm)</label>
              <input
                type="number"
                value={formData.waist}
                onChange={(e) => setFormData({ ...formData, waist: e.target.value })}
                step="0.1"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="75.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chest (cm)</label>
              <input
                type="number"
                value={formData.chest}
                onChange={(e) => setFormData({ ...formData, chest: e.target.value })}
                step="0.1"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="95.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Arms (cm)</label>
              <input
                type="number"
                value={formData.arms}
                onChange={(e) => setFormData({ ...formData, arms: e.target.value })}
                step="0.1"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="30.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hips (cm)</label>
              <input
                type="number"
                value={formData.hips}
                onChange={(e) => setFormData({ ...formData, hips: e.target.value })}
                step="0.1"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="90.0"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Thighs (cm)</label>
              <input
                type="number"
                value={formData.thighs}
                onChange={(e) => setFormData({ ...formData, thighs: e.target.value })}
                step="0.1"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="55.0"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-600 text-white py-3 rounded-lg font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            {loading ? 'Logging...' : 'Log Measurements'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Measurement History</h2>

        {measurements.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No measurements logged yet</p>
        ) : (
          <div className="space-y-3">
            {measurements.map((measurement) => (
              <div
                key={measurement.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium text-gray-900">
                    {new Date(measurement.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <button
                    onClick={() => handleDelete(measurement.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {measurement.waist && (
                    <div>
                      <p className="text-gray-600">Waist</p>
                      <p className="font-medium">{measurement.waist} cm</p>
                    </div>
                  )}
                  {measurement.chest && (
                    <div>
                      <p className="text-gray-600">Chest</p>
                      <p className="font-medium">{measurement.chest} cm</p>
                    </div>
                  )}
                  {measurement.arms && (
                    <div>
                      <p className="text-gray-600">Arms</p>
                      <p className="font-medium">{measurement.arms} cm</p>
                    </div>
                  )}
                  {measurement.hips && (
                    <div>
                      <p className="text-gray-600">Hips</p>
                      <p className="font-medium">{measurement.hips} cm</p>
                    </div>
                  )}
                  {measurement.thighs && (
                    <div>
                      <p className="text-gray-600">Thighs</p>
                      <p className="font-medium">{measurement.thighs} cm</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
