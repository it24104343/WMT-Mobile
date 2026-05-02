import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Plus,
  Edit2,
  Trash2,
  User,
  Mail,
  Phone,
  Search,
  GraduationCap,
  Users,
  Download
} from 'lucide-react';
import {
  LoadingOverlay,
  ErrorMessage,
  Pagination,
  ConfirmDialog,
  Modal,
  EmptyState,
  Spinner,
  Badge
} from '../../components/UI';
import studentService from '../../services/studentService';
import classService from '../../services/classService';

import { useAuth } from '../../context/AuthContext';

const initialFormState = {
  name: '',
  email: '',
  phone: '',
  grade: '',
  parentName: '',
  parentPhone: '',
  paymentOption: 'now',
  isPaid: true
};

const StudentList = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  // Search & Filters
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [grades, setGrades] = useState([]);
  const [classFilter, setClassFilter] = useState('');
  const [classesList, setClassesList] = useState([]);
  const [page, setPage] = useState(1);

  // Form modal
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, student: null });

  // Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [studentForPayment, setStudentForPayment] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({ amount: '', method: 'CASH', notes: '' });
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [page, search, gradeFilter, classFilter]);

  useEffect(() => {
    fetchGrades();
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentService.getStudents({
        page,
        limit: 10,
        search: search || undefined,
        grade: gradeFilter || undefined,
        classId: classFilter || undefined
      });
      setStudents(response.data);
      setPagination(response.pagination);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await studentService.exportStudents({
        search: search || undefined,
        grade: gradeFilter || undefined,
        classId: classFilter || undefined
      });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `students_export_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click(); link.remove();
      toast.success('Export downloaded');
    } catch { 
      toast.error('Failed to export students'); 
    } finally { 
      setExporting(false); 
    }
  };

  const fetchGrades = async () => {
    try {
      const response = await studentService.getGrades();
      setGrades(response.data);
    } catch (err) {
      console.error('Failed to fetch grades:', err);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await classService.getClasses({ limit: 1000 });
      setClassesList(response.data);
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    }
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setFormData(initialFormState);
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      phone: student.phone || '',
      grade: student.grade || '',
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || ''
    });
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStudent(null);
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
    
    if (formData.parentPhone && !/^\d{10}$/.test(formData.parentPhone.trim())) {
      errors.parentPhone = 'Parent phone must be exactly 10 digits';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      if (editingStudent) {
        await studentService.updateStudent(editingStudent._id, formData);
        toast.success('Student updated successfully');
        closeModal();
      } else {
        const response = await studentService.createStudent(formData);
        toast.success('Student created successfully');
        closeModal();
        if (formData.paymentOption === 'later') {
          setStudentForPayment(response.data);
          setShowPaymentModal(true);
        }
      }
      fetchStudents();
      fetchGrades();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save student');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.student) return;
    try {
      await studentService.deleteStudent(deleteDialog.student._id);
      toast.success('Student deleted successfully');
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete student');
    }
  };

  if (loading && students.length === 0) {
    return <LoadingOverlay message="Loading students..." />;
  }

  if (error && students.length === 0) {
    return <ErrorMessage message={error} onRetry={fetchStudents} />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 dark:text-gray-50">Students</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage students enrolled in your tuition classes</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button onClick={handleExport} disabled={exporting} className="btn btn-secondary flex items-center gap-2">
              {exporting ? <Spinner size="sm" /> : <Download className="w-5 h-5" />} Export CSV
            </button>
          )}
          {isAdmin && (
            <button onClick={openAddModal} className="btn btn-primary">
              <Plus className="w-5 h-5" />
              Add Student
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6 overflow-x-auto">
        <div className="flex items-center justify-between gap-4 min-w-[700px]">
          <div className="relative w-[300px] flex-shrink-0">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearch(searchInput);
                  setPage(1);
                }
              }}
              placeholder="Search students..."
              className="form-input pr-10"
            />
            <button
              onClick={() => {
                setSearch(searchInput);
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600 focus:outline-none"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3 ml-auto flex-nowrap whitespace-nowrap">
            <select
              value={gradeFilter}
              onChange={(e) => {
                setGradeFilter(e.target.value);
                setPage(1);
              }}
              className="form-input w-auto min-w-[150px]"
            >
              <option value="">All Grades</option>
              {grades.map((grade) => (
                <option key={grade} value={grade}>
                  Grade {grade}
                </option>
              ))}
            </select>

            <select
              value={classFilter}
              onChange={(e) => {
                setClassFilter(e.target.value);
                setPage(1);
              }}
              className="form-input w-auto min-w-[200px]"
            >
              <option value="">All Classes</option>
              {classesList.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.className} ({cls.subject})
                </option>
              ))}
            </select>

            {(search || gradeFilter || classFilter) && (
              <button
                onClick={() => {
                  setSearch('');
                  setSearchInput('');
                  setGradeFilter('');
                  setClassFilter('');
                  setPage(1);
                }}
                className="text-sm text-primary-600 hover:text-primary-700 px-2 flex-shrink-0"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      {students.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No students found"
            description={
              search || gradeFilter || classFilter
                ? 'Try adjusting your filters'
                : 'Get started by adding your first student'
            }
            action={
              !search &&
              !gradeFilter &&
              !classFilter && (
                <button onClick={openAddModal} className="btn btn-primary">
                  <Plus className="w-5 h-5" />
                  Add Student
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
                  <th>Email</th>
                  <th>Grade</th>
                  <th>Classes</th>
                  <th>Phone</th>
                  <th>Parent</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-50">{student.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        {student.email}
                      </div>
                    </td>
                    <td>
                      {student.grade ? (
                        <Badge variant="info">Grade {student.grade}</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="max-w-[200px]">
                      {student.enrolledClasses && student.enrolledClasses.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {student.enrolledClasses.map(cls => (
                            <span
                              key={cls._id}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                              title={`${cls.className} (${cls.subject})`}
                            >
                              {cls.className}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No classes</span>
                      )}
                    </td>
                    <td>
                      {student.phone ? (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          {student.phone}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td>
                      {student.parentName ? (
                        <div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <Users className="w-4 h-4" />
                            {student.parentName}
                          </div>
                          {student.parentPhone && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                              {student.parentPhone}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                      <td>
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin && !student.isRegistrationFeePaid && (
                          <button
                            onClick={() => {
                              setStudentForPayment(student);
                              setShowPaymentModal(true);
                            }}
                            className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg whitespace-nowrap"
                            title="Collect Registration Fee"
                          >
                            Pay Registration
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => openEditModal(student)}
                            className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => setDeleteDialog({ isOpen: true, student })}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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

          <div className="text-center text-sm text-gray-500 mt-4">
            Showing {students.length} of {pagination.totalItems} students
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingStudent ? 'Edit Student' : 'Add New Student'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`form-input ${formErrors.name ? 'border-red-500' : ''}`}
                placeholder="Enter student name"
              />
              {formErrors.name && <p className="form-error">{formErrors.name}</p>}
            </div>

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

            <div>
              <label className="form-label">Grade</label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="form-input"
              >
                <option value="">Select Grade</option>
                {[...Array(13)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Grade {i + 1}
                  </option>
                ))}
              </select>
            </div>

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

            <div>
              <label className="form-label">Parent Name</label>
              <input
                type="text"
                value={formData.parentName}
                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                className="form-input"
                placeholder="Enter parent/guardian name"
              />
            </div>

            <div>
              <label className="form-label">Parent Phone</label>
              <input
                type="text"
                value={formData.parentPhone}
                onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                className="form-input"
                placeholder="Enter parent phone number"
              />
            </div>

            {!editingStudent && (
              <div className="col-span-1 md:col-span-2 space-y-3 mt-2 pb-2 border-t pt-4 border-gray-100">
                <label className="form-label font-medium text-gray-900">Registration Payment</label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentOption"
                        value="now"
                        checked={formData.paymentOption === 'now'}
                        onChange={() => setFormData({ ...formData, paymentOption: 'now', isPaid: true })}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">Pay Now</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentOption"
                        value="later"
                        checked={formData.paymentOption === 'later'}
                        onChange={() => setFormData({ ...formData, paymentOption: 'later', isPaid: false })}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">Pay Later</span>
                    </label>
                  </div>
                  
                  {formData.paymentOption === 'now' && (
                    <div className="flex items-center gap-2 ml-1">
                      <input
                        type="checkbox"
                        id="isPaid"
                        checked={formData.isPaid}
                        onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="isPaid" className="text-sm text-gray-600">
                        Mark registration fee as paid
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={closeModal} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? (
                <>
                  <Spinner size="sm" />
                  Saving...
                </>
              ) : editingStudent ? (
                'Update Student'
              ) : (
                'Add Student'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Registration Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setStudentForPayment(null);
        }}
        title="Registration Fee Payment"
      >
        <div className="space-y-4 p-2">
          <p className="text-gray-600">
            Process registration fee payment for <span className="font-semibold text-gray-900">{studentForPayment?.name}</span>?
          </p>
          <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-lg border border-blue-100">
            Marking this as paid confirms the student has completed the institute registration payment.
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button
              onClick={() => {
                setShowPaymentModal(false);
                setStudentForPayment(null);
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                try {
                  setProcessingPayment(true);
                  await studentService.payRegistrationFee(studentForPayment._id);
                  toast.success('Registration fee marked as paid!');
                  setShowPaymentModal(false);
                  fetchStudents();
                } catch (err) {
                  toast.error(err.response?.data?.message || 'Failed to process payment');
                } finally {
                  setProcessingPayment(false);
                }
              }}
              disabled={processingPayment}
              className="btn btn-primary bg-green-600 hover:bg-green-700 border-green-600"
            >
              {processingPayment ? <Spinner size="sm" /> : 'Confirm Payment'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, student: null })}
        onConfirm={handleDelete}
        title="Delete Student"
        message={`Are you sure you want to delete "${deleteDialog.student?.name}"?`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};

export default StudentList;



