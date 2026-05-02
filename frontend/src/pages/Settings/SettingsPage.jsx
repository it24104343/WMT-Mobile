import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Settings, Save } from 'lucide-react';
import settingsService from '../../services/settingsService';
import { Spinner } from '../../components/UI';
import ThemeSwitcherComponent from '../../components/UI/ThemeSwitcherComponent';

const SettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    instituteName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    admissionFee: '',
    attendanceThresholdPercent: '',
    allowTeacherThresholdOverride: false
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsService.getSettings();
      const data = response.data;
      setSettings(data);
      setFormData({
        instituteName: data.instituteName || '',
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || '',
        address: data.address || '',
        admissionFee: data.admissionFee?.toString() || '0',
        attendanceThresholdPercent: data.attendanceThresholdPercent?.toString() || '75',
        allowTeacherThresholdOverride: data.allowTeacherThresholdOverride || false
      });
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.contactPhone && !/^\d{10}$/.test(formData.contactPhone.trim())) {
      toast.error('Contact Phone must be exactly 10 digits');
      return;
    }

    try {
      setSaving(true);
      await settingsService.updateSettings({
        ...formData,
        admissionFee: parseFloat(formData.admissionFee),
        attendanceThresholdPercent: parseFloat(formData.attendanceThresholdPercent)
      });
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
          <Settings className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Institute Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">Manage your institute configuration</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Institute Info */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Institute Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="form-label">Institute Name</label>
              <input
                type="text"
                name="instituteName"
                value={formData.instituteName}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., ABC Tuition Institute"
              />
            </div>
            <div>
              <label className="form-label">Contact Email</label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                className="form-input"
                placeholder="admin@institute.com"
              />
            </div>
            <div>
              <label className="form-label">Contact Phone</label>
              <input
                type="text"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                className="form-input"
                placeholder="+94 77 123 4567"
              />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="form-input"
                placeholder="Full address..."
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Fee Settings */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Fee Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Admission Fee (LKR)</label>
              <input
                type="number"
                name="admissionFee"
                value={formData.admissionFee}
                onChange={handleChange}
                className="form-input"
                min="0"
                step="0.01"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">One-time fee charged on enrollment</p>
            </div>
          </div>
        </div>

        {/* Attendance Settings */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Attendance Threshold (%)</label>
              <input
                type="number"
                name="attendanceThresholdPercent"
                value={formData.attendanceThresholdPercent}
                onChange={handleChange}
                className="form-input"
                min="0"
                max="100"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimum attendance required for exam eligibility</p>
            </div>
            <div className="flex items-start pt-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="allowTeacherThresholdOverride"
                  id="teacherOverride"
                  checked={formData.allowTeacherThresholdOverride}
                  onChange={handleChange}
                  className="rounded border-gray-300"
                />
                <label htmlFor="teacherOverride" className="text-sm text-gray-700">
                  Allow teachers to override attendance threshold
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="mb-6">
          <ThemeSwitcherComponent />
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary disabled:opacity-50"
          >
            {saving ? <><Spinner size="sm" /> Saving...</> : <><Save className="w-5 h-5" /> Save Settings</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;



