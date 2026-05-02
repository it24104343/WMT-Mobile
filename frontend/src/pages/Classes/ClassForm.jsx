import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import classService from '../../services/classService';
import teacherService from '../../services/teacherService';
import hallService from '../../services/hallService';
import { LoadingOverlay, Spinner } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const CLASS_TYPES = [
  { value: 'THEORY', label: 'Theory' },
  { value: 'PAPER', label: 'Paper' },
  { value: 'REVISION', label: 'Revision' }
];

const CLASS_MODES = [
  { value: 'PHYSICAL', label: 'Physical' },
  { value: 'ONLINE', label: 'Online' }
];

const initialFormState = {
  className: '',
  grade: '',
  subject: '',
  classType: 'THEORY',
  mode: 'PHYSICAL',
  monthlyFee: '',
  teacher: '',
  capacity: '',
  startTime: '',
  endTime: '',
  dayOfWeek: '',
  hall: '',
  onlineMeetingLink: '',
  onlineMeetingDetails: '',
  targetMonthYear: '',
  paymentRequiredFromWeek: 2
};

const getTargetMonthOptions = (currentMode) => {
  const options = [];
  const now = new Date();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Support 3 months ago up to 6 months ahead
  const startOffset = currentMode === 'PHYSICAL' ? 0 : -3;
  for (let i = startOffset; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    options.push({
      value: `${months[d.getMonth()]}-${d.getFullYear()}`,
      label: `${months[d.getMonth()]} ${d.getFullYear()}`
    });
  }
  return options;
};

const ClassForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER';

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [halls, setHalls] = useState([]);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [conflictWarning, setConflictWarning] = useState(null);
  const [checkingConflict, setCheckingConflict] = useState(false);

  useEffect(() => {
    const initData = async () => {
      setFetchingData(true);
      await Promise.all([
        fetchTeachers(),
        fetchHalls()
      ]);

      if (isTeacher && user.profileId) {
        await fetchTeacherSubjects(user.profileId);
        if (!isEdit) {
          setFormData(prev => ({ ...prev, teacher: user.profileId }));
        }
      }

      if (isEdit) {
        await fetchClassData();
      }
      setFetchingData(false);
    };

    initData();
  }, [id, isTeacher, user?.profileId]);

  useEffect(() => {
    if (formData.teacher) {
      fetchTeacherSubjects(formData.teacher);
    } else {
      setTeacherSubjects([]);
    }
  }, [formData.teacher]);

  useEffect(() => {
    if (!isEdit && user?.role === 'TEACHER' && user?.profileId) {
      setFormData(prev => ({ ...prev, teacher: user.profileId }));
    }
  }, [user, isEdit]);

  useEffect(() => {
    if (!isEdit && !formData.targetMonthYear) {
      const now = new Date();
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      setFormData(prev => ({
        ...prev,
        targetMonthYear: `${months[now.getMonth()]}-${now.getFullYear()}`
      }));
    }
  }, [isEdit]);

  useEffect(() => {
    if (formData.targetMonthYear) {
      const [m, yStr] = formData.targetMonthYear.split('-');
      const y = parseInt(yStr, 10);
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const mIdx = months.indexOf(m);
      const now = new Date();

      const isPastMonth = y < now.getFullYear() || (y === now.getFullYear() && mIdx < now.getMonth());
      if (isPastMonth && formData.mode === 'PHYSICAL') {
        setFormData(prev => ({ ...prev, mode: 'ONLINE', hall: '' }));
        toast.info("Past month classes must be Online. Mode changed automatically.");
      }
    }
  }, [formData.targetMonthYear, formData.mode]);

  useEffect(() => {
    if (formData.teacher && formData.dayOfWeek && formData.startTime && formData.endTime) {
      checkTeacherConflict();
    } else {
      setConflictWarning(null);
    }
  }, [formData.teacher, formData.dayOfWeek, formData.startTime, formData.endTime]);

  const fetchTeachers = async () => {
    try {
      const response = await teacherService.getTeachers({ limit: 100 });
      setTeachers(response.data);
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
    }
  };

  const fetchHalls = async () => {
    try {
      const response = await hallService.getHalls({ limit: 100 });
      setHalls(response.data);
    } catch (err) {
      console.error('Failed to fetch halls:', err);
    }
  };

  const fetchTeacherSubjects = async (teacherId) => {
    try {
      const response = await teacherService.getTeacherById(teacherId);
      setTeacherSubjects(response.data.subjects || []);
      // If creating new class, set first subject as default if available
      if (!isEdit && response.data.subjects?.length > 0) {
        setFormData(prev => ({ ...prev, subject: response.data.subjects[0] }));
      }
    } catch (err) {
      console.error('Failed to fetch teacher subjects:', err);
    }
  };

  const fetchClassData = async () => {
    try {
      setFetchingData(true);
      const response = await classService.getClassById(id);
      const cls = response.data;
      setFormData({
        className: cls.className || '',
        grade: cls.grade || '',
        subject: cls.subject || '',
        classType: cls.classType || 'THEORY',
        mode: cls.mode || 'PHYSICAL',
        monthlyFee: cls.monthlyFee?.toString() || '',
        teacher: cls.teacher?._id || '',
        capacity: cls.capacity?.toString() || '',
        startTime: cls.startTime || '',
        endTime: cls.endTime || '',
        dayOfWeek: cls.dayOfWeek || '',
        hall: cls.hall?._id || '',
        onlineMeetingLink: cls.onlineMeetingLink || '',
        onlineMeetingDetails: cls.onlineMeetingDetails || '',
        targetMonthYear: cls.targetMonth && cls.targetYear ? `${cls.targetMonth}-${cls.targetYear}` : '',
        paymentRequiredFromWeek: cls.paymentRequiredFromWeek || 2
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch class data');
      navigate('/classes');
    } finally {
      setFetchingData(false);
    }
  };

  const checkTeacherConflict = async () => {
    try {
      setCheckingConflict(true);
      const response = await classService.checkTeacherAvailability({
        teacherId: formData.teacher,
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime,
        excludeClassId: isEdit ? id : undefined
      });

      if (!response.available) {
        const conflict = response.conflictingClass;
        setConflictWarning(
          `Teacher is already assigned to "${conflict.className}" on ${conflict.dayOfWeek} from ${conflict.startTime} to ${conflict.endTime}`
        );
      } else {
        setConflictWarning(null);
      }
    } catch (err) {
      console.error('Failed to check teacher conflict:', err);
    } finally {
      setCheckingConflict(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.grade) newErrors.grade = 'Grade is required';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.classType) newErrors.classType = 'Class type is required';
    if (!formData.mode) newErrors.mode = 'Mode is required';

    if (!formData.monthlyFee) {
      newErrors.monthlyFee = 'Monthly fee is required';
    } else if (parseFloat(formData.monthlyFee) < 0) {
      newErrors.monthlyFee = 'Monthly fee cannot be negative';
    }

    if (!formData.capacity) {
      newErrors.capacity = 'Capacity is required';
    } else if (parseInt(formData.capacity) < 1) {
      newErrors.capacity = 'Capacity must be at least 1';
    }

    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';

    if (formData.startTime && formData.endTime) {
      const start = formData.startTime.replace(':', '');
      const end = formData.endTime.replace(':', '');
      if (parseInt(start) >= parseInt(end)) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    if (!formData.dayOfWeek) newErrors.dayOfWeek = 'Day of week is required';
    if (!formData.targetMonthYear) newErrors.targetMonthYear = 'Target month is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    if (conflictWarning) {
      toast.error('Please resolve the teacher conflict before saving');
      return;
    }

    try {
      setLoading(true);

      const classTitle = formData.className || `${formData.subject} - Grade ${formData.grade}`;
      const [targetMonth, targetYearStr] = formData.targetMonthYear.split('-');

      const payload = {
        ...formData,
        className: classTitle,
        capacity: parseInt(formData.capacity),
        monthlyFee: parseFloat(formData.monthlyFee),
        teacher: formData.teacher || null,
        hall: formData.mode === 'PHYSICAL' ? (formData.hall || null) : null,
        targetMonth,
        targetYear: parseInt(targetYearStr, 10),
        paymentRequiredFromWeek: parseInt(formData.paymentRequiredFromWeek, 10)
      };

      if (isEdit) {
        await classService.updateClass(id, payload);
        toast.success('Class updated successfully');
      } else {
        await classService.createClass(payload);
        toast.success('Class created successfully');
      }

      navigate('/classes');
    } catch (err) {
      const message = err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} class`;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return <LoadingOverlay message="Loading class data..." />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/classes')}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            {isEdit ? 'Edit Class' : 'Add New Class'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isEdit ? 'Update class details' : 'Create a new tuition class'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Class Name removed as requested - generated automatically in handleSubmit */}

          {/* Grade */}
          <div>
            <label className="form-label">
              Grade <span className="text-red-500">*</span>
            </label>
            <select
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              className={`form-input ${errors.grade ? 'border-red-500' : ''}`}
            >
              <option value="">Select Grade</option>
              {[...Array(13)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  Grade {i + 1}
                </option>
              ))}
            </select>
            {errors.grade && <p className="form-error">{errors.grade}</p>}
          </div>

          {/* Subject */}
          <div>
            <label className="form-label">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className={`form-input ${errors.subject ? 'border-red-500' : ''}`}
            >
              <option value="">Select Subject</option>
              {teacherSubjects.map((subject, index) => (
                <option key={index} value={subject}>
                  {subject}
                </option>
              ))}
              {!teacherSubjects.length && <option value="" disabled>Select teacher first</option>}
            </select>
            {errors.subject && <p className="form-error">{errors.subject}</p>}
          </div>

          {/* Class Type */}
          <div>
            <label className="form-label">
              Class Type <span className="text-red-500">*</span>
            </label>
            <select
              name="classType"
              value={formData.classType}
              onChange={handleChange}
              className={`form-input ${errors.classType ? 'border-red-500' : ''}`}
            >
              {CLASS_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.classType && <p className="form-error">{errors.classType}</p>}
          </div>

          {/* Mode */}
          <div>
            <label className="form-label">
              Mode <span className="text-red-500">*</span>
            </label>
            <select
              name="mode"
              value={formData.mode}
              onChange={handleChange}
              className={`form-input ${errors.mode ? 'border-red-500' : ''}`}
            >
              {CLASS_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
            {errors.mode && <p className="form-error">{errors.mode}</p>}
          </div>

          {/* Monthly Fee */}
          <div>
            <label className="form-label">
              Monthly Fee (LKR) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="monthlyFee"
              value={formData.monthlyFee}
              onChange={handleChange}
              className={`form-input ${errors.monthlyFee ? 'border-red-500' : ''}`}
              placeholder="e.g., 2500"
              min="0"
              step="0.01"
            />
            {errors.monthlyFee && <p className="form-error">{errors.monthlyFee}</p>}
          </div>

          {/* Target Month/Year */}
          <div>
            <label className="form-label">
              Class Month <span className="text-red-500">*</span>
            </label>
            <select
              name="targetMonthYear"
              value={formData.targetMonthYear}
              onChange={handleChange}
              className={`form-input ${errors.targetMonthYear ? 'border-red-500' : ''}`}
            >
              <option value="">Select Target Month</option>
              {getTargetMonthOptions(formData.mode).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.targetMonthYear && <p className="form-error">{errors.targetMonthYear}</p>}
          </div>

          {/* Payment Required From Week */}
          <div>
            <label className="form-label">
              Payment Required From Week <span className="text-red-500">*</span>
            </label>
            <select
              name="paymentRequiredFromWeek"
              value={formData.paymentRequiredFromWeek}
              onChange={handleChange}
              className="form-input"
            >
              <option value="1">Week 1 (No Free Content)</option>
              <option value="2">Week 2 (Week 1 is Free)</option>
              <option value="3">Week 3 (Weeks 1-2 are Free)</option>
              <option value="4">Week 4 (Weeks 1-3 are Free)</option>
              <option value="5">Week 5 (Weeks 1-4 are Free)</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Starting from this week, students must pay the monthly fee to access materials/recordings.</p>
          </div>

          {/* Teacher */}
          <div>
            <label className="form-label">Teacher</label>
            <select
              name="teacher"
              value={formData.teacher}
              onChange={handleChange}
              className="form-input"
              disabled={isTeacher}
            >
              <option value="">Select Teacher (Optional)</option>
              {teachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>

          {/* Capacity */}
          <div>
            <label className="form-label">
              Capacity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              className={`form-input ${errors.capacity ? 'border-red-500' : ''}`}
              placeholder="e.g., 25"
              min="1"
            />
            {errors.capacity && <p className="form-error">{errors.capacity}</p>}
          </div>

          {/* Day of Week */}
          <div>
            <label className="form-label">
              Day of Week <span className="text-red-500">*</span>
            </label>
            <select
              name="dayOfWeek"
              value={formData.dayOfWeek}
              onChange={handleChange}
              className={`form-input ${errors.dayOfWeek ? 'border-red-500' : ''}`}
            >
              <option value="">Select Day</option>
              {DAYS_OF_WEEK.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
            {errors.dayOfWeek && <p className="form-error">{errors.dayOfWeek}</p>}
          </div>

          {/* Hall (only for PHYSICAL mode) */}
          {formData.mode === 'PHYSICAL' && (
            <div>
              <label className="form-label">Hall</label>
              <select
                name="hall"
                value={formData.hall}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">Select Hall (Optional)</option>
                {halls
                  .filter(hall => !formData.capacity || hall.capacity >= parseInt(formData.capacity))
                  .map((hall) => (
                    <option key={hall._id} value={hall._id}>
                      {hall.name} ({hall.code}) — Cap: {hall.capacity}
                    </option>
                  ))}
              </select>
            </div>
          )}


          {/* Online Meeting Link (only for ONLINE mode) */}
          {formData.mode === 'ONLINE' && (
            <div className="md:col-span-2">
              <label className="form-label">Meeting Link (Zoom/Teams)</label>
              <input
                type="url"
                name="onlineMeetingLink"
                value={formData.onlineMeetingLink}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., https://zoom.us/j/..."
              />
            </div>
          )}

          {/* Online Meeting Details */}
          {formData.mode === 'ONLINE' && (
            <div className="md:col-span-2">
              <label className="form-label">Meeting Details</label>
              <textarea
                name="onlineMeetingDetails"
                value={formData.onlineMeetingDetails}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Meeting ID, Passcode, etc."
                rows={2}
              />
            </div>
          )}

          {/* Start Time */}
          <div>
            <label className="form-label">
              Start Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className={`form-input ${errors.startTime ? 'border-red-500' : ''}`}
            />
            {errors.startTime && <p className="form-error">{errors.startTime}</p>}
          </div>

          {/* End Time */}
          <div>
            <label className="form-label">
              End Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className={`form-input ${errors.endTime ? 'border-red-500' : ''}`}
            />
            {errors.endTime && <p className="form-error">{errors.endTime}</p>}
          </div>
        </div>

        {/* Conflict Warning */}
        {conflictWarning && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Teacher Conflict Detected</p>
              <p className="text-sm text-yellow-700 mt-1">{conflictWarning}</p>
            </div>
          </div>
        )}

        {checkingConflict && (
          <div className="mt-4 flex items-center gap-2 text-gray-500">
            <Spinner size="sm" />
            <span className="text-sm">Checking teacher availability...</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/classes')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || Boolean(conflictWarning)}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Spinner size="sm" />
                {isEdit ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {isEdit ? 'Update Class' : 'Create Class'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClassForm;



