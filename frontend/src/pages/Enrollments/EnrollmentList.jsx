import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Plus,
  Search,
  UserPlus,
  UserMinus,
  Users,
  BookOpen,
  X,
  Clock,
  Shield
} from 'lucide-react';
import enrollmentService from '../../services/enrollmentService';
import classService from '../../services/classService';
import { Spinner } from '../../components/UI';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const EnrollmentList = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [enrollForm, setEnrollForm] = useState({ studentId: '', classId: '', payAdmissionFee: false, notes: '' });
  const [enrolling, setEnrolling] = useState(false);
  const [showUnenrollConfirm, setShowUnenrollConfirm] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER';

  useEffect(() => {
    fetchEnrollments();
  }, [pagination.currentPage]);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const response = await enrollmentService.getEnrollments({
        page: pagination.currentPage,
        limit: 20,
        teacher: isTeacher ? user.profileId : undefined
      });
      setEnrollments(response.data);
      setPagination(response.pagination);
    } catch (err) {
      toast.error('Failed to fetch enrollments');
    } finally {
      setLoading(false);
    }
  };

  const openEnrollModal = async () => {
    try {
      const [classRes, studentRes] = await Promise.all([
        classService.getClasses({ 
          limit: 100,
          teacher: isTeacher ? user.profileId : undefined
        }),
        api.get('/students', { params: { limit: 200 } })
      ]);
      setClasses(classRes.data);
      setStudents(studentRes.data.data);
      setEnrollForm({ studentId: '', classId: '', payAdmissionFee: false, notes: '' });
      setShowEnrollModal(true);
    } catch (err) {
      toast.error('Failed to load data for enrollment');
    }
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!enrollForm.studentId || !enrollForm.classId) {
      toast.error('Please select a student and a class');
      return;
    }

    try {
      setEnrolling(true);
      await enrollmentService.createEnrollment(enrollForm);
      toast.success('Student enrolled successfully');
      setShowEnrollModal(false);
      fetchEnrollments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enroll student');
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async (enrollmentId) => {
    try {
      await enrollmentService.unenrollStudent(enrollmentId);
      toast.success('Student unenrolled successfully');
      setShowUnenrollConfirm(null);
      fetchEnrollments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unenroll student');
    }
  };

  if (loading && enrollments.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Enrollments</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage student class enrollments</p>
        </div>
        <button onClick={openEnrollModal} className="btn btn-primary">
          <UserPlus className="w-5 h-5" />
          Enroll Student
        </button>
      </div>

      {/* Table */}
      {enrollments.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50">No enrollments yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Enroll students into classes to get started</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Enrolled At</th>
                  <th>Admission Fee</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment) => (
                  <tr key={enrollment._id}>
                    <td>
                      <div className="font-medium text-gray-900 dark:text-gray-50">{enrollment.student?.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{enrollment.student?.email}</div>
                    </td>
                    <td>
                      <div className="font-medium">{enrollment.class?.className}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{enrollment.class?.subject} · Grade {enrollment.class?.grade}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      {enrollment.admissionFeePaid ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Paid (LKR {enrollment.admissionFeeAmount})
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          Not Paid
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        enrollment.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {enrollment.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        {enrollment.isActive && (
                          <button
                            onClick={() => setShowUnenrollConfirm(enrollment._id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Unenroll"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: pagination.totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPagination(p => ({ ...p, currentPage: i + 1 }))}
                  className={`px-3 py-1 rounded text-sm ${
                    pagination.currentPage === i + 1 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Enroll Student</h2>
              <button onClick={() => setShowEnrollModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEnroll} className="p-6 space-y-4">
              <div>
                <label className="form-label">Student <span className="text-red-500">*</span></label>
                <select
                  value={enrollForm.studentId}
                  onChange={(e) => setEnrollForm({ ...enrollForm, studentId: e.target.value })}
                  className="form-input"
                >
                  <option value="">Select Student</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>{s.name} (Grade {s.grade})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Class <span className="text-red-500">*</span></label>
                <select
                  value={enrollForm.classId}
                  onChange={(e) => setEnrollForm({ ...enrollForm, classId: e.target.value })}
                  className="form-input"
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.className} — {c.subject} ({c.enrolledCount}/{c.capacity})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="payAdmissionFee"
                  checked={enrollForm.payAdmissionFee}
                  onChange={(e) => setEnrollForm({ ...enrollForm, payAdmissionFee: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="payAdmissionFee" className="text-sm text-gray-700">Mark admission fee as paid</label>
              </div>
              <div>
                <label className="form-label">Notes</label>
                <textarea
                  value={enrollForm.notes}
                  onChange={(e) => setEnrollForm({ ...enrollForm, notes: e.target.value })}
                  className="form-input"
                  placeholder="Optional notes..."
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowEnrollModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={enrolling} className="btn btn-primary disabled:opacity-50">
                  {enrolling ? <><Spinner size="sm" /> Enrolling...</> : <><UserPlus className="w-4 h-4" /> Enroll</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unenroll Confirmation */}
      {showUnenrollConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Unenroll Student</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Are you sure? The student will lose access to this class.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowUnenrollConfirm(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={() => handleUnenroll(showUnenrollConfirm)} className="btn bg-red-600 text-white hover:bg-red-700">Unenroll</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentList;





