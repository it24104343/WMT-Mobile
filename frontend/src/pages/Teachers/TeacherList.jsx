import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Plus,
  Edit2,
  Trash2,
  User,
  Mail,
  Phone,
  BookOpen,
  Search,
  X,
  ChevronRight,
  CheckCircle,
  DollarSign,
  Download
} from 'lucide-react';
import teacherService from '../../services/teacherService';
import {
  LoadingOverlay,
  ErrorMessage,
  Pagination,
  ConfirmDialog,
  Spinner,
  EmptyState
} from '../../components/UI';

const initialFormState = {
  name: '',
  email: '',
  phone: '',
  subjects: [],
  registrationFee: '',
  paymentOption: 'PAY_NOW'
};

const TeacherList = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  // Search & Pagination
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Inline form
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [subjectInput, setSubjectInput] = useState('');
  const [exporting, setExporting] = useState(false);

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, teacher: null });

  useEffect(() => {
    fetchTeachers();
  }, [page, search]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await teacherService.getTeachers({
        page,
        limit: 10,
        search: search || undefined
      });
      setTeachers(response.data);
      setPagination(response.pagination);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await teacherService.exportTeachers({
        search: search || undefined
      });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `teachers_export_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click(); link.remove();
      toast.success('Export downloaded');
    } catch {
      toast.error('Failed to export teachers');
    } finally {
      setExporting(false);
    }
  };

  const openAddForm = () => {
    setEditingTeacher(null);
    setFormData(initialFormState);
    setFormErrors({});
    setSubjectInput('');
    setShowForm(true);
  };

  const openEditForm = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone || '',
      subjects: teacher.subjects || [],
      registrationFee: teacher.registrationFee || '',
      paymentOption: teacher.paymentOption || 'PAY_NOW'
    });
    setFormErrors({});
    setSubjectInput('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTeacher(null);
    setFormData(initialFormState);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (formData.phone && !/^\d{10}$/.test(formData.phone.trim())) {
      errors.phone = 'Phone number must be exactly 10 digits';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      if (editingTeacher) {
        await teacherService.updateTeacher(editingTeacher._id, formData);
        toast.success('Teacher updated successfully');
      } else {
        await teacherService.createTeacher(formData);
        toast.success('Teacher created — credentials sent via email');
      }
      closeForm();
      fetchTeachers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save teacher');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.teacher) return;
    try {
      await teacherService.deleteTeacher(deleteDialog.teacher._id);
      toast.success('Teacher deleted successfully');
      fetchTeachers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete teacher');
    }
  };

  const addSubject = () => {
    if (subjectInput.trim() && !formData.subjects.includes(subjectInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        subjects: [...prev.subjects, subjectInput.trim()]
      }));
      setSubjectInput('');
    }
  };

  const removeSubject = (subject) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s !== subject)
    }));
  };

  if (loading && teachers.length === 0) {
    return <LoadingOverlay message="Loading teachers..." />;
  }

  if (error && teachers.length === 0) {
    return <ErrorMessage message={error} onRetry={fetchTeachers} />;
  }

  return (
    <div className={`grid gap-6 ${showForm ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>

      {/* ── LEFT: Teacher List ── */}
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Teachers</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {pagination.totalItems} teacher{pagination.totalItems !== 1 ? 's' : ''} in total
            </p>
          </div>
          {!showForm && (
            <div className="flex items-center gap-3">
              <button onClick={handleExport} disabled={exporting} className="btn btn-secondary flex items-center gap-2">
                {exporting ? <Spinner size="sm" /> : <Download className="w-5 h-5" />} Export CSV
              </button>
              <button onClick={openAddForm} className="btn btn-primary">
                <Plus className="w-5 h-5" />
                Add Teacher
              </button>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="card mb-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search teachers..."
              className="form-input pl-10"
            />
          </div>
        </div>

        {/* Table */}
        {teachers.length === 0 ? (
          <div className="card">
            <EmptyState
              title="No teachers found"
              description={search ? 'Try adjusting your search' : 'Get started by adding your first teacher'}
              action={
                !search && (
                  <button onClick={openAddForm} className="btn btn-primary">
                    <Plus className="w-5 h-5" />
                    Add Teacher
                  </button>
                )
              }
            />
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Subjects</th>
                    <th>Payment</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher) => (
                    <tr
                      key={teacher._id}
                      className={editingTeacher?._id === teacher._id ? 'bg-primary-50' : ''}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-primary-600" />
                          </div>
                          <span className="font-medium text-gray-900 dark:text-gray-50">{teacher.name}</span>
                        </div>
                      </td>
                      <td>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                            <Mail className="w-3.5 h-3.5" />
                            {teacher.email}
                          </div>
                          {teacher.phone && (
                            <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                              <Phone className="w-3 h-3" />
                              {teacher.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {teacher.subjects && teacher.subjects.length > 0 ? (
                            teacher.subjects.slice(0, 2).map((subject) => (
                              <span
                                key={subject}
                                className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
                              >
                                {subject}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                          {teacher.subjects && teacher.subjects.length > 2 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                              +{teacher.subjects.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit ${
                            teacher.registrationPaymentStatus === 'COMPLETED' 
                              ? 'bg-green-100 text-green-700' 
                              : teacher.registrationPaymentStatus === 'PENDING' 
                                ? 'bg-amber-100 text-amber-700' 
                                : 'bg-gray-100 text-gray-500'
                          }`}>
                            {teacher.registrationPaymentStatus || 'N/A'}
                          </span>
                          {teacher.registrationPaymentStatus === 'PENDING' && (
                            <button
                              onClick={async () => {
                                try {
                                  await teacherService.confirmTeacherPayment(teacher._id);
                                  toast.success('Payment confirmed');
                                  fetchTeachers();
                                } catch (err) {
                                  toast.error('Failed to confirm payment');
                                }
                              }}
                              className="text-[10px] font-bold text-primary-600 hover:text-primary-700 underline text-left"
                            >
                              Mark as Paid
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditForm(teacher)}
                            className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteDialog({ isOpen: true, teacher })}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {/* ── RIGHT: Inline Add / Edit Form ── */}
      {showForm && (
        <div className="lg:sticky lg:top-6 h-fit">
          <div className="card">
            {/* Form header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <ChevronRight className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
                </h2>
              </div>
              <button
                onClick={closeForm}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="form-label">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`form-input ${formErrors.name ? 'border-red-500' : ''}`}
                  placeholder="Enter teacher name"
                />
                {formErrors.name && <p className="form-error">{formErrors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="form-label">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`form-input ${formErrors.email ? 'border-red-500' : ''}`}
                  placeholder="Enter email address"
                />
                {formErrors.email && <p className="form-error">{formErrors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="form-label">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="form-input"
                  placeholder="Enter phone number"
                />
              </div>

              {/* Subjects */}
              <div>
                <label className="form-label">Subjects</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubject())}
                    className="form-input flex-1"
                    placeholder="Add a subject and press Enter"
                  />
                  <button type="button" onClick={addSubject} className="btn btn-secondary">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.subjects.map((subject) => (
                    <span
                      key={subject}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full"
                    >
                      <BookOpen className="w-3 h-3" />
                      {subject}
                      <button
                        type="button"
                        onClick={() => removeSubject(subject)}
                        className="ml-1 text-primary-500 hover:text-primary-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Payment Section */}
              <div className="bg-gray-50 p-4 rounded-xl space-y-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-primary-600" />
                  <span className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Registration Payment</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label text-xs uppercase text-gray-500 font-bold mb-1.5">Fee (LKR)</label>
                    <input
                      type="number"
                      value={formData.registrationFee}
                      onChange={(e) => setFormData({ ...formData, registrationFee: e.target.value })}
                      className="form-input"
                      placeholder="e.g. 1000"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="form-label text-xs uppercase text-gray-500 font-bold mb-1.5">Payment Way</label>
                    <select
                      value={formData.paymentOption}
                      onChange={(e) => setFormData({ ...formData, paymentOption: e.target.value })}
                      className="form-input"
                    >
                      <option value="PAY_NOW">Pay Now</option>
                      <option value="PAY_LATER">Pay Later</option>
                    </select>
                  </div>
                </div>
                
                {!editingTeacher && (
                  <div className="text-[11px] text-gray-500 flex items-start gap-1.5 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1 flex-shrink-0" />
                    <span>
                      {formData.paymentOption === 'PAY_NOW' 
                        ? 'Teacher pays admin manually. Admin marks as paid after receiving.' 
                        : 'Teacher will be shown a payment page after their first-time password reset.'}
                    </span>
                  </div>
                )}
              </div>

              {!editingTeacher && (
                <div className="bg-blue-50/50 text-blue-700 text-xs p-3 rounded-lg border border-blue-100/50">
                  A username and temporary password will be generated and emailed to the teacher.
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                  {saving ? (
                    <><Spinner size="sm" /> Saving...</>
                  ) : editingTeacher ? (
                    'Update Teacher'
                  ) : (
                    'Add Teacher'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, teacher: null })}
        onConfirm={handleDelete}
        title="Delete Teacher"
        message={`Are you sure you want to delete "${deleteDialog.teacher?.name}"? This will also remove their login account.`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};

export default TeacherList;



