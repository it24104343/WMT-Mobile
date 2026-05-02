import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, DollarSign,
  Clock, FileText, Bell, TrendingUp, Calendar, CheckCircle,
  ClipboardCheck, AlertTriangle
} from 'lucide-react';
import dashboardService from '../../services/dashboardService';
import { Spinner } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const StatCard = ({ icon: Icon, label, value, color = 'primary', link }) => {
  const colors = {
    primary: 'bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400',
    green: 'bg-green-50 dark:bg-green-900/40 text-green-600 dark:text-green-400',
    blue: 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400',
    purple: 'bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
    red: 'bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
  };
  const content = (
    <div className="card hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-50 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
  return link ? <Link to={link}>{content}</Link> : content;
};

/* ── Admin Dashboard ── */
const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await dashboardService.getAdminDashboard();
        setData(r.data);
      } catch { toast.error('Failed to load dashboard'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!data) return null;

  const { stats, recentRevenue, monthlyTrend, recentEnrollments } = data;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={BookOpen} label="Active Classes" value={stats.totalClasses} color="primary" link="/classes" />
        <StatCard icon={GraduationCap} label="Students" value={stats.totalStudents} color="blue" link="/students" />
        <StatCard icon={Users} label="Teachers" value={stats.totalTeachers} color="purple" link="/teachers" />
        <StatCard icon={DollarSign} label="Total Revenue" value={`LKR ${stats.totalRevenue.toLocaleString()}`} color="green" link="/payments" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={ClipboardCheck} label="Enrollments" value={stats.activeEnrollments} color="indigo" link="/enrollments" />
        <StatCard icon={Clock} label="Sessions" value={stats.totalSessions} color="yellow" link="/attendance" />
        <StatCard icon={FileText} label="Exams" value={stats.totalExams} color="blue" link="/exams" />
        <StatCard icon={AlertTriangle} label="Pending Requests" value={stats.pendingRequests} color="red" link="/service-requests" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 30-Day Revenue */}
        <div className="card bg-white dark:bg-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Last 30 Days Revenue</h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-50 dark:bg-green-900/40 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">LKR {recentRevenue.amount.toLocaleString()}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{recentRevenue.count} payments</p>
            </div>
          </div>
          {monthlyTrend.length > 0 && (
            <div className="mt-4 space-y-2">
              {monthlyTrend.map((m, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">{MONTHS[m._id.month - 1]} {m._id.year}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-50 dark:text-white">LKR {m.total.toLocaleString()} ({m.count})</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Enrollments */}
        <div className="card bg-white dark:bg-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Enrollments</h3>
          {recentEnrollments.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-sm">No recent enrollments</p>
          ) : (
            <div className="space-y-3">
              {recentEnrollments.map(e => (
                <div key={e._id} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-white">{e.student?.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{e.class?.className} — {e.class?.subject}</div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{new Date(e.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/* ── Teacher Dashboard ── */
const TeacherDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await dashboardService.getTeacherDashboard();
        setData(r.data);
      } catch { toast.error('Failed to load dashboard'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!data) return null;

  const { stats, classes, recentSessions } = data;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={BookOpen} label="My Classes" value={stats.totalClasses} color="primary" />
        <StatCard icon={GraduationCap} label="Enrolled Students" value={stats.totalEnrollments} color="blue" />
        <StatCard icon={CheckCircle} label="Completed Sessions" value={stats.completedSessions} color="green" />
        <StatCard icon={Calendar} label="Today's Sessions" value={stats.todaySessions} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">My Classes</h3>
          {classes.length === 0 ? <p className="text-gray-500 dark:text-gray-400 text-sm">No classes assigned</p> : (
            <div className="space-y-2">
              {classes.map(c => (
                <Link key={c._id} to={`/class/${c._id}`} className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="font-medium text-sm text-gray-900 dark:text-white">{c.className}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">{c.subject} · Grade {c.grade}</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Sessions</h3>
          {recentSessions.length === 0 ? <p className="text-gray-500 dark:text-gray-400 text-sm">No sessions yet</p> : (
            <div className="space-y-3">
              {recentSessions.map(s => (
                <div key={s._id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-white">{s.class?.className}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">{new Date(s.date).toLocaleDateString()} · {s.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/* ── Student Dashboard ── */
const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);

  const fetchData = async () => {
    try {
      const r = await dashboardService.getStudentDashboard();
      setData(r.data);
    } catch { toast.error('Failed to load dashboard'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleEnroll = async (classId) => {
    try {
      setEnrolling(classId);
      const enrollmentService = (await import('../../services/enrollmentService')).default;
      await enrollmentService.selfEnroll(classId);
      toast.success('Enrolled successfully!');
      setLoading(true);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enroll');
    } finally { setEnrolling(null); }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!data) return null;

  const { stats, enrollments, availableClasses } = data;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={BookOpen} label="Enrolled Classes" value={stats.enrolledClasses} color="primary" />
        <StatCard icon={ClipboardCheck} label="Attendance" value={`${stats.attendancePercentage}%`} color={stats.attendancePercentage >= 75 ? 'green' : 'red'} />
        <StatCard icon={FileText} label="Upcoming Exams" value={stats.upcomingExams} color="blue" link="/exams" />
        <StatCard icon={Bell} label="Unread Notifications" value={stats.unreadNotifications} color="yellow" link="/notifications" />
      </div>

      {/* Enrolled Classes */}
      {enrollments.length > 0 && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" /> My Enrolled Classes
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrollments.map(e => (
              <Link key={e._id} to={`/class/${e.class?._id}`} className="block relative overflow-hidden p-5 bg-gradient-to-br from-white dark:from-gray-800 to-blue-50/50 dark:to-blue-900/20 rounded-2xl hover:shadow-xl transition-all duration-300 border border-primary-100 dark:border-primary-900/30 hover:-translate-y-1">
                <div className="absolute -top-4 -right-4 p-3 opacity-5 pointer-events-none">
                  <BookOpen className="w-32 h-32 text-primary-600" />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2.5 py-1 bg-primary-100/80 dark:bg-primary-900/50 text-primary-800 dark:text-primary-300 text-[10px] font-bold uppercase tracking-wider rounded-lg backdrop-blur-sm">
                      {e.class?.subject}
                    </span>
                    {e.class?.targetMonth && (
                      <span className="px-2.5 py-1 bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm shadow-blue-100/50">
                        {e.class?.targetMonth} {e.class?.targetYear}
                      </span>
                    )}
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-0.5">{e.class?.className}</h4>
                  <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 font-medium">Grade {e.class?.grade}</div>
                  
                  <div className="mt-4 pt-4 border-t border-primary-100/50 dark:border-primary-900/30 space-y-2.5">
                    <div className="text-xs text-gray-600 dark:text-gray-300 font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary-400" />
                      {e.class?.dayOfWeek} {e.class?.startTime}–{e.class?.endTime}
                    </div>
                    {e.class?.teacher && (
                      <div className="text-xs text-gray-600 dark:text-gray-300 font-medium flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary-400" />
                        Teacher: {e.class.teacher.name}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/80 dark:bg-gray-700 border border-gray-100 dark:border-gray-600">
                      <DollarSign className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-gray-700 dark:text-gray-300">LKR {e.class?.monthlyFee?.toLocaleString()}/mo</span>
                    </div>
                    <div>
                      {e.currentMonthPayment ? (
                        <span className={`inline-block text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg font-bold shadow-sm ${e.currentMonthPayment.status === 'COMPLETED' ? 'bg-green-100 text-green-700 border-green-200' : e.currentMonthPayment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                          {e.currentMonthPayment.status === 'COMPLETED' ? '✓ Paid' : e.currentMonthPayment.status === 'PENDING' ? '⏳ Pending' : 'Payment Due'}
                        </span>
                      ) : e.inFreePeriod ? (
                        <span className="inline-block text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg font-bold shadow-sm bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 animate-pulse">Grace Period</span>
                      ) : (
                        <span className="inline-block text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg font-bold shadow-sm bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">Payment Due</span>
                      )}
                    </div>
                  </div>
                  {!e.admissionFeePaid && e.admissionFeeAmount > 0 && (
                    <div className="mt-3 px-3 py-2 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-[11px] font-bold text-red-700 dark:text-red-300 uppercase tracking-tighter">Admission Fee Pending</span>
                      </div>
                      <span className="text-[11px] font-black text-red-800 dark:text-red-300">LKR {e.admissionFeeAmount}</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Separator */}
      {enrollments.length > 0 && availableClasses?.length > 0 && (
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
          <span className="text-sm font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Available Classes</span>
          <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
        </div>
      )}

      {/* Available Classes */}
      {availableClasses?.length > 0 && (
        <div className="card">
          {enrollments.length === 0 && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-500" /> Classes You Can Join
            </h3>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableClasses.map(cls => (
              <div key={cls._id} className="relative overflow-hidden p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-xl transition-all duration-300 group">
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/50 text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-300 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors">
                    {cls.subject}
                  </span>
                  {cls.targetMonth && (
                    <span className="px-2.5 py-1 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                      {cls.targetMonth} {cls.targetYear}
                    </span>
                  )}
                </div>
                
                <h4 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-0.5">{cls.className}</h4>
                <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 font-medium">Grade {cls.grade}</div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2.5">
                  <div className="text-xs text-gray-600 dark:text-gray-300 font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    {cls.dayOfWeek} {cls.startTime}–{cls.endTime}
                  </div>
                  {cls.teacher && (
                    <div className="text-xs text-gray-600 dark:text-gray-300 font-medium flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      Teacher: {cls.teacher.name}
                    </div>
                  )}
                  <div className="text-xs text-gray-600 dark:text-gray-300 font-medium flex items-center justify-between">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-50 dark:bg-gray-700">
                      <DollarSign className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                      LKR {cls.monthlyFee?.toLocaleString()}/mo
                    </div>
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${cls.remainingSeats > 0 ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                      <Users className="w-3 h-3" />
                      {cls.remainingSeats} seats left
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <span className={`text-[10px] uppercase px-2.5 py-1 rounded-lg font-bold ${cls.classType === 'THEORY' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : cls.classType === 'PAPER' ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' : 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'}`}>
                    {cls.classType}
                  </span>
                  {cls.allowManualEnrollment ? (
                    <button
                      onClick={() => handleEnroll(cls._id)}
                      disabled={enrolling === cls._id || cls.remainingSeats <= 0}
                      className="btn btn-primary text-xs px-4 py-1.5 disabled:opacity-50 shadow-sm shadow-primary-200"
                    >
                      {enrolling === cls._id ? <><Spinner size="sm" /> Enrolling...</> : cls.remainingSeats <= 0 ? 'Full' : 'Enroll Now'}
                    </button>
                  ) : (
                    <span className="text-[10px] px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 font-bold uppercase">Contact Admin</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {enrollments.length === 0 && (!availableClasses || availableClasses.length === 0) && (
        <div className="card text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50">No classes available</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Check back later for new classes</p>
        </div>
      )}
    </>
  );
};

/* ── Main Dashboard (role-based) ── */
const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back, {user?.username}</p>
      </div>
      {user?.role === 'ADMIN' && <AdminDashboard />}
      {user?.role === 'TEACHER' && <TeacherDashboard />}
      {user?.role === 'STUDENT' && <StudentDashboard />}
    </div>
  );
};

export default Dashboard;






