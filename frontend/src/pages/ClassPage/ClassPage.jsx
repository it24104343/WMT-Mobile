import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  BookOpen, Megaphone, FileText, Upload, Plus, Trash2, X,
  ExternalLink, Download, File, Video, Image, Link2, AlertTriangle,
  Award, ClipboardList, CreditCard, Building, CheckCircle, XCircle, Clock,
  ChevronDown, ChevronUp, Lock, Edit2, CalendarCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import materialService from '../../services/materialService';
import announcementService from '../../services/announcementService';
import classService from '../../services/classService';
import examService from '../../services/examService';
import paymentService from '../../services/paymentService';
import enrollmentService from '../../services/enrollmentService';
import attendanceService from '../../services/attendanceService';
import { Spinner, ConfirmDialog } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';

const TYPE_ICONS = {
  NOTE: FileText, SLIDE: File, VIDEO: Video, LINK: Link2,
  DOCUMENT: File, RECORDING: Video, OTHER: File, IMAGE: Image
};

const PRIORITY_STYLES = {
  LOW: 'border-l-gray-300', NORMAL: 'border-l-blue-400',
  HIGH: 'border-l-orange-400', URGENT: 'border-l-red-500'
};

const MATERIAL_TYPES = [
  { value: 'NOTE', label: 'Note' }, { value: 'SLIDE', label: 'Slide' },
  { value: 'VIDEO', label: 'Video' }, { value: 'LINK', label: 'Link' },
  { value: 'DOCUMENT', label: 'Document' }, { value: 'RECORDING', label: 'Recording' },
  { value: 'OTHER', label: 'Other' }
];

const WEEKS = [1, 2, 3, 4, 5];

const ClassPage = () => {
  const { id: classId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';

  const [tab, setTab] = useState('weekly');
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Weekly Accordion State
  const [expandedWeeks, setExpandedWeeks] = useState([1]);

  // Materials & Announcements
  const [materials, setMaterials] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingWeeklyContent, setLoadingWeeklyContent] = useState(false);

  // Upload Forms
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', description: '', type: 'DOCUMENT', externalLink: '', file: null, week: 1 });
  const [uploading, setUploading] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [titleError, setTitleError] = useState('');

  const [showPostAnnouncement, setShowPostAnnouncement] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ content: '', priority: 'NORMAL', week: 1 });
  const [posting, setPosting] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);

  // Exams
  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(false);

  // Marks
  const [marks, setMarks] = useState([]);
  const [loadingMarks, setLoadingMarks] = useState(false);

  // Attendance
  const [attendanceReport, setAttendanceReport] = useState(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTab, setPaymentTab] = useState('card');
  const [processing, setProcessing] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    confirmVariant: 'danger'
  });
  const [cardForm, setCardForm] = useState({ cardNumber: '', expiry: '', cvv: '' });
  const [receiptFile, setReceiptFile] = useState(null);
  const [enrollmentData, setEnrollmentData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null); // null | 'paid' | 'pending' | 'due'

  useEffect(() => { fetchClassInfo(); }, [classId]);
  useEffect(() => { if (tab === 'weekly') fetchWeeklyContent(); }, [tab]);
  useEffect(() => { if (tab === 'exams') fetchExams(); }, [tab]);
  useEffect(() => { if (tab === 'marks' && isStudent) fetchMarks(); }, [tab]);
  useEffect(() => { if (tab === 'attendance' && isStudent) fetchAttendance(); }, [tab]);

  // Fetch enrollment data for student payment flow
  useEffect(() => {
    if (isStudent && classInfo) fetchEnrollmentStatus();
  }, [classInfo]);

  const fetchClassInfo = async () => {
    try {
      setLoading(true);
      const r = await classService.getClassById(classId);
      setClassInfo(r.data);
    } catch { toast.error('Failed to load class info'); }
    finally { setLoading(false); }
  };

  const fetchEnrollmentStatus = async () => {
    try {
      const r = await enrollmentService.getStudentEnrollments(user.profileId);
      const enrollment = r.data?.find(e => e.class?._id === classId || e.class === classId);
      if (enrollment) {
        setEnrollmentData(enrollment);
        if (enrollment.currentMonthPayment?.status === 'COMPLETED') {
          setPaymentStatus('paid');
        } else if (enrollment.currentMonthPayment?.status === 'PENDING') {
          setPaymentStatus('pending');
        } else {
          setPaymentStatus('due');
        }
      }
    } catch (err) { console.error('Failed to fetch enrollment status:', err); }
  };

  const fetchWeeklyContent = async () => {
    try {
      setLoadingWeeklyContent(true);
      const [matsRes, annsRes] = await Promise.all([
        materialService.getMaterials({ classId, limit: 100 }),
        announcementService.getAnnouncements({ classId, limit: 100 })
      ]);
      setMaterials(matsRes.data || []);
      setAnnouncements(annsRes.data || []);
    } catch { toast.error('Failed to load weekly content'); }
    finally { setLoadingWeeklyContent(false); }
  };

  const fetchExams = async () => {
    try {
      setLoadingExams(true);
      const r = await examService.getExams({ classId, limit: 50 });
      setExams(r.data || []);
    } catch { toast.error('Failed to load exams'); }
    finally { setLoadingExams(false); }
  };

  const fetchMarks = async () => {
    try {
      setLoadingMarks(true);
      const r = await examService.getStudentMarks(classId);
      setMarks(r.data || []);
    } catch { toast.error('Failed to load marks'); }
    finally { setLoadingMarks(false); }
  };

  const fetchAttendance = async () => {
    try {
      setLoadingAttendance(true);
      const r = await attendanceService.getStudentReport(user.profileId);
      const classReport = r.data?.classes?.find(c => c.class._id === classId);
      setAttendanceReport(classReport || { records: [], percentage: 0 });
    } catch { toast.error('Failed to load attendance'); }
    finally { setLoadingAttendance(false); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.title) { toast.error('Title required'); return; }
    if (titleError) { toast.error('Please fix title errors'); return; }
    
    try {
      setUploading(true);
      const formData = new FormData();
      if (!editingMaterialId) formData.append('classId', classId);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('type', uploadForm.type);
      formData.append('week', uploadForm.week);
      if (uploadForm.externalLink) formData.append('externalLink', uploadForm.externalLink);
      if (uploadForm.file) formData.append('file', uploadForm.file);

      if (editingMaterialId) {
        await materialService.updateMaterial(editingMaterialId, formData);
        toast.success('Material updated');
      } else {
        await materialService.createMaterial(formData);
        toast.success('Material uploaded');
      }
      
      handleCloseUploadForm();
      fetchWeeklyContent();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to upload/update'); }
    finally { setUploading(false); }
  };

  const handleCloseUploadForm = () => {
    setShowUpload(false);
    setUploadForm({ title: '', description: '', type: 'DOCUMENT', externalLink: '', file: null, week: 1 });
    setEditingMaterialId(null);
    setTitleError('');
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setUploadForm(p => ({ ...p, title: val }));
    if (val.length > 150) {
      setTitleError('Title must be less than 150 characters');
      return;
    }
    if (/[^a-zA-Z0-9 ]/g.test(val)) {
      setTitleError('Only alphanumeric characters and spaces are allowed');
      return;
    }
    setTitleError('');
  };

  const handleEditMaterial = (mat) => {
    setUploadForm({
      title: mat.title || '',
      description: mat.description || '',
      type: mat.type || 'DOCUMENT',
      externalLink: mat.externalLink || '',
      file: null,
      week: mat.week || 1
    });
    setEditingMaterialId(mat._id);
    setShowUpload(true);
  };

  const handleDeleteMaterial = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Material',
      message: 'Delete this material?',
      confirmText: 'Delete',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await materialService.deleteMaterial(id);
          toast.success('Material deleted');
          fetchWeeklyContent();
        } catch { toast.error('Failed to delete'); }
      }
    });
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementForm.content) { toast.error('Content required'); return; }
    try {
      setPosting(true);
      if (editingAnnouncementId) {
        await announcementService.updateAnnouncement(editingAnnouncementId, announcementForm);
        toast.success('Announcement updated');
      } else {
        await announcementService.createAnnouncement({ classId, ...announcementForm });
        toast.success('Announcement posted');
      }
      handleCloseAnnouncementForm();
      fetchWeeklyContent();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setPosting(false); }
  };

  const handleCloseAnnouncementForm = () => {
    setShowPostAnnouncement(false);
    setAnnouncementForm({ content: '', priority: 'NORMAL', week: 1 });
    setEditingAnnouncementId(null);
  };

  const handleEditAnnouncement = (ann) => {
    setAnnouncementForm({
      content: ann.content || '',
      priority: ann.priority || 'NORMAL',
      week: ann.week || 1
    });
    setEditingAnnouncementId(ann._id);
    setShowPostAnnouncement(true);
  };

  const handleDeleteAnnouncement = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Announcement',
      message: 'Delete this announcement?',
      confirmText: 'Delete',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await announcementService.deleteAnnouncement(id);
          toast.success('Announcement deleted');
          fetchWeeklyContent();
        } catch { toast.error('Failed'); }
      }
    });
  };

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(.{4})/g, '$1 ').trim();
    setCardForm(p => ({ ...p, cardNumber: value.substring(0, 19) }));
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    setCardForm(p => ({ ...p, expiry: value }));
  };

  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setCardForm(p => ({ ...p, cvv: value.substring(0, 4) }));
  };

  const validateCardDetails = () => {
    const cleanCard = cardForm.cardNumber.replace(/\s/g, '');
    if (cleanCard.length !== 16) {
      toast.error('Card number must be 16 digits');
      return false;
    }
    
    if (!cardForm.expiry.includes('/')) {
      toast.error('Invalid expiry date format');
      return false;
    }

    const [month, year] = cardForm.expiry.split('/');
    if (!month || !year || month.length !== 2 || year.length !== 2) {
      toast.error('Expiry date must be MM/YY');
      return false;
    }

    const m = parseInt(month, 10);
    if (m < 1 || m > 12) {
      toast.error('Invalid expiry month');
      return false;
    }

    const currentDate = new Date();
    const currentYear = parseInt(currentDate.getFullYear().toString().slice(-2), 10);
    const currentMonth = currentDate.getMonth() + 1;
    const y = parseInt(year, 10);
    
    if (y < currentYear || (y === currentYear && m < currentMonth)) {
        toast.error('Card has expired');
        return false;
    }

    if (cardForm.cvv.length < 3) {
      toast.error('CVV must be 3 or 4 digits');
      return false;
    }

    return true;
  };

  const handleCardPayment = async () => {
    if (!enrollmentData) return;
    if (!validateCardDetails()) return;
    try {
      setProcessing(true);
      const now = new Date();
      await paymentService.processGatewayPayment({
        enrollmentId: enrollmentData._id,
        month: classInfo.targetMonth ? new Date(`${classInfo.targetMonth} 1, 2000`).getMonth() + 1 : now.getMonth() + 1,
        year: classInfo.targetYear || now.getFullYear(),
        cardNumber: cardForm.cardNumber.replace(/\s/g, '')
      });
      toast.success('Payment successful! All materials are now unlocked.');
      setShowPaymentModal(false);
      setPaymentStatus('paid');
      fetchEnrollmentStatus();
      fetchWeeklyContent();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally { setProcessing(false); }
  };

  const handleBankTransfer = async () => {
    if (!enrollmentData || !receiptFile) {
      toast.error('Please select a receipt image');
      return;
    }
    try {
      setProcessing(true);
      const now = new Date();
      const formData = new FormData();
      formData.append('enrollmentId', enrollmentData._id);
      formData.append('month', classInfo.targetMonth ? new Date(`${classInfo.targetMonth} 1, 2000`).getMonth() + 1 : now.getMonth() + 1);
      formData.append('year', classInfo.targetYear || now.getFullYear());
      formData.append('receipt', receiptFile);

      await paymentService.submitBankTransfer(formData);
      toast.success('Receipt submitted! Awaiting admin approval.');
      setShowPaymentModal(false);
      setPaymentStatus('pending');
      fetchEnrollmentStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit receipt');
    } finally { setProcessing(false); }
  };

  const toggleWeek = (week) => {
    setExpandedWeeks(prev => prev.includes(week) ? prev.filter(w => w !== week) : [...prev, week]);
  };

  const getBackendUrl = (path) => {
    if (!path) return '';
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    if (base.startsWith('http')) {
      return base.replace('/api', '') + path;
    }
    if (window.location.hostname === 'localhost') {
      return `http://localhost:5000${path}`;
    }
    return path;
  };

  const handleDownloadFile = async (url, filename) => {
    try {
      const fullUrl = getBackendUrl(url);
      const res = await fetch(fullUrl);
      const blob = await res.blob();
      const objUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = filename || 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(objUrl);
    } catch (err) {
      toast.error('Failed to download file');
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!classInfo) return <div className="card text-center py-12 text-gray-500">Class not found</div>;

  const isExamsLocked = () => {
    if (canManage) return false;
    // Exams are locked if past free period and not paid
    return paymentStatus !== 'paid' && classInfo?.paymentRequiredFromWeek <= 4; // assumption: if payment is required at all, exams are locked for unpaid
  };

  const isLocked = (week) => {
    if (canManage) return false;
    if (isAdmissionPending) return true; // Admission fee is absolute requirement
    if (week < classInfo?.paymentRequiredFromWeek) return false;
    return paymentStatus !== 'paid';
  };

  const paymentRequiredFromWeek = classInfo.paymentRequiredFromWeek || 2;
  const isAdmissionPending = isStudent && !enrollmentData?.admissionFeePaid && enrollmentData?.admissionFeeAmount > 0;
  const isFullyPaid = !isStudent || (paymentStatus === 'paid' && !isAdmissionPending);
  const shouldShowPaymentGate = isStudent && !isFullyPaid;

  return (
    <div>
      {/* Class Header */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 dark:text-gray-50">{classInfo.className}</h1>
            <p className="text-gray-500 dark:text-gray-400">{classInfo.subject} · Grade {classInfo.grade} · {classInfo.dayOfWeek} {classInfo.startTime}–{classInfo.endTime}</p>
            {classInfo.targetMonth && classInfo.targetYear && (
              <span className="inline-block mt-2 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                {classInfo.targetMonth} {classInfo.targetYear} Class
              </span>
            )}
          </div>
          {classInfo.onlineMeetingLink && (
            <a href={classInfo.onlineMeetingLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary text-sm">
              <ExternalLink className="w-4 h-4" /> Join Meeting
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b overflow-x-auto">
        <button onClick={() => setTab('weekly')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${tab === 'weekly' ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
          <FileText className="w-4 h-4" /> Weekly Content
        </button>
        <button onClick={() => setTab('exams')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${tab === 'exams' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <ClipboardList className="w-4 h-4" /> Exams
        </button>
        {isStudent && (
          <button onClick={() => setTab('marks')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${tab === 'marks' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <Award className="w-4 h-4" /> Marks
          </button>
        )}
        {isStudent && (
          <button onClick={() => setTab('attendance')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${tab === 'attendance' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <CalendarCheck className="w-4 h-4" /> Attendance
          </button>
        )}
      </div>

      {/* ── Weekly Content Tab ── */}
      {tab === 'weekly' && (
        <>
          {/* Payment gate alert for students */}
          {shouldShowPaymentGate && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="font-medium text-orange-800">
                    {isAdmissionPending ? 'Admission Fee Required' : 'Payment Required'}
                  </p>
                  <p className="text-sm text-orange-600">
                    {isAdmissionPending 
                      ? `You must pay the admission fee (LKR ${enrollmentData.admissionFeeAmount}) to access this class.`
                      : (paymentStatus === 'pending'
                        ? 'Your bank transfer receipt is being reviewed by admin.'
                        : `You must pay the monthly fee to access materials from Week ${paymentRequiredFromWeek} onwards.`)}
                  </p>
                </div>
              </div>
              {paymentStatus !== 'pending' && enrollmentData && (
                <button onClick={() => setShowPaymentModal(true)} className="btn btn-primary text-sm whitespace-nowrap">
                  <CreditCard className="w-4 h-4" /> Pay Now
                </button>
              )}
            </div>
          )}

          {canManage && (
            <div className="flex items-center justify-end gap-3 mb-6">
              <button onClick={() => setShowPostAnnouncement(true)} className="btn btn-secondary text-sm">
                <Megaphone className="w-4 h-4" /> Post Announcement
              </button>
              <button onClick={() => setShowUpload(true)} className="btn btn-primary text-sm">
                <Upload className="w-4 h-4" /> Upload Material
              </button>
            </div>
          )}

          {loadingWeeklyContent ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> : (
            <div className="space-y-4">
              {WEEKS.map(week => {
                const isExpanded = expandedWeeks.includes(week);
                const isLockedForStudent = isStudent && !isFullyPaid && week >= paymentRequiredFromWeek;
                const weekMaterials = materials.filter(m => m.week === week);
                const weekAnnouncements = announcements.filter(a => a.week === week);
                
                // Show week even if empty for teachers, but hide empty weeks for students
                if (isStudent && weekMaterials.length === 0 && weekAnnouncements.length === 0 && !isLockedForStudent) {
                  return null;
                }

                return (
                  <div key={week} className={`border rounded-xl overflow-hidden transition-all ${isExpanded ? 'shadow-md border-primary-200' : 'bg-white border-gray-200'}`}>
                    <button
                      onClick={() => toggleWeek(week)}
                      className={`w-full flex items-center justify-between p-4 text-left transition-colors ${isExpanded ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center gap-3">
                        {isLockedForStudent ? (
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                            <Lock className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isExpanded ? 'bg-primary-200 text-primary-800' : 'bg-gray-100 text-gray-600'}`}>
                            {week}
                          </div>
                        )}
                        <span className={`font-semibold ${isLockedForStudent ? 'text-gray-500' : 'text-gray-900'}`}>Week {week}</span>
                        {!isLockedForStudent && (
                          <div className="flex items-center gap-2 ml-2">
                            {weekMaterials.length > 0 && <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{weekMaterials.length} materials</span>}
                            {weekAnnouncements.length > 0 && <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{weekAnnouncements.length} announcements</span>}
                          </div>
                        )}
                      </div>
                      <div className="text-gray-400">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 bg-white border-t border-gray-100">
                        {isLockedForStudent ? (
                          <div className="text-center py-8">
                            <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h4 className="text-gray-900 font-medium mb-1">Content Locked</h4>
                            <p className="text-gray-500 text-sm mb-4">Please pay the monthly fee to unlock Week {week} materials.</p>
                            <button onClick={() => setShowPaymentModal(true)} className="btn btn-primary mx-auto">
                              <CreditCard className="w-4 h-4" /> Pay Monthly Fee
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            
                            {/* Online Meeting Link mapped directly to the week */}
                            {classInfo.mode === 'ONLINE' && classInfo.onlineMeetingLink && (
                              <div className="p-4 rounded-lg border border-blue-100 bg-blue-50 flex items-center justify-between mb-3 shadow-sm">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Video className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900 dark:text-gray-50 text-sm">Live Class Link</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Virtual Meeting Details</div>
                                    {classInfo.onlineMeetingDetails && <p className="text-xs text-gray-600 mt-1">{classInfo.onlineMeetingDetails}</p>}
                                  </div>
                                </div>
                                <a href={classInfo.onlineMeetingLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary text-sm">
                                  <ExternalLink className="w-4 h-4" /> Join Class
                                </a>
                              </div>
                            )}

                            {weekAnnouncements.length > 0 && (
                              <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                  <Megaphone className="w-4 h-4" /> Announcements
                                </h4>
                                {weekAnnouncements.map(ann => (
                                  <div key={ann._id} className={`p-4 rounded-lg border-l-4 bg-gray-50 ${PRIORITY_STYLES[ann.priority] || PRIORITY_STYLES.NORMAL}`}>
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        {ann.priority === 'URGENT' && <div className="text-red-600 text-xs font-bold mb-1">URGENT</div>}
                                        <p className="text-gray-900 text-sm">{ann.content}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">by {ann.createdBy?.username || 'Teacher'} · {new Date(ann.createdAt).toLocaleDateString()}</p>
                                      </div>
                                      {canManage && (
                                        <div className="flex items-center gap-1 ml-2">
                                          <button onClick={() => handleEditAnnouncement(ann)} className="p-1.5 text-gray-400 hover:text-blue-500 rounded">
                                            <Edit2 className="w-4 h-4" />
                                          </button>
                                          <button onClick={() => handleDeleteAnnouncement(ann._id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {weekMaterials.length > 0 && (
                              <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                  <FileText className="w-4 h-4" /> Materials & Recordings
                                </h4>
                                {weekMaterials.map(mat => {
                                  const Icon = TYPE_ICONS[mat.type] || File;
                                  return (
                                    <div key={mat._id} className="p-4 rounded-lg border border-gray-100 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                          <Icon className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <div>
                                          <div className="font-medium text-gray-900 dark:text-gray-50 text-sm">{mat.title}</div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {mat.type} · by {mat.uploadedBy?.username || 'Unknown'} · {new Date(mat.createdAt).toLocaleDateString()}
                                          </div>
                                          {mat.description && <p className="text-xs text-gray-600 mt-1">{mat.description}</p>}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {mat.fileUrl && (
                                          <button onClick={() => handleDownloadFile(mat.fileUrl, mat.title)} className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Download">
                                            <Download className="w-4 h-4" />
                                          </button>
                                        )}
                                        {mat.externalLink && (
                                          <a href={mat.externalLink} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Open Link">
                                            <ExternalLink className="w-4 h-4" />
                                          </a>
                                        )}
                                        {canManage && (
                                          <>
                                            <button onClick={() => handleEditMaterial(mat)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors title='Edit'">
                                              <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteMaterial(mat._id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors title='Delete'">
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {weekMaterials.length === 0 && weekAnnouncements.length === 0 && classInfo.mode !== 'ONLINE' && canManage && (
                              <div className="text-center py-6 text-gray-500 text-sm">
                                No contents uploaded for Week {week} yet.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Upload Material Modal */}
          {showUpload && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-lg font-semibold">{editingMaterialId ? 'Edit' : 'Upload'} Material</h2>
                  <button onClick={handleCloseUploadForm} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleUpload} className="p-6 space-y-4">
                  <div>
                    <label className="form-label">Week <span className="text-red-500">*</span></label>
                    <select value={uploadForm.week} onChange={e => setUploadForm(p => ({ ...p, week: parseInt(e.target.value) }))} className="form-input text-gray-900 border-gray-300 font-medium">
                      {WEEKS.map(w => <option key={w} value={w}>Week {w}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Title <span className="text-red-500">*</span></label>
                    <input type="text" value={uploadForm.title} onChange={handleTitleChange} className={`form-input ${titleError ? 'border-red-500' : ''}`} placeholder="e.g., Week 5 Notes" />
                    {titleError && <p className="text-xs text-red-500 mt-1">{titleError}</p>}
                  </div>
                  <div>
                    <label className="form-label">Type</label>
                    <select value={uploadForm.type} onChange={e => setUploadForm(p => ({ ...p, type: e.target.value }))} className="form-input">
                      {MATERIAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">File</label>
                    <input type="file" onChange={e => setUploadForm(p => ({ ...p, file: e.target.files[0] }))} className="form-input" />
                    <p className="text-xs text-gray-400 mt-1">Max 50MB. PDF, docs, images, videos, audio</p>
                  </div>
                  <div>
                    <label className="form-label">External Link (alternative to file)</label>
                    <input type="url" value={uploadForm.externalLink} onChange={e => setUploadForm(p => ({ ...p, externalLink: e.target.value }))} className="form-input" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="form-label">Description</label>
                    <textarea value={uploadForm.description} onChange={e => setUploadForm(p => ({ ...p, description: e.target.value }))} className="form-input" rows={2} placeholder="Optional..." />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={handleCloseUploadForm} className="btn btn-secondary">Cancel</button>
                    <button type="submit" disabled={uploading} className="btn btn-primary disabled:opacity-50">
                      {uploading ? <><Spinner size="sm" /> {editingMaterialId ? 'Updating...' : 'Uploading...'}</> : <><Upload className="w-4 h-4" /> {editingMaterialId ? 'Update' : 'Upload'}</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Post Announcement Modal */}
          {showPostAnnouncement && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-lg font-semibold">{editingAnnouncementId ? 'Edit' : 'Post'} Announcement</h2>
                  <button onClick={handleCloseAnnouncementForm} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handlePostAnnouncement} className="p-6 space-y-4">
                  <div>
                    <label className="form-label">Week <span className="text-red-500">*</span></label>
                    <select value={announcementForm.week} onChange={e => setAnnouncementForm(p => ({ ...p, week: parseInt(e.target.value) }))} className="form-input text-gray-900 border-gray-300 font-medium">
                      {WEEKS.map(w => <option key={w} value={w}>Week {w}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Content <span className="text-red-500">*</span></label>
                    <textarea value={announcementForm.content} onChange={e => setAnnouncementForm(p => ({ ...p, content: e.target.value }))} className="form-input" rows={4} placeholder="Enter announcement..." />
                  </div>
                  <div>
                    <label className="form-label">Priority</label>
                    <select value={announcementForm.priority} onChange={e => setAnnouncementForm(p => ({ ...p, priority: e.target.value }))} className="form-input">
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={handleCloseAnnouncementForm} className="btn btn-secondary">Cancel</button>
                    <button type="submit" disabled={posting} className="btn btn-primary disabled:opacity-50">
                      {posting ? <><Spinner size="sm" /> {editingAnnouncementId ? 'Updating...' : 'Posting...'}</> : <><Megaphone className="w-4 h-4" /> {editingAnnouncementId ? 'Update' : 'Post'}</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Exams Tab ── */}
      {tab === 'exams' && (
        <>
          {loadingExams ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> :
          exams.length === 0 ? (
            <div className="card text-center py-12">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50">No exams yet</h3>
            </div>
          ) : (
            <div className="space-y-3">
              {exams.filter(e => canManage || e.isPublished).map(exam => {
                if (isStudent && paymentStatus !== 'paid' && classInfo?.paymentRequiredFromWeek <= 5) return null; // Hide if not paid

                return (
                <div 
                  key={exam._id} 
                  className={`card ${canManage ? '' : 'hover:shadow-md transition-shadow cursor-pointer'}`}
                  onClick={() => { if (!canManage) navigate(`/exams/${exam._id}/take`); }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <ClipboardList className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-50">{exam.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {exam.term?.replace('_', ' ')} · {exam.paperType} · {exam.totalMarks} marks · {exam.duration} mins
                        </div>
                        {exam.scheduledDate && (
                          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(exam.scheduledDate).toLocaleDateString()} {exam.startTime && `${exam.startTime}–${exam.endTime}`}
                            {exam.endDate && ` to ${new Date(exam.endDate).toLocaleDateString()}`}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canManage && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${exam.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {exam.isPublished ? 'Published' : 'Draft'}
                        </span>
                      )}
                      {exam.resultsPublished && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">Results Out</span>
                      )}
                    </div>
                  </div>
                </div>
              )})}
            </div>
          )}
        </>
      )}

      {/* ── Marks Tab (Student only) ── */}
      {tab === 'marks' && isStudent && (
        <>
          {loadingMarks ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> :
          marks.length === 0 ? (
            <div className="card text-center py-12">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50">No marks available</h3>
              <p className="text-gray-500 text-sm mt-1">Your marks will appear here once exams are graded</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Exam</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Term</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Total</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Your Score</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Percentage</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {marks.map(m => {
                      const score = m.attempt?.finalScore;
                      const pct = score != null ? Math.round((score / m.totalMarks) * 100) : null;
                      const passed = score != null && score >= m.passingMarks;

                      return (
                        <tr key={m._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900 dark:text-gray-50 text-sm">{m.title}</div>
                            {m.scheduledDate && (
                              <div className="text-xs text-gray-400">{new Date(m.scheduledDate).toLocaleDateString()}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{m.term?.replace('_', ' ') || '-'}</td>
                          <td className="px-4 py-3 text-center text-sm font-medium">{m.totalMarks}</td>
                          <td className="px-4 py-3 text-center">
                            {!m.attempt ? (
                              <span className="text-xs text-gray-400">Not attempted</span>
                            ) : !m.resultsPublished ? (
                              <span className="text-xs text-gray-400">Pending</span>
                            ) : score != null ? (
                              <span className={`font-bold text-sm ${passed ? 'text-green-600' : 'text-red-600'}`}>{score}</span>
                            ) : (
                              <span className="text-xs text-gray-400">Grading...</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {pct != null && m.resultsPublished ? (
                              <span className={`font-medium text-sm ${pct >= 50 ? 'text-green-600' : 'text-red-600'}`}>{pct}%</span>
                            ) : <span className="text-xs text-gray-400">-</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {!m.attempt ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                <XCircle className="w-3 h-3" /> Not taken
                              </span>
                            ) : !m.resultsPublished ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                                <Clock className="w-3 h-3" /> Awaiting
                              </span>
                            ) : passed ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3" /> Passed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                <XCircle className="w-3 h-3" /> Failed
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Attendance Tab (Student only) ── */}
      {tab === 'attendance' && isStudent && (
        <>
          {loadingAttendance ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> :
          !attendanceReport || !attendanceReport.records || attendanceReport.records.length === 0 ? (
            <div className="card text-center py-12">
              <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50">No attendance records</h3>
              <p className="text-gray-500 text-sm mt-1">Attendance hasn't been marked for any sessions yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="card text-center sm:text-left flex flex-col sm:flex-row items-center justify-between p-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Attendance Summary</h3>
                  <p className="text-gray-500 text-sm">You have attended {attendanceReport.attendedCount} out of {attendanceReport.stats?.total} sessions.</p>
                </div>
                <div className={`mt-4 sm:mt-0 text-3xl font-bold ${attendanceReport.meetsThreshold ? 'text-green-600' : 'text-red-600'}`}>
                  {attendanceReport.percentage}%
                </div>
              </div>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Date</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Class Status</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Your Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {attendanceReport.records.map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900 dark:text-gray-50 text-sm">{new Date(r.date).toLocaleDateString()}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{r.sessionStatus || 'COMPLETED'}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {r.status === 'PRESENT' ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3" /> Present
                              </span>
                            ) : r.status === 'LATE' ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                                <Clock className="w-3 h-3" /> Late
                              </span>
                            ) : r.status === 'EXCUSED' ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                <FileText className="w-3 h-3" /> Excused
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                <XCircle className="w-3 h-3" /> Absent
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Payment Modal ── */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Pay Monthly Fee</h2>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Fee</p>
                <p className="text-3xl font-bold text-gray-900">LKR {classInfo.monthlyFee?.toLocaleString()}</p>
                <p className="text-xs font-medium text-blue-600 mt-2 bg-blue-50 py-1 px-3 rounded-full inline-block">
                  For {classInfo.targetMonth} {classInfo.targetYear}
                </p>
              </div>

              {/* Payment method tabs */}
              <div className="flex gap-2 mb-4">
                <button onClick={() => setPaymentTab('card')} className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${paymentTab === 'card' ? 'bg-primary-50 text-primary-700 border-2 border-primary-200' : 'bg-gray-50 text-gray-500 border-2 border-transparent hover:bg-gray-100'}`}>
                  <CreditCard className="w-4 h-4" /> Card Payment
                </button>
                <button onClick={() => setPaymentTab('bank')} className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${paymentTab === 'bank' ? 'bg-primary-50 text-primary-700 border-2 border-primary-200' : 'bg-gray-50 text-gray-500 border-2 border-transparent hover:bg-gray-100'}`}>
                  <Building className="w-4 h-4" /> Bank Transfer
                </button>
              </div>

              {paymentTab === 'card' && (
                <div className="space-y-3">
                  <div>
                    <label className="form-label">Card Number</label>
                    <input type="text" value={cardForm.cardNumber} onChange={handleCardNumberChange} className="form-input" placeholder="1234 5678 9012 3456" maxLength={19} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Expiry</label>
                      <input type="text" value={cardForm.expiry} onChange={handleExpiryChange} className="form-input" placeholder="MM/YY" maxLength={5} />
                    </div>
                    <div>
                      <label className="form-label">CVV</label>
                      <input type="text" value={cardForm.cvv} onChange={handleCvvChange} className="form-input" placeholder="123" maxLength={4} />
                    </div>
                  </div>
                  <button onClick={handleCardPayment} disabled={processing || !cardForm.cardNumber} className="btn btn-primary w-full disabled:opacity-50 mt-4">
                    {processing ? <><Spinner size="sm" /> Processing...</> : <><CreditCard className="w-4 h-4" /> Pay LKR {classInfo.monthlyFee?.toLocaleString()}</>}
                  </button>
                </div>
              )}

              {paymentTab === 'bank' && (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                    <p className="font-medium text-gray-800 mb-1">Bank Transfer Instructions:</p>
                    <p>1. Transfer <strong>LKR {classInfo.monthlyFee?.toLocaleString()}</strong> to the institute bank account</p>
                    <p>2. Upload a photo/screenshot of the receipt below</p>
                    <p>3. Admin will review and approve your payment</p>
                  </div>
                  <div>
                    <label className="form-label">Upload Receipt <span className="text-red-500">*</span></label>
                    <input type="file" accept="image/*,.pdf" onChange={e => setReceiptFile(e.target.files[0])} className="form-input" />
                    <p className="text-xs text-gray-400 mt-1">JPEG, PNG, or PDF. Max 10MB</p>
                  </div>
                  <button onClick={handleBankTransfer} disabled={processing || !receiptFile} className="btn btn-primary w-full disabled:opacity-50 mt-4">
                    {processing ? <><Spinner size="sm" /> Submitting...</> : <><Building className="w-4 h-4" /> Submit Receipt</>}
                  </button>
                </div>
              )}
            </div>
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

export default ClassPage;





