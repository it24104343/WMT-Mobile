import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  Users,
  Clock,
  Filter,
  UserCheck,
  UserX,
  UserPlus
} from 'lucide-react';
import classService from '../../services/classService';
import api from '../../services/api';
import {
  LoadingOverlay,
  ErrorMessage,
  Pagination,
  ConfirmDialog,
  Badge,
  EmptyState
} from '../../components/UI';
import { useAuth } from '../../context/AuthContext';

const ClassList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  // Filters
  const [filterOptions, setFilterOptions] = useState({ grades: [], subjects: [], classTypes: [], modes: [] });
  const [filters, setFilters] = useState({
    grade: '',
    subject: '',
    classType: '',
    mode: '',
    targetMonthYear: '',
    page: 1,
    limit: 10
  });

  const getTargetMonthOptions = () => {
    const options = [];
    const now = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    for (let i = -6; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      options.push({
        value: `${months[d.getMonth()]}-${d.getFullYear()}`,
        label: `${months[d.getMonth()]} ${d.getFullYear()}`
      });
    }
    return options;
  };

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    classId: null,
    className: ''
  });

  // Assign Teacher Modal
  const [assignModal, setAssignModal] = useState({
    isOpen: false,
    classId: null,
    className: '',
    currentTeacherId: null
  });
  const [allTeachers, setAllTeachers] = useState([]);
  const [fetchingTeachers, setFetchingTeachers] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchFilterOptions();
  }, [filters.page, filters.grade, filters.subject, filters.classType, filters.mode, filters.targetMonthYear]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      
      let targetMonth, targetYear;
      if (filters.targetMonthYear) {
        const parts = filters.targetMonthYear.split('-');
        targetMonth = parts[0];
        targetYear = parseInt(parts[1], 10);
      }

      const response = await classService.getClasses({
        page: filters.page,
        limit: filters.limit,
        grade: filters.grade || undefined,
        subject: filters.subject || undefined,
        classType: filters.classType || undefined,
        mode: filters.mode || undefined,
        targetMonth: targetMonth || undefined,
        targetYear: targetYear || undefined,
        teacher: isTeacher ? user.profileId : undefined
      });
      setClasses(response.data);
      setPagination(response.pagination);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await classService.getFilterOptions();
      setFilterOptions(response.data);
    } catch (err) {
      console.error('Failed to fetch filter options:', err);
    }
  };

  const fetchAllTeachers = async () => {
    try {
      setFetchingTeachers(true);
      const response = await api.get('/teachers?limit=100');
      setAllTeachers(response.data);
    } catch (err) {
      toast.error('Failed to load teachers list');
    } finally {
      setFetchingTeachers(false);
    }
  };

  const handleDelete = async () => {
    try {
      await classService.deleteClass(deleteDialog.classId);
      toast.success('Class deleted successfully');
      fetchClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete class');
    }
  };

  const handleToggleEnrollment = async (classId, currentValue) => {
    try {
      const r = await classService.toggleManualEnrollment(classId);
      toast.success(r.message || `Manual enrollment ${!currentValue ? 'enabled' : 'disabled'}`);
      setClasses(prev => prev.map(c => c._id === classId ? { ...c, allowManualEnrollment: !currentValue } : c));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle enrollment');
    }
  };

  const handleAssignTeacher = async (teacherId) => {
    try {
      await classService.assignTeacher(assignModal.classId, teacherId);
      toast.success(teacherId ? 'Teacher assigned successfully' : 'Teacher removed');
      setAssignModal({ ...assignModal, isOpen: false });
      fetchClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign teacher');
    }
  };

  const openAssignModal = (cls) => {
    setAssignModal({
      isOpen: true,
      classId: cls._id,
      className: cls.className,
      currentTeacherId: cls.teacher?._id
    });
    if (allTeachers.length === 0) {
      fetchAllTeachers();
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filter changes
    }));
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const getCapacityBadge = (enrolled, capacity) => {
    const percentage = (enrolled / capacity) * 100;
    if (percentage >= 100) return <Badge variant="danger">Full</Badge>;
    if (percentage >= 80) return <Badge variant="warning">Almost Full</Badge>;
    return <Badge variant="success">Available</Badge>;
  };

  if (loading && classes.length === 0) {
    return <LoadingOverlay message="Loading classes..." />;
  }

  if (error && classes.length === 0) {
    return <ErrorMessage message={error} onRetry={fetchClasses} />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Classes</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isStudent ? 'Browse and enroll in tuition classes' : 'Manage your tuition classes'}
          </p>
        </div>
        {isAdmin && (
          <Link to="/classes/new" className="btn btn-primary">
            <Plus className="w-5 h-5" />
            Add Class
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-6 overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-2 min-w-max">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Filters:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 flex-1">
            <select
              value={filters.grade}
              onChange={(e) => handleFilterChange('grade', e.target.value)}
              className="form-input w-full sm:w-auto min-w-[140px]"
            >
              <option value="">All Grades</option>
              {filterOptions.grades.map((grade) => (
                <option key={grade} value={grade}>
                  Grade {grade}
                </option>
              ))}
            </select>

            <select
              value={filters.subject}
              onChange={(e) => handleFilterChange('subject', e.target.value)}
              className="form-input w-full sm:w-auto min-w-[160px]"
            >
              <option value="">All Subjects</option>
              {filterOptions.subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>

            <select
              value={filters.classType}
              onChange={(e) => handleFilterChange('classType', e.target.value)}
              className="form-input w-full sm:w-auto min-w-[130px]"
            >
              <option value="">All Types</option>
              <option value="THEORY">Theory</option>
              <option value="PAPER">Paper</option>
              <option value="REVISION">Revision</option>
            </select>

            <select
              value={filters.mode}
              onChange={(e) => handleFilterChange('mode', e.target.value)}
              className="form-input w-full sm:w-auto min-w-[130px]"
            >
              <option value="">All Modes</option>
              <option value="PHYSICAL">Physical</option>
              <option value="ONLINE">Online</option>
            </select>

            {/* Target Month Filter */}
            <select
              className="form-input bg-white w-full sm:w-auto min-w-[160px]"
              value={filters.targetMonthYear}
              onChange={(e) => handleFilterChange('targetMonthYear', e.target.value)}
            >
              <option value="">All Months</option>
              {getTargetMonthOptions().map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {(filters.grade || filters.subject || filters.classType || filters.mode || filters.targetMonthYear) && (
              <button
                onClick={() => setFilters({ ...filters, grade: '', subject: '', classType: '', mode: '', targetMonthYear: '', page: 1 })}
                className="text-sm font-medium text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      {classes.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No classes found"
            description={
              filters.grade || filters.subject
                ? 'Try adjusting your filters'
                : 'Get started by creating your first class'
            }
            action={
              !filters.grade && !filters.subject && (
                <Link to="/classes/new" className="btn btn-primary">
                  <Plus className="w-5 h-5" />
                  Add Class
                </Link>
              )
            }
          />
        </div>
      ) : (
        <>
          <div className="table-container overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="min-w-[200px]">Class Name</th>
                  <th>Type / Mode</th>
                  <th className="min-w-[120px]">Subject</th>
                  <th>Grade</th>
                  <th className="min-w-[150px]">Teacher</th>
                  <th className="min-w-[140px]">Schedule</th>
                  <th>Fee</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Enrollment</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((cls) => (
                  <tr key={cls._id}>
                    <td className="whitespace-normal break-words">
                      <Link to={`/class/${cls._id}`} className="font-semibold text-primary-600 hover:text-primary-700 hover:underline leading-snug block mb-1">
                        {cls.className} {cls.targetMonth ? `- ${cls.targetMonth} ${cls.targetYear}` : ''}
                      </Link>
                      {cls.hall ? (
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{cls.hall.name}</div>
                      ) : cls.classroom ? (
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{cls.classroom}</div>
                      ) : null}
                    </td>
                    <td>
                      <Badge variant={cls.classType === 'THEORY' ? 'primary' : cls.classType === 'PAPER' ? 'warning' : 'info'}>{cls.classType}</Badge>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{cls.mode}</div>
                    </td>
                    <td>{cls.subject}</td>
                    <td>Grade {cls.grade}</td>
                    <td className="whitespace-normal">
                      <div className="flex items-center gap-2 group">
                        {cls.teacher ? (
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-gray-50">{cls.teacher.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px]" title={cls.teacher.email}>{cls.teacher.email}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic flex-1">Unassigned</span>
                        )}
                        {!isTeacher && (
                          <button 
                            onClick={() => openAssignModal(cls)}
                            className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                            title="Assign/Change Teacher"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-normal">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                        <Clock className="w-3.5 h-3.5 text-primary-500" />
                        <span>{cls.dayOfWeek}</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {cls.startTime} - {cls.endTime}
                      </div>
                    </td>
                    <td className="text-sm font-medium">
                      {cls.monthlyFee != null ? `LKR ${cls.monthlyFee.toLocaleString()}` : '-'}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{cls.enrolledCount}</span>
                        <span className="text-gray-400">/ {cls.capacity}</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {cls.remainingSeats} seats left
                      </div>
                    </td>
                    <td>
                      {getCapacityBadge(cls.enrolledCount, cls.capacity)}
                    </td>
                    <td>
                      {isAdmin ? (
                        <button
                          onClick={() => handleToggleEnrollment(cls._id, cls.allowManualEnrollment)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            cls.allowManualEnrollment !== false
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                          title={cls.allowManualEnrollment !== false ? 'Manual enrollment is ON — click to disable' : 'Manual enrollment is OFF — click to enable'}
                        >
                          {cls.allowManualEnrollment !== false
                            ? <><UserCheck className="w-3.5 h-3.5" /> Open</>
                            : <><UserX className="w-3.5 h-3.5" /> Closed</>}
                        </button>
                      ) : (
                        <Badge variant={cls.allowManualEnrollment !== false ? 'success' : 'danger'}>
                          {cls.allowManualEnrollment !== false ? 'Open' : 'Closed'}
                        </Badge>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/classes/${cls._id}`)}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => navigate(`/classes/${cls._id}/edit`)}
                            className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() =>
                              setDeleteDialog({
                                isOpen: true,
                                classId: cls._id,
                                className: cls.className
                              })
                            }
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
            onPageChange={handlePageChange}
          />

          <div className="text-center text-sm text-gray-500 mt-4">
            Showing {classes.length} of {pagination.totalItems} classes
          </div>
        </>
      )}

      {/* Teacher Assignment Modal */}
      {assignModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-primary-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Assign Teacher</h3>
                <p className="text-xs font-medium text-primary-600 mt-0.5">{assignModal.className}</p>
              </div>
              <button 
                onClick={() => setAssignModal({ ...assignModal, isOpen: false })}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {/* Unassign option */}
                <button
                  onClick={() => handleAssignTeacher(null)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${
                    !assignModal.currentTeacherId 
                      ? 'border-primary-500 bg-primary-50/50' 
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <UserX className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">Unassigned</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">No teacher for this class</div>
                    </div>
                  </div>
                  {!assignModal.currentTeacherId && <div className="w-2.5 h-2.5 rounded-full bg-primary-500 shadow-sm" />}
                </button>

                <div className="py-2 flex items-center gap-3">
                  <div className="h-px bg-gray-100 flex-1" />
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Available Techers</span>
                  <div className="h-px bg-gray-100 flex-1" />
                </div>

                {fetchingTeachers ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <Spinner size="lg" />
                    <p className="text-sm font-medium text-gray-400">Loading your teachers...</p>
                  </div>
                ) : allTeachers.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 italic text-sm">No teachers found in the system</div>
                ) : (
                  allTeachers.map((t) => (
                    <button
                      key={t._id}
                      onClick={() => handleAssignTeacher(t._id)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${
                        assignModal.currentTeacherId === t._id 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-transparent hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{t.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px] font-medium">{t.subjects.join(', ') || 'No subjects'}</div>
                        </div>
                      </div>
                      {assignModal.currentTeacherId === t._id && <div className="w-2.5 h-2.5 rounded-full bg-primary-500 shadow-sm" />}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, classId: null, className: '' })}
        onConfirm={handleDelete}
        title="Delete Class"
        message={`Are you sure you want to delete "${deleteDialog.className}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
};

export default ClassList;




