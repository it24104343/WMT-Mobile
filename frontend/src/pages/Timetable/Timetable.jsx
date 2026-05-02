import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, User, MapPin, Users, Filter, RefreshCw } from 'lucide-react';
import classService from '../../services/classService';
import teacherService from '../../services/teacherService';
import dashboardService from '../../services/dashboardService';
import { LoadingOverlay, ErrorMessage, Badge } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00'
];

const Timetable = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';
  const [timetable, setTimetable] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolledClassIds, setEnrolledClassIds] = useState(null);

  // Filters
  const [teachers, setTeachers] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ grades: [], subjects: [] });
  const [filters, setFilters] = useState({
    teacher: isTeacher ? user.profileId : '',
    grade: '',
    subject: ''
  });

  useEffect(() => {
    fetchTimetable();
    if (!isStudent) fetchFilters();
  }, [filters]);

  // Fetch enrolled class IDs for students
  useEffect(() => {
    if (isStudent) {
      (async () => {
        try {
          const r = await dashboardService.getStudentDashboard();
          const ids = (r.data?.enrollments || [])
            .map(e => e.class?._id)
            .filter(Boolean);
          setEnrolledClassIds(ids);
        } catch (err) {
          console.error('Failed to fetch enrolled classes:', err);
          setEnrolledClassIds([]);
        }
      })();
    }
  }, []);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const response = await classService.getTimetable({
        teacher: filters.teacher || undefined,
        grade: filters.grade || undefined,
        subject: filters.subject || undefined
      });

      let data = response.data;

      // Filter timetable for students — only show enrolled classes
      if (isStudent && enrolledClassIds) {
        const filtered = {};
        for (const day of DAYS_OF_WEEK) {
          filtered[day] = (data[day] || []).filter(cls =>
            enrolledClassIds.includes(cls._id)
          );
        }
        data = filtered;
      }

      setTimetable(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch timetable');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch timetable once enrolled class IDs are loaded for student
  useEffect(() => {
    if (isStudent && enrolledClassIds !== null) {
      fetchTimetable();
    }
  }, [enrolledClassIds]);

  const fetchFilters = async () => {
    try {
      const [teachersRes, optionsRes] = await Promise.all([
        teacherService.getTeachers({ limit: 100 }),
        classService.getFilterOptions()
      ]);
      setTeachers(teachersRes.data);
      setFilterOptions(optionsRes.data);
    } catch (err) {
      console.error('Failed to fetch filter data:', err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ teacher: isTeacher ? user.profileId : '', grade: '', subject: '' });
  };

  const getClassForTimeSlot = (day, timeSlot) => {
    const dayClasses = timetable[day] || [];
    return dayClasses.filter((cls) => {
      const classStart = parseInt(cls.startTime.replace(':', ''));
      const classEnd = parseInt(cls.endTime.replace(':', ''));
      const slotTime = parseInt(timeSlot.replace(':', ''));
      return slotTime >= classStart && slotTime < classEnd;
    });
  };

  const isClassStart = (cls, timeSlot) => {
    return cls.startTime === timeSlot;
  };

  const getClassDuration = (cls) => {
    const start = cls.startTime.split(':').map(Number);
    const end = cls.endTime.split(':').map(Number);
    return (end[0] * 60 + end[1]) - (start[0] * 60 + start[1]);
  };

  const getColorForSubject = (subject) => {
    const colors = {
      'Mathematics': 'bg-blue-100 border-blue-300 text-blue-800',
      'Physics': 'bg-purple-100 border-purple-300 text-purple-800',
      'Chemistry': 'bg-green-100 border-green-300 text-green-800',
      'Biology': 'bg-teal-100 border-teal-300 text-teal-800',
      'English': 'bg-yellow-100 border-yellow-300 text-yellow-800',
      'Literature': 'bg-orange-100 border-orange-300 text-orange-800',
      'History': 'bg-red-100 border-red-300 text-red-800',
      'Geography': 'bg-indigo-100 border-indigo-300 text-indigo-800',
      'Computer Science': 'bg-cyan-100 border-cyan-300 text-cyan-800'
    };
    return colors[subject] || 'bg-gray-100 border-gray-300 text-gray-800';
  };

  if (loading && Object.keys(timetable).length === 0) {
    return <LoadingOverlay message="Loading timetable..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchTimetable} />;
  }

  const hasActiveFilters = filters.teacher || filters.grade || filters.subject;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            {isStudent ? 'My Timetable' : 'Class Timetable'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isStudent ? 'Your enrolled classes schedule' : 'Weekly schedule overview'}
          </p>
        </div>
        <button
          onClick={fetchTimetable}
          className="btn btn-secondary"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters — hidden for students */}
      {!isStudent && (
        <div className="card mb-6 overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-center gap-2 min-w-max">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Filters:</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 flex-1">
              <select
                value={filters.teacher}
                onChange={(e) => handleFilterChange('teacher', e.target.value)}
                className="form-input w-full sm:w-auto min-w-[180px]"
                disabled={isTeacher}
              >
                <option value="">All Teachers</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name}
                  </option>
                ))}
              </select>

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

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm font-medium text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Timetable Grid */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                  Time
                </th>
                {DAYS_OF_WEEK.map((day) => (
                  <th
                    key={day}
                    className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((timeSlot, index) => (
                <tr key={timeSlot} className="border-b border-gray-100">
                  <td className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border-r border-gray-200">
                    {timeSlot}
                  </td>
                  {DAYS_OF_WEEK.map((day) => {
                    const classes = getClassForTimeSlot(day, timeSlot);
                    const startingClasses = classes.filter((cls) => isClassStart(cls, timeSlot));

                    return (
                      <td
                        key={`${day}-${timeSlot}`}
                        className="px-1 py-1 align-top h-16 relative"
                      >
                        {startingClasses.map((cls) => {
                          const duration = getClassDuration(cls);
                          const heightMultiplier = duration / 60;

                          return (
                            <div
                              key={cls._id}
                              onClick={() => navigate(`/class/${cls._id}`)}
                              className={`absolute left-1 right-1 p-2 rounded-lg border cursor-pointer transition-all hover:shadow-md ${getColorForSubject(
                                cls.subject
                              )}`}
                              style={{
                                height: `${heightMultiplier * 64 - 8}px`,
                                zIndex: 10
                              }}
                            >
                              <div className="text-xs font-semibold truncate">
                                {cls.className}
                              </div>
                              <div className="text-xs opacity-80 truncate">
                                {cls.subject}
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <User className="w-3 h-3" />
                                <span className="text-xs truncate">{cls.teacher}</span>
                              </div>
                              {cls.hall && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span className="text-xs truncate">{cls.hall}</span>
                                </div>
                              )}
                              {!isStudent && (
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  <span className="text-xs">
                                    {cls.enrolledCount}/{cls.capacity}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 card">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Subject Colors</h3>
        <div className="flex flex-wrap gap-3">
          {[
            'Mathematics',
            'Physics',
            'Chemistry',
            'Biology',
            'English',
            'Literature',
            'History',
            'Geography',
            'Computer Science'
          ].map((subject) => (
            <div
              key={subject}
              className={`px-3 py-1 rounded-full text-xs font-medium ${getColorForSubject(
                subject
              )}`}
            >
              {subject}
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        {DAYS_OF_WEEK.map((day) => {
          const dayClasses = timetable[day] || [];
          return (
            <div key={day} className="card text-center">
              <p className="text-sm font-medium text-gray-600">{day}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-50 mt-1">
                {dayClasses.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">classes</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Timetable;



