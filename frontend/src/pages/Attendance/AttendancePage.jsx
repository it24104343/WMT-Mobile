import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Plus,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  X,
  ChevronRight,
  Check,
  Minus,
  ArrowLeft
} from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import classService from '../../services/classService';
import { Spinner, ConfirmDialog, EmptyState } from '../../components/UI';
import { Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'Present', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'ABSENT', label: 'Absent', color: 'bg-red-100 text-red-800', icon: XCircle },
  { value: 'LATE', label: 'Late', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
];

const AttendancePage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';
  const canManage = isAdmin || isTeacher;

  // State
  const [activeTab, setActiveTab] = useState(isStudent ? 'student-report' : 'students'); // 'students' | 'teachers' | 'student-report'
  const [view, setView] = useState(isStudent ? 'student-report' : 'sessions'); // 'sessions' | 'mark' | 'report' | 'student-report'
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

  // Create session modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ 
    classId: '', 
    date: new Date().toISOString().split('T')[0], 
    topic: '', 
    notes: '' 
  });
  const [creating, setCreating] = useState(false);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDay = days[new Date().getDay()];
  const [showTodayOnly, setShowTodayOnly] = useState(true);

  // Mark attendance
  const [activeSession, setActiveSession] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [teacherAttendance, setTeacherAttendance] = useState(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [saving, setSaving] = useState(false);

  // Teacher attendance daily state
  const [teacherDate, setTeacherDate] = useState(new Date().toISOString().split('T')[0]);
  const [teacherDailyData, setTeacherDailyData] = useState([]);
  const [teacherDailyLoading, setTeacherDailyLoading] = useState(false);
  const [teacherDailySaving, setTeacherDailySaving] = useState(false);

  // Report
  const [reportData, setReportData] = useState(null);
  const [reportClassId, setReportClassId] = useState('');
  const [loadingReport, setLoadingReport] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    confirmVariant: 'danger'
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [selectedClassId, pagination.currentPage]);

  const fetchClasses = async () => {
    try {
      const response = await classService.getClasses({ limit: 100 });
      setClasses(response.data);
    } catch { /* ignore */ }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await attendanceService.getSessions({
        classId: selectedClassId || undefined,
        page: pagination.currentPage,
        limit: 15
      });
      setSessions(response.data);
      setPagination(response.pagination);
    } catch (err) {
      toast.error('Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!createForm.classId || !createForm.date) {
      toast.error('Class and date are required');
      return;
    }
    try {
      setCreating(true);
      await attendanceService.createSession(createForm);
      toast.success('Session created');
      setShowCreateModal(false);
      fetchSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create session');
    } finally {
      setCreating(false);
    }
  };

  const openMarkAttendance = async (session) => {
    try {
      setLoadingAttendance(true);
      setView('mark');
      const response = await attendanceService.getSessionAttendance(session._id);
      setActiveSession(response.data.session);
      setTeacherAttendance(response.data.teacherAttendance);
      setAttendanceRecords(
        response.data.attendance.map((a) => ({
          _id: a._id,
          studentId: a.student._id,
          studentName: a.student.name,
          studentEmail: a.student.email,
          status: a.status,
          notes: a.notes || ''
        }))
      );
    } catch (err) {
      toast.error('Failed to load attendance');
      setView('sessions');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const updateRecordStatus = (index, status) => {
    setAttendanceRecords((prev) =>
      prev.map((r, i) => (i === index ? { ...r, status } : r))
    );
  };

  const markAllPresent = () => {
    setAttendanceRecords((prev) => prev.map((r) => ({ ...r, status: 'PRESENT' })));
  };

  const markAllAbsent = () => {
    setAttendanceRecords((prev) => prev.map((r) => ({ ...r, status: 'ABSENT' })));
  };

  const markAllLate = () => {
    setAttendanceRecords((prev) => prev.map((r) => ({ ...r, status: 'LATE' })));
  };

  const saveAttendance = async () => {
    try {
      setSaving(true);
      const records = attendanceRecords.map((r) => ({
        studentId: r.studentId,
        status: r.status,
        notes: r.notes
      }));
      await attendanceService.markAttendance(activeSession._id, records);
      toast.success('Attendance saved');
      setView('sessions');
      fetchSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  // ── Teacher Daily Attendance Functions ──
  const fetchTeacherDailyAttendance = async (date) => {
    try {
      setTeacherDailyLoading(true);
      const response = await attendanceService.getDailyTeacherAttendance(date);
      setTeacherDailyData(response.data || []);
    } catch (err) {
      toast.error('Failed to fetch teacher attendance');
    } finally {
      setTeacherDailyLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'teachers' && isAdmin) {
      fetchTeacherDailyAttendance(teacherDate);
    }
  }, [activeTab, teacherDate]);

  const updateTeacherStatus = (teacherIdx, status) => {
    setTeacherDailyData(prev => prev.map((item, i) =>
      i === teacherIdx ? { ...item, _localStatus: status } : item
    ));
  };

  const markAllTeachersStatus = (status) => {
    setTeacherDailyData(prev => prev.map(item => ({ ...item, _localStatus: status })));
  };

  const saveTeacherDailyAttendance = async () => {
    try {
      setTeacherDailySaving(true);
      const records = teacherDailyData
        .filter(item => item._localStatus || item.attendance?.status)
        .map(item => ({
          teacherId: item.teacher._id,
          status: item._localStatus || item.attendance?.status,
          notes: ''
        }));
      if (records.length === 0) {
        toast.info('No attendance to save');
        return;
      }
      await attendanceService.markBulkTeacherAttendance({ date: teacherDate, records });
      toast.success('Teacher attendance saved');
      fetchTeacherDailyAttendance(teacherDate);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setTeacherDailySaving(false);
    }
  };

  const deleteTeacherRecord = async (recordId) => {
    try {
      await attendanceService.deleteTeacherAttendanceRecord(recordId);
      toast.success('Record deleted');
      fetchTeacherDailyAttendance(teacherDate);
    } catch (err) {
      toast.error('Failed to delete record');
    }
  };

  const deleteDaySheet = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Entire Day',
      message: `Delete all teacher attendance records for ${teacherDate}? This cannot be undone.`,
      confirmText: 'Delete All',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await attendanceService.deleteDayTeacherAttendance(teacherDate);
          toast.success('Day attendance deleted');
          fetchTeacherDailyAttendance(teacherDate);
        } catch (err) {
          toast.error('Failed to delete day attendance');
        }
      }
    });
  };

  const markTeacherAttendance = async (teacherId, status) => {
    if (!activeSession) return;
    try {
      setSaving(true);
      await attendanceService.markTeacherAttendance({
        teacherId,
        classId: activeSession.class._id,
        sessionId: activeSession._id,
        date: activeSession.date,
        status
      });
      toast.success('Teacher attendance updated');
      openMarkAttendance(activeSession);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update teacher attendance');
    } finally {
      setSaving(false);
    }
  };

  const loadClassReport = async (classId) => {
    if (!classId) {
      setReportData(null);
      return;
    }
    try {
      setLoadingReport(true);
      setReportClassId(classId);
      const response = await attendanceService.getClassReport(classId);
      setReportData(response.data);
    } catch (err) {
      toast.error('Failed to load report');
    } finally {
      setLoadingReport(false);
    }
  };

  const cancelSession = (sessionId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cancel Session',
      message: 'Cancel this session? Attendance records will be removed.',
      confirmText: 'Cancel Session',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await attendanceService.cancelSession(sessionId);
          toast.success('Session cancelled');
          fetchSessions();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to cancel session');
        }
      }
    });
  };

  // ── MARK ATTENDANCE VIEW ──
  if (view === 'mark') {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setView('sessions')} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 dark:text-gray-50">Mark Attendance</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5">
              {activeSession?.class?.className} · {new Date(activeSession?.date).toLocaleDateString()}
              {activeSession?.topic && ` · ${activeSession.topic}`}
              {activeSession?.class?.teacher && activeTab === 'teachers' && ` · Teacher: ${activeSession.class.teacher.name || 'Assigned'}`}
            </p>
          </div>
        </div>

        {activeTab === 'teachers' && activeSession?.class?.teacher && (
          <div className="card mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-50 text-lg">Teacher Attendance</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">{activeSession.class.teacher.name || 'Assigned Teacher'}</p>
              </div>
              <div className="flex gap-2">
                {STATUS_OPTIONS.map((opt) => {
                  const isActive = teacherAttendance?.status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => markTeacherAttendance(activeSession.class.teacher._id || activeSession.class.teacher, opt.value)}
                      disabled={saving}
                      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                        isActive
                          ? opt.color + ' ring-2 ring-primary-500 ring-offset-2'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <opt.icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {loadingAttendance ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <>
            {/* Student Quick actions */}
            {canManage && activeTab === 'students' && (
              <div className="flex gap-2 mb-4">
                <button onClick={markAllPresent} className="btn btn-secondary text-sm">
                  <Check className="w-4 h-4" /> Mark All Present
                </button>
                <button onClick={markAllAbsent} className="btn btn-secondary text-sm">
                  <X className="w-4 h-4" /> Mark All Absent
                </button>
                <button onClick={markAllLate} className="btn btn-secondary text-sm">
                  <Clock className="w-4 h-4" /> Mark All Late
                </button>
              </div>
            )}

            {activeTab === 'students' ? (
              <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th>Status</th>
                    {canManage && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map((record, index) => {
                    const statusOpt = STATUS_OPTIONS.find((s) => s.value === record.status);
                    return (
                      <tr key={record._id || index}>
                        <td className="text-gray-500 dark:text-gray-400">{index + 1}</td>
                        <td>
                          <div className="font-medium text-gray-900 dark:text-gray-50 dark:text-gray-50">{record.studentName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">{record.studentEmail}</div>
                        </td>
                        <td>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusOpt?.color}`}>
                            {statusOpt && <statusOpt.icon className="w-3 h-3" />}
                            {record.status}
                          </span>
                        </td>
                        {canManage && (
                          <td>
                            <div className="flex gap-1">
                              {STATUS_OPTIONS.map((opt) => (
                                <button
                                  key={opt.value}
                                  onClick={() => updateRecordStatus(index, opt.value)}
                                  className={`px-2 py-1 text-xs rounded ${
                                    record.status === opt.value
                                      ? opt.color + ' font-bold ring-2 ring-offset-1 ring-gray-300'
                                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                  }`}
                                  title={opt.label}
                                >
                                  {opt.label.charAt(0)}
                                </button>
                              ))}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            ) : (
              <div className="card text-center py-12">
                <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 dark:text-gray-50">Teacher Attendance Mode</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Mark the teacher's status using the buttons above.</p>
              </div>
            )}

            {/* Summary */}
            {activeTab === 'students' && (
              <div className="card mt-4">
                <div className="flex gap-6 text-sm">
                  <span className="text-green-600 font-medium">Present: {attendanceRecords.filter((r) => r.status === 'PRESENT').length}</span>
                  <span className="text-red-600 font-medium">Absent: {attendanceRecords.filter((r) => r.status === 'ABSENT').length}</span>
                  <span className="text-yellow-600 font-medium">Late: {attendanceRecords.filter((r) => r.status === 'LATE').length}</span>
                </div>
              </div>
            )}

            {canManage && activeTab === 'students' && (
              <div className="flex justify-end mt-4">
                <button onClick={saveAttendance} disabled={saving} className="btn btn-primary disabled:opacity-50">
                  {saving ? <><Spinner size="sm" /> Saving...</> : <><Check className="w-5 h-5" /> Save Attendance</>}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ── REPORT VIEW ──
  if (view === 'report') {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setView('sessions')} className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 dark:text-gray-50">Attendance Report</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5">View attendance statistics by class</p>
          </div>
        </div>

        <div className="card mb-6">
          <select
            value={reportClassId}
            onChange={(e) => loadClassReport(e.target.value)}
            className="form-input w-auto min-w-[250px]"
          >
            <option value="">Select a class...</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.className} — {c.subject}</option>
            ))}
          </select>
        </div>

        {loadingReport && <div className="flex justify-center py-12"><Spinner size="lg" /></div>}

        {reportData && !loadingReport && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="card text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-50 dark:text-gray-50">{reportData.totalSessions}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">Total Sessions</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-50 dark:text-gray-50">{reportData.students?.length || 0}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">Students</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{reportData.threshold}%</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">Threshold</div>
              </div>
              <div className="card text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{reportData.belowThreshold}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">Below Threshold</div>
              </div>
            </div>

            {/* Student table */}
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Present</th>
                    <th>Late</th>
                    <th>Absent</th>
                    <th>Attendance %</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.students?.map((s) => (
                    <tr key={s.student?._id}>
                      <td>
                        <div className="font-medium text-gray-900 dark:text-gray-50 dark:text-gray-50">{s.student?.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">{s.student?.email}</div>
                      </td>
                      <td className="text-green-600 font-medium">{s.PRESENT}</td>
                      <td className="text-yellow-600 font-medium">{s.LATE}</td>
                      <td className="text-red-600 font-medium">{s.ABSENT}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <div
                              className={`h-2 rounded-full ${s.percentage >= reportData.threshold ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(s.percentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{s.percentage}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.meetsThreshold ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {s.meetsThreshold ? 'OK' : 'Below'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── STUDENT PERSONAL REPORT VIEW ──
  if (isStudent || view === 'student-report') {
    return <StudentReportView studentId={user.profileId} />;
  }

  // ── SESSIONS LIST VIEW (default) ──
  return (
    <div>
      {/* Tabs — Teacher Attendance only visible to Admins */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-6 py-3 font-medium text-sm transition-colors relative ${
            activeTab === 'students' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Student Attendance
          {activeTab === 'students' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />}
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-6 py-3 font-medium text-sm transition-colors relative ${
              activeTab === 'teachers' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Teacher Attendance
            {activeTab === 'teachers' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />}
          </button>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 dark:text-gray-50">
            {activeTab === 'students' ? 'Attendance' : 'Teacher Attendance'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {activeTab === 'students' 
              ? 'Manage sessions and track student attendance'
              : 'Track and mark attendance for teachers'}
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'students' && (
            <button onClick={() => setView('report')} className="btn btn-secondary">
              <Users className="w-4 h-4" /> Reports
            </button>
          )}
          {canManage && (
            <button onClick={() => { 
              setCreateForm({ 
                classId: '', 
                date: new Date().toISOString().split('T')[0], 
                topic: '', 
                notes: '' 
              }); 
              setShowCreateModal(true); 
            }} className="btn btn-primary">
              <Plus className="w-5 h-5" /> New Session
            </button>
          )}
        </div>
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'teachers' && isAdmin ? (
        /* ── TEACHER DAILY ATTENDANCE ── */
        <>
          {/* Date picker + actions */}
          <div className="card mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={teacherDate}
                  onChange={(e) => setTeacherDate(e.target.value)}
                  className="form-input w-auto"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {teacherDailyData.filter(d => d.attendance || d._localStatus).length} / {teacherDailyData.length} marked
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => markAllTeachersStatus('PRESENT')} className="btn btn-secondary text-sm">
                  <CheckCircle className="w-4 h-4" /> All Present
                </button>
                <button onClick={() => markAllTeachersStatus('ABSENT')} className="btn btn-secondary text-sm">
                  <XCircle className="w-4 h-4" /> All Absent
                </button>
                {teacherDailyData.some(d => d.attendance) && (
                  <button onClick={deleteDaySheet} className="btn btn-secondary text-sm text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" /> Delete Day
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Teacher list */}
          {teacherDailyLoading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : teacherDailyData.length === 0 ? (
            <div className="card text-center py-12">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 dark:text-gray-50">No teachers found</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Add teachers first from the Teachers page</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Teacher</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacherDailyData.map((item, idx) => {
                      const currentStatus = item._localStatus || item.attendance?.status || null;
                      return (
                        <tr key={item.teacher._id}>
                          <td className="text-gray-500 dark:text-gray-400">{idx + 1}</td>
                          <td>
                            <div className="font-medium text-gray-900 dark:text-gray-50 dark:text-gray-50">{item.teacher.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">{item.teacher.email}</div>
                          </td>
                          <td>
                            <div className="flex gap-1">
                              {['PRESENT', 'ABSENT', 'LATE'].map(st => {
                                const opt = STATUS_OPTIONS.find(o => o.value === st);
                                return (
                                  <button
                                    key={st}
                                    onClick={() => updateTeacherStatus(idx, st)}
                                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all flex items-center gap-1 ${
                                      currentStatus === st
                                        ? opt.color + ' ring-2 ring-offset-1 ring-gray-300'
                                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                    }`}
                                  >
                                    <opt.icon className="w-3.5 h-3.5" />
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td>
                            {item.attendance && (
                              <button
                                onClick={() => deleteTeacherRecord(item.attendance._id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                title="Delete record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="card mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-6 text-sm">
                    <span className="text-green-600 font-medium">
                      Present: {teacherDailyData.filter(d => (d._localStatus || d.attendance?.status) === 'PRESENT').length}
                    </span>
                    <span className="text-red-600 font-medium">
                      Absent: {teacherDailyData.filter(d => (d._localStatus || d.attendance?.status) === 'ABSENT').length}
                    </span>
                    <span className="text-yellow-600 font-medium">
                      Late: {teacherDailyData.filter(d => (d._localStatus || d.attendance?.status) === 'LATE').length}
                    </span>
                  </div>
                  <button
                    onClick={saveTeacherDailyAttendance}
                    disabled={teacherDailySaving}
                    className="btn btn-primary"
                  >
                    {teacherDailySaving ? <><Spinner size="sm" /> Saving...</> : <><Check className="w-5 h-5" /> Save Attendance</>}
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        /* ── STUDENT SESSIONS VIEW ── */
        <>
          {/* Class filter */}
          <div className="card mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div className="flex flex-col sm:flex-row gap-2 items-center">
                  <select
                    value={selectedClassId}
                    onChange={(e) => { setSelectedClassId(e.target.value); setPagination(p => ({ ...p, currentPage: 1 })); }}
                    className="form-input w-auto min-w-[220px]"
                  >
                    <option value="">All Classes</option>
                    {classes
                      .filter(c => !showTodayOnly || (c.dayOfWeek || c.day) === todayDay)
                      .map((c) => (
                      <option key={c._id} value={c._id}>{c.className} — {c.subject}</option>
                    ))}
                  </select>
                  
                  <button 
                    onClick={() => setShowTodayOnly(!showTodayOnly)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm font-medium ${
                      showTodayOnly 
                        ? 'bg-primary-50 border-primary-200 text-primary-700' 
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {showTodayOnly ? <CheckCircle className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                    {showTodayOnly ? `Showing ${todayDay}` : 'Show All Days'}
                  </button>
                </div>
              </div>
              
              {showTodayOnly && classes.filter(c => (c.dayOfWeek || c.day) === todayDay).length === 0 && (
                <p className="text-sm text-amber-600 font-medium italic">No classes found for today.</p>
              )}
            </div>
          </div>

          {/* Sessions */}
          {loading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : sessions.length === 0 ? (
            <div className="card text-center py-12">
              <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50 dark:text-gray-50">No sessions found</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Create a session to start tracking attendance</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {sessions.map((session) => {
                  const summary = session.attendanceSummary || {};
                  return (
                    <div key={session._id} className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => openMarkAttendance(session)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            session.status === 'COMPLETED' ? 'bg-green-100' : session.status === 'CANCELLED' ? 'bg-red-100' : 'bg-blue-100'
                          }`}>
                            <Calendar className={`w-5 h-5 ${
                              session.status === 'COMPLETED' ? 'text-green-600' : session.status === 'CANCELLED' ? 'text-red-600' : 'text-blue-600'
                            }`} />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-50 dark:text-gray-50">{session.class?.className}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">
                              {new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                              {' · '}{session.startTime} – {session.endTime}
                              {session.topic && ` · ${session.topic}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {summary.total > 0 && (
                            <div className="flex gap-2 text-xs">
                              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700">{summary.PRESENT} P</span>
                              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700">{summary.ABSENT} A</span>
                              {summary.LATE > 0 && <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">{summary.LATE} L</span>}
                            </div>
                          )}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            session.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            session.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {session.status}
                          </span>
                          {canManage && session.status !== 'CANCELLED' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); cancelSession(session._id); }}
                              className="p-1 text-gray-400 hover:text-red-500 rounded"
                              title="Cancel Session"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

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
        </>
      )}

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Session</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSession} className="p-6 space-y-4">
              <div>
                <label className="form-label">Class <span className="text-red-500">*</span></label>
                  <select
                    value={createForm.classId}
                    onChange={(e) => setCreateForm({ ...createForm, classId: e.target.value })}
                    className="form-input"
                  >
                    <option value="">Select Class</option>
                    <optgroup label={`Today (${todayDay})`}>
                      {classes
                        .filter(c => (c.dayOfWeek || c.day) === todayDay)
                        .map((c) => (
                        <option key={c._id} value={c._id}>{c.className} — {c.subject}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Other Classes">
                      {classes
                        .filter(c => (c.dayOfWeek || c.day) !== todayDay)
                        .map((c) => (
                        <option key={c._id} value={c._id}>{c.className} — {c.subject} ({c.dayOfWeek || c.day})</option>
                      ))}
                    </optgroup>
                  </select>
              </div>
              <div>
                <label className="form-label">Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={createForm.date}
                  onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Topic</label>
                <input
                  type="text"
                  value={createForm.topic}
                  onChange={(e) => setCreateForm({ ...createForm, topic: e.target.value })}
                  className="form-input"
                  placeholder="e.g., Trigonometry Chapter 5"
                />
              </div>
              <div>
                <label className="form-label">Notes</label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  className="form-input"
                  placeholder="Optional..."
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={creating} className="btn btn-primary disabled:opacity-50">
                  {creating ? <><Spinner size="sm" /> Creating...</> : <><Plus className="w-4 h-4" /> Create</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        {...confirmDialog}
        onClose={() => setConfirmDialog(p => ({ ...p, isOpen: false }))}
      />
    </div>
  );
};

const StudentReportView = ({ studentId }) => {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await attendanceService.getStudentReport(studentId);
        setReport(response.data);
      } catch (err) {
        toast.error('Failed to load attendance report');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [studentId]);

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!report) return <EmptyState title="No report available" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold">{report.overallStats.totalSessions}</div>
          <div className="text-sm text-gray-500">Total Sessions</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{report.overallStats.present + report.overallStats.late}</div>
          <div className="text-sm text-gray-500">Attended</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">{report.overallStats.absent}</div>
          <div className="text-sm text-gray-500">Absent</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">
            {report.overallStats.totalSessions > 0 
              ? Math.round(((report.overallStats.present + report.overallStats.late) / report.overallStats.totalSessions) * 100) 
              : 0}%
          </div>
          <div className="text-sm text-gray-500">Attendance</div>
        </div>
      </div>

      <div className="space-y-4">
        {report.classes.map((cls) => (
          <div key={cls.class._id} className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg text-gray-900">{cls.class.className}</h3>
                <p className="text-sm text-gray-500">{cls.class.subject} · Grade {cls.class.grade}</p>
              </div>
              <div className="text-right">
                <div className={`text-xl font-bold ${cls.meetsThreshold ? 'text-green-600' : 'text-red-600'}`}>
                  {cls.percentage}%
                </div>
                <p className="text-xs text-gray-400">Target: {cls.threshold}%</p>
              </div>
            </div>
            
            <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
              <div 
                className={`h-2 rounded-full ${cls.meetsThreshold ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${cls.percentage}%` }}
              />
            </div>

            <div className="table-container max-h-60 overflow-y-auto">
              <table className="text-sm">
                <thead>
                  <tr><th>Date</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {cls.records.map((rec, i) => (
                    <tr key={i}>
                      <td>{new Date(rec.date).toLocaleDateString()}</td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                          rec.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendancePage;





