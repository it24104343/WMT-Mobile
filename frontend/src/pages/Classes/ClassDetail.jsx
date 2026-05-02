import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Users,
  Clock,
  MapPin,
  BookOpen,
  User,
  UserPlus,
  UserMinus,
  AlertTriangle
} from 'lucide-react';
import classService from '../../services/classService';
import studentService from '../../services/studentService';
import {
  LoadingOverlay,
  ErrorMessage,
  Badge,
  Modal,
  ConfirmDialog,
  Spinner
} from '../../components/UI';

const ClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Student management
  const [allStudents, setAllStudents] = useState([]);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [addingStudents, setAddingStudents] = useState(false);
  const [removingStudent, setRemovingStudent] = useState(null);

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [removeStudentDialog, setRemoveStudentDialog] = useState({ isOpen: false, student: null });

  useEffect(() => {
    fetchClassData();
    fetchAllStudents();
  }, [id]);

  const fetchClassData = async () => {
    try {
      setLoading(true);
      const response = await classService.getClassById(id);
      setClassData(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch class details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const response = await studentService.getStudents({ limit: 200 });
      setAllStudents(response.data);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  };

  const handleDeleteClass = async () => {
    try {
      await classService.deleteClass(id);
      toast.success('Class deleted successfully');
      navigate('/classes');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete class');
    }
  };

  const handleAddStudents = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    try {
      setAddingStudents(true);
      await classService.addStudents(id, selectedStudents);
      toast.success('Students added successfully');
      setShowAddStudentModal(false);
      setSelectedStudents([]);
      fetchClassData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add students');
    } finally {
      setAddingStudents(false);
    }
  };

  const handleRemoveStudent = async () => {
    if (!removeStudentDialog.student) return;

    try {
      setRemovingStudent(removeStudentDialog.student._id);
      await classService.removeStudents(id, [removeStudentDialog.student._id]);
      toast.success('Student removed successfully');
      fetchClassData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove student');
    } finally {
      setRemovingStudent(null);
      setRemoveStudentDialog({ isOpen: false, student: null });
    }
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const getAvailableStudents = () => {
    const enrolledIds = classData?.students?.map((s) => s._id) || [];
    return allStudents.filter((s) => !enrolledIds.includes(s._id));
  };

  const capacityPercentage = classData
    ? (classData.enrolledCount / classData.capacity) * 100
    : 0;

  if (loading) {
    return <LoadingOverlay message="Loading class details..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchClassData} />;
  }

  if (!classData) {
    return <ErrorMessage message="Class not found" />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/classes')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{classData.className}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Grade {classData.grade} • {classData.subject}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/classes/${id}/edit`}
            className="btn btn-secondary"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </Link>
          <button
            onClick={() => setDeleteDialog(true)}
            className="btn btn-danger"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Class Details Card */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Class Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary-50 rounded-lg">
                  <BookOpen className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Subject</p>
                  <p className="font-medium text-gray-900 dark:text-gray-50">{classData.subject}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Teacher</p>
                  <p className="font-medium text-gray-900 dark:text-gray-50">
                    {classData.teacher?.name || 'Unassigned'}
                  </p>
                  {classData.teacher?.email && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{classData.teacher.email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Schedule</p>
                  <p className="font-medium text-gray-900 dark:text-gray-50">{classData.dayOfWeek}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {classData.startTime} - {classData.endTime}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Classroom</p>
                  <p className="font-medium text-gray-900 dark:text-gray-50">
                    {classData.classroom || 'Not assigned'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Enrolled Students Card */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Enrolled Students ({classData.enrolledCount})
              </h2>
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="btn btn-primary btn-sm"
                disabled={classData.remainingSeats === 0}
              >
                <UserPlus className="w-4 h-4" />
                Add Students
              </button>
            </div>

            {classData.students && classData.students.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                        Grade
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {classData.students.map((student) => (
                      <tr key={student._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-600" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-gray-50">{student.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{student.email}</td>
                        <td className="py-3 px-4 text-gray-600">Grade {student.grade}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() =>
                              setRemoveStudentDialog({ isOpen: true, student })
                            }
                            disabled={removingStudent === student._id}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                            title="Remove Student"
                          >
                            {removingStudent === student._id ? (
                              <Spinner size="sm" />
                            ) : (
                              <UserMinus className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>No students enrolled yet</p>
                <button
                  onClick={() => setShowAddStudentModal(true)}
                  className="mt-3 text-primary-600 hover:text-primary-700 font-medium"
                >
                  Add students to this class
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Capacity Card */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Capacity</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Enrolled</span>
                <span className="font-semibold text-gray-900">
                  {classData.enrolledCount} / {classData.capacity}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    capacityPercentage >= 100
                      ? 'bg-red-500'
                      : capacityPercentage >= 80
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Remaining seats</span>
                <Badge
                  variant={
                    classData.remainingSeats === 0
                      ? 'danger'
                      : classData.remainingSeats <= 3
                      ? 'warning'
                      : 'success'
                  }
                >
                  {classData.remainingSeats} seats
                </Badge>
              </div>

              {classData.remainingSeats === 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-700">
                    This class is at full capacity. Remove students to add new ones.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Grade</span>
                <span className="font-medium">{classData.grade}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Duration</span>
                <span className="font-medium">
                  {(() => {
                    const start = classData.startTime.split(':').map(Number);
                    const end = classData.endTime.split(':').map(Number);
                    const duration = (end[0] * 60 + end[1]) - (start[0] * 60 + start[1]);
                    const hours = Math.floor(duration / 60);
                    const mins = duration % 60;
                    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
                  })()}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">Status</span>
                <Badge variant={classData.isActive ? 'success' : 'danger'}>
                  {classData.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Students Modal */}
      <Modal
        isOpen={showAddStudentModal}
        onClose={() => {
          setShowAddStudentModal(false);
          setSelectedStudents([]);
        }}
        title="Add Students to Class"
        size="lg"
      >
        <div className="space-y-4">
          {classData.remainingSeats > 0 ? (
            <>
              <p className="text-gray-600">
                Select students to add to this class. You can add up to{' '}
                <span className="font-semibold">{classData.remainingSeats}</span> more students.
              </p>

              {selectedStudents.length > classData.remainingSeats && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <p className="text-sm text-yellow-700">
                    You have selected more students than available seats.
                  </p>
                </div>
              )}

              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {getAvailableStudents().length > 0 ? (
                  getAvailableStudents().map((student) => (
                    <label
                      key={student._id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student._id)}
                        onChange={() => toggleStudentSelection(student._id)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-50">{student.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {student.email} • Grade {student.grade}
                        </p>
                      </div>
                    </label>
                  ))
                ) : (
                  <p className="p-4 text-center text-gray-500">
                    All available students are already enrolled
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedStudents.length} student(s) selected
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAddStudentModal(false);
                      setSelectedStudents([]);
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddStudents}
                    disabled={
                      addingStudents ||
                      selectedStudents.length === 0 ||
                      selectedStudents.length > classData.remainingSeats
                    }
                    className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingStudents ? (
                      <>
                        <Spinner size="sm" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Add Selected
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
              <p className="text-gray-700 dark:text-gray-300">This class is at full capacity.</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Remove students or increase capacity to add more.
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Class Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        onConfirm={handleDeleteClass}
        title="Delete Class"
        message={`Are you sure you want to delete "${classData.className}"? ${
          classData.enrolledCount > 0
            ? `This class has ${classData.enrolledCount} enrolled student(s).`
            : ''
        }`}
        confirmText="Delete"
        confirmVariant="danger"
      />

      {/* Remove Student Confirmation */}
      <ConfirmDialog
        isOpen={removeStudentDialog.isOpen}
        onClose={() => setRemoveStudentDialog({ isOpen: false, student: null })}
        onConfirm={handleRemoveStudent}
        title="Remove Student"
        message={`Are you sure you want to remove "${removeStudentDialog.student?.name}" from this class?`}
        confirmText="Remove"
        confirmVariant="danger"
      />
    </div>
  );
};

export default ClassDetail;






