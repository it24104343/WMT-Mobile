import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  BookOpen, 
  Clock, 
  Save, 
  Trash2, 
  AlertCircle,
  Filter,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { toast } from 'react-toastify';
import classService from '../../services/classService';
import api from '../../services/api';
import { 
  LoadingOverlay, 
  ErrorMessage, 
  Badge, 
  EmptyState,
  Spinner
} from '../../components/UI';

const TeacherAssignmentPage = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, teachersRes] = await Promise.all([
        classService.getClasses({ limit: 100 }), // Get many classes for assignment
        api.get('/teachers?limit=200') // Get all teachers for the dropdown
      ]);
      setClasses(classesRes.data || []);
      setTeachers(teachersRes.data?.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (classId, teacherId) => {
    try {
      setUpdatingId(classId);
      await classService.assignTeacher(classId, teacherId);
      toast.success(teacherId ? 'Teacher assigned successfully' : 'Teacher removed');
      
      // Update local state to reflect change
      setClasses(prev => prev.map(c => 
        c._id === classId 
          ? { ...c, teacher: teachers.find(t => t._id === teacherId) || null } 
          : c
      ));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign teacher');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredClasses = classes.filter(c => 
    c.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.grade.toString().includes(searchTerm)
  );

  if (loading) return <LoadingOverlay message="Loading assignment data..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Teacher Assignments</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage teacher-class mappings and resolve schedule conflicts</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-white p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-50">{classes.length}</div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Classes</div>
          </div>
        </div>
        <div className="card bg-white p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-50">{classes.filter(c => c.teacher).length}</div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Assigned Classes</div>
          </div>
        </div>
        <div className="card bg-white p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-yellow-100 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-50">{classes.filter(c => !c.teacher).length}</div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Missing Teachers</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card bg-white p-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search classes or subjects..."
            className="form-input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Assignment Table */}
      <div className="table-container bg-white border border-gray-100 rounded-3xl shadow-xl overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Class Schedule</th>
              <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Subject & Grade</th>
              <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Current Teacher</th>
              <th className="px-6 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Assign New Teacher</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredClasses.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-20 text-center">
                  <EmptyState 
                    title="No classes found" 
                    description={searchTerm ? 'Adjust your search term' : 'No classes available for assignment'}
                  />
                </td>
              </tr>
            ) : (
              filteredClasses.map((cls) => (
                <tr key={cls._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary-500" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 truncate max-w-[200px]" title={cls.className}>{cls.className}</div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                          {cls.dayOfWeek} • {cls.startTime}-{cls.endTime}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1.5">
                      <Badge variant="primary">{cls.subject}</Badge>
                      <div className="text-xs font-bold text-gray-500 ml-1">Grade {cls.grade}</div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    {cls.teacher ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs uppercase">
                          {cls.teacher.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{cls.teacher.name}</div>
                          <div className="text-[10px] font-medium text-gray-400">{cls.teacher.email}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-xl border border-yellow-100 w-fit">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-[11px] font-black uppercase tracking-wider">Unassigned</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3 max-w-[300px]">
                      <select
                        className="form-input text-sm py-2 rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500/20"
                        value={cls.teacher?._id || ''}
                        onChange={(e) => handleAssign(cls._id, e.target.value || null)}
                        disabled={updatingId === cls._id}
                      >
                        <option value="">-- Remove / Unassigned --</option>
                        {teachers.map(t => (
                          <option key={t._id} value={t._id}>
                            {t.name} ({t.subjects.join(', ') || 'General'})
                          </option>
                        ))}
                      </select>
                      {updatingId === cls._id ? (
                        <Spinner size="sm" />
                      ) : (
                        <ArrowRight className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Info Card */}
      <div className="flex items-start gap-4 p-5 bg-primary-50/50 rounded-3xl border border-primary-100">
        <div className="w-10 h-10 rounded-2xl bg-primary-100 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h4 className="font-bold text-primary-900">Assignment Note</h4>
          <p className="text-sm text-primary-700 mt-1 leading-relaxed">
            Changing a teacher will automatically check for timetable conflicts. If a teacher is already assigned to another class during the same time slot, the system will prevent the assignment.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeacherAssignmentPage;


