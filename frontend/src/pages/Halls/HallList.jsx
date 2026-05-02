import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Building2,
  Eye,
  Users,
  Calendar
} from 'lucide-react';
import hallService from '../../services/hallService';
import { Spinner } from '../../components/UI';

const HallList = () => {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingHall, setEditingHall] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    capacity: '',
    pricePerHour: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchHalls();
  }, []);

  const fetchHalls = async () => {
    try {
      setLoading(true);
      const response = await hallService.getHalls({ search, includeInactive: true });
      setHalls(response.data);
    } catch (err) {
      toast.error('Failed to fetch halls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => fetchHalls(), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const openCreateModal = () => {
    setEditingHall(null);
    setFormData({ name: '', code: '', capacity: '', pricePerHour: '' });
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (hall) => {
    setEditingHall(hall);
    setFormData({
      name: hall.name,
      code: hall.code,
      capacity: hall.capacity.toString(),
      pricePerHour: hall.pricePerHour?.toString() || '0'
    });
    setFormErrors({});
    setShowModal(true);
  };

  const openScheduleModal = async (hall) => {
    try {
      const response = await hallService.getHallSchedule(hall._id);
      setScheduleData(response.data);
      setShowScheduleModal(true);
    } catch (err) {
      toast.error('Failed to load hall schedule');
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.code.trim()) errors.code = 'Code is required';
    if (!formData.capacity || parseInt(formData.capacity) < 1) errors.capacity = 'Valid capacity is required';
    if (!formData.pricePerHour || parseFloat(formData.pricePerHour) < 0) errors.pricePerHour = 'Valid price per hour is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      const payload = {
        ...formData,
        capacity: parseInt(formData.capacity)
      };

      if (editingHall) {
        await hallService.updateHall(editingHall._id, payload);
        toast.success('Hall updated successfully');
      } else {
        await hallService.createHall(payload);
        toast.success('Hall created successfully');
      }

      setShowModal(false);
      fetchHalls();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save hall');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (hallId) => {
    try {
      await hallService.deleteHall(hallId);
      toast.success('Hall deleted successfully');
      setShowDeleteConfirm(null);
      fetchHalls();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete hall');
    }
  };

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Hall Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage institute halls and rooms</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Add Hall
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search halls..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-10"
          />
        </div>
      </div>

      {/* Hall Cards */}
      {halls.length === 0 ? (
        <div className="card text-center py-12">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50">No halls found</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Create your first hall to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {halls.map((hall) => (
            <div key={hall._id} className={`card hover:shadow-md transition-shadow ${!hall.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${hall.isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <Building2 className={`w-5 h-5 ${hall.isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{hall.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{hall.code}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  hall.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {hall.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Users className="w-4 h-4" />
                <span>Capacity: {hall.capacity}</span>
              </div>

              <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mt-2">
                <span className="text-gray-500 font-normal text-xs uppercase tracking-wider">Price:</span>
                <span>LKR {hall.pricePerHour?.toLocaleString()} / hour</span>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => openScheduleModal(hall)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  title="View Schedule"
                >
                  <Calendar className="w-4 h-4" />
                  Schedule
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => openEditModal(hall)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(hall._id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{editingHall ? 'Edit Hall' : 'Add New Hall'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="form-label">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`form-input ${formErrors.name ? 'border-red-500' : ''}`}
                  placeholder="e.g., Main Hall"
                />
                {formErrors.name && <p className="form-error">{formErrors.name}</p>}
              </div>
              <div>
                <label className="form-label">Code <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className={`form-input ${formErrors.code ? 'border-red-500' : ''}`}
                  placeholder="e.g., HALL-A1"
                />
                {formErrors.code && <p className="form-error">{formErrors.code}</p>}
              </div>
              <div>
                <label className="form-label">Capacity <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className={`form-input ${formErrors.capacity ? 'border-red-500' : ''}`}
                  placeholder="e.g., 30"
                  min="1"
                />
                {formErrors.capacity && <p className="form-error">{formErrors.capacity}</p>}
              </div>
              <div>
                <label className="form-label">Price Per Hour (LKR) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={formData.pricePerHour}
                  onChange={(e) => setFormData({ ...formData, pricePerHour: e.target.value })}
                  className="form-input"
                  placeholder="e.g., 1000"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-50">
                  {saving ? <><Spinner size="sm" /> Saving...</> : (editingHall ? 'Update Hall' : 'Create Hall')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Hall</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Are you sure you want to deactivate this hall? This action cannot be undone if classes are scheduled.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={() => handleDelete(showDeleteConfirm)} className="btn bg-red-600 text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && scheduleData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{scheduleData.hall.name} Schedule</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Code: {scheduleData.hall.code} · Capacity: {scheduleData.hall.capacity}</p>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {DAYS.map((day) => {
                const dayClasses = scheduleData.schedule[day] || [];
                if (dayClasses.length === 0) return null;
                return (
                  <div key={day} className="mb-4">
                    <h3 className="font-medium text-gray-700 mb-2">{day}</h3>
                    <div className="space-y-2">
                      {dayClasses.map((cls) => (
                        <div key={cls._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{cls.className}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{cls.subject} · {cls.classType} · {cls.teacher}</p>
                          </div>
                          <span className="text-sm text-gray-600">{cls.startTime} - {cls.endTime}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {DAYS.every((day) => (scheduleData.schedule[day] || []).length === 0) && (
                <p className="text-center text-gray-500 py-8">No classes scheduled in this hall</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HallList;





