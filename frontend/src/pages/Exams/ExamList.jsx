import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Plus, FileText, Eye, EyeOff, Trash2, X, ChevronRight,
  Award, BarChart3, Clock, CheckCircle, Edit
} from 'lucide-react';
import examService from '../../services/examService';
import classService from '../../services/classService';
import { Spinner, ConfirmDialog } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

const TERMS = [
  { value: 'TERM_1', label: 'Term 1' }, { value: 'TERM_2', label: 'Term 2' },
  { value: 'TERM_3', label: 'Term 3' }, { value: 'MID_TERM', label: 'Mid Term' },
  { value: 'FINAL', label: 'Final' }, { value: 'QUIZ', label: 'Quiz' },
  { value: 'OTHER', label: 'Other' }
];
const PAPER_TYPES = [
  { value: 'MCQ', label: 'MCQ Only' }, { value: 'WRITTEN', label: 'Written Only' },
  { value: 'MIXED', label: 'Mixed' }
];

const ExamList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canManage = user?.role === 'ADMIN' || user?.role === 'TEACHER';

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [filterClass, setFilterClass] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

  // Create/Edit modal
  const [showCreate, setShowCreate] = useState(false);
  const [editingExamId, setEditingExamId] = useState(null);
  const [createForm, setCreateForm] = useState({
    classId: '', title: '', description: '', subject: '', term: 'OTHER',
    paperType: 'MIXED', totalMarks: 100, passingMarks: 40, duration: 60,
    scheduledDate: '', endDate: '', startTime: '', endTime: ''
  });
  const [creating, setCreating] = useState(false);

  // Add/Edit question
  const [showAddQ, setShowAddQ] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [examDetail, setExamDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [qForm, setQForm] = useState({ type: 'MCQ', content: '', marks: 1, lineCount: 5, explanation: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }] });
  const [addingQ, setAddingQ] = useState(false);

  // Results view
  const [showResults, setShowResults] = useState(null);
  const [resultsData, setResultsData] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);

  // Grading view
  const [gradeAttemptData, setGradeAttemptData] = useState(null);
  const [grading, setGrading] = useState(false);
  const [marksForm, setMarksForm] = useState({});

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    confirmVariant: 'danger'
  });

  const chartsRef = useRef(null);

  // Auto-calculate end time
  useEffect(() => {
    if (createForm.startTime && createForm.duration) {
      const [h, m] = createForm.startTime.split(':');
      if (h && m) {
        const start = new Date();
        start.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
        start.setMinutes(start.getMinutes() + parseInt(createForm.duration, 10));
        const eh = String(start.getHours()).padStart(2, '0');
        const em = String(start.getMinutes()).padStart(2, '0');
        const calculatedEnd = `${eh}:${em}`;
        if (createForm.endTime !== calculatedEnd) {
          setCreateForm(p => ({ ...p, endTime: calculatedEnd }));
        }
      }
    }
  }, [createForm.startTime, createForm.duration]);

  useEffect(() => { fetchClasses(); }, []);
  useEffect(() => { fetchExams(); }, [filterClass, pagination.currentPage]);

  const fetchClasses = async () => {
    try {
      const r = await classService.getClasses({ limit: 100 });
      setClasses(r.data);
    } catch { /* ignore */ }
  };

  const fetchExams = async () => {
    try {
      setLoading(true);
      const r = await examService.getExams({ classId: filterClass || undefined, page: pagination.currentPage, limit: 15 });
      setExams(r.data);
      setPagination(r.pagination);
    } catch { toast.error('Failed to fetch exams'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.classId || !createForm.title) { toast.error('Class and title required'); return; }
    try {
      setCreating(true);
      if (editingExamId) {
        await examService.updateExam(editingExamId, createForm);
        toast.success('Exam updated');
        if (selectedExam === editingExamId) {
          const r = await examService.getExamById(editingExamId);
          setExamDetail(r.data);
        }
      } else {
        await examService.createExam(createForm);
        toast.success('Exam created');
      }
      setShowCreate(false);
      setEditingExamId(null);
      fetchExams();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setCreating(false); }
  };

  const openDetail = async (exam) => {
    try {
      setLoadingDetail(true);
      setSelectedExam(exam._id);
      const r = await examService.getExamById(exam._id);
      setExamDetail(r.data);
    } catch { toast.error('Failed to load exam'); setSelectedExam(null); }
    finally { setLoadingDetail(false); }
  };

  const handleCardClick = (exam) => {
    if (canManage) openDetail(exam);
    else navigate(`/exams/${exam._id}/take`);
  };

  const closeDetail = () => { setSelectedExam(null); setExamDetail(null); };

  const handleTogglePublish = async (id) => {
    try {
      const r = await examService.togglePublish(id);
      toast.success(r.message);
      fetchExams();
      if (examDetail) { const d = await examService.getExamById(id); setExamDetail(d.data); }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleToggleResults = async (id) => {
    try {
      const r = await examService.toggleResultsPublish(id);
      toast.success(r.message);
      if (examDetail) { const d = await examService.getExamById(id); setExamDetail(d.data); }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Exam',
      message: 'Delete this exam?',
      confirmText: 'Delete',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await examService.deleteExam(id);
          toast.success('Exam deleted');
          closeDetail(); fetchExams();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
      }
    });
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!qForm.content) { toast.error('Question content required'); return; }
    try {
      setAddingQ(true);
      if (editingQuestionId) {
        await examService.updateQuestion(selectedExam, editingQuestionId, qForm);
        toast.success('Question updated');
      } else {
        await examService.addQuestion(selectedExam, qForm);
        toast.success('Question added');
      }
      setShowAddQ(false);
      setEditingQuestionId(null);
      setQForm({ type: 'MCQ', content: '', marks: 1, lineCount: 5, explanation: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }] });
      const d = await examService.getExamById(selectedExam);
      setExamDetail(d.data);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setAddingQ(false); }
  };

  const handleDeleteQuestion = (qId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Question',
      message: 'Delete this question?',
      confirmText: 'Delete',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await examService.deleteQuestion(selectedExam, qId);
          toast.success('Question deleted');
          const d = await examService.getExamById(selectedExam);
          setExamDetail(d.data);
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
      }
    });
  };

  const getDistributionData = () => {
    if (!resultsData?.attempts) return [];
    const ranges = { '0-25%': 0, '26-50%': 0, '51-75%': 0, '76-100%': 0 };
    resultsData.attempts.forEach(a => {
      if (a.finalScore == null) return;
      const p = (Number(a.finalScore) / Number(resultsData.exam?.totalMarks || 100)) * 100;
      if (p <= 25) ranges['0-25%']++;
      else if (p <= 50) ranges['26-50%']++;
      else if (p <= 75) ranges['51-75%']++;
      else ranges['76-100%']++;
    });
    return Object.keys(ranges).map(k => ({ name: k, count: ranges[k] }));
  };

  const getPassFailData = () => [
    { name: 'Pass', value: resultsData?.stats?.passCount || 0 },
    { name: 'Fail', value: (resultsData?.stats?.totalAttempts || 0) - (resultsData?.stats?.passCount || 0) }
  ];
  const COLORS = ['#10B981', '#EF4444'];

  const generatePDF = async () => {
    if (!resultsData) return;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(33, 37, 41);
    doc.text('Exam Results Report', 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Exam Title: ${resultsData.exam?.title}`, 14, 32);
    doc.text(`Class: ${resultsData.exam?.class?.className}`, 14, 38);
    doc.text(`Total Marks: ${resultsData.exam?.totalMarks}`, 14, 44);
    doc.text(`Passing Marks: ${resultsData.exam?.passingMarks}`, 14, 50);
    doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 56);

    let currentY = 65;

    try {
      const chartEl = chartsRef.current;
      if (chartEl) {
        // Temporarily make it capture-ready
        const originalStyle = chartEl.getAttribute('style');
        chartEl.style.position = 'fixed';
        chartEl.style.left = '0';
        chartEl.style.top = '0';
        chartEl.style.opacity = '1';
        chartEl.style.visibility = 'visible';
        chartEl.style.zIndex = '9999';
        chartEl.style.pointerEvents = 'auto';

        // Wait a small bit for Recharts to ensure it's rendered in the "visible" container
        await new Promise(resolve => setTimeout(resolve, 500));

        const canvas = await html2canvas(chartEl, { 
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        });
        const imgData = canvas.toDataURL('image/png');
        
        // Restore style
        chartEl.setAttribute('style', originalStyle);

        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = 180;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        doc.addImage(imgData, 'PNG', 15, currentY, pdfWidth, pdfHeight);
        currentY += pdfHeight + 15;
      }
    } catch (e) {
      console.error('Chart capture failed', e);
    }
    
    const tableColumn = ["Student", "Email", "Auto", "Manual", "Final", "Status", "Result"];
    const tableRows = [];

    resultsData.attempts.forEach(a => {
      const isPass = a.finalScore != null && (Number(a.finalScore) >= Number(resultsData.exam?.passingMarks || 0));
      const rowData = [
        a.student?.name || '',
        a.student?.email || '',
        a.autoScore,
        a.manualScore ?? '-',
        a.finalScore ?? '-',
        a.status,
        a.finalScore != null ? (isPass ? 'Pass' : 'Fail') : '-'
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: currentY,
      margin: { top: 20 },
      styles: { fontSize: 9 },
      headStyles: { fillColor: [63, 107, 187], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 250] }
    });

    doc.save(`${resultsData.exam?.title || 'Exam'}_Results.pdf`);
  };

  const openResults = async (examId) => {
    try {
      setLoadingResults(true);
      setShowResults(examId);
      const r = await examService.getResults(examId);
      setResultsData(r.data);
    } catch { toast.error('Failed to load results'); setShowResults(null); }
    finally { setLoadingResults(false); }
  };

  const openGradeModal = async (attemptInfo) => {
    try {
      setLoadingResults(true);
      const r = await examService.getAttempt(attemptInfo.exam, attemptInfo.student._id);
      setGradeAttemptData(r.data);
      const initialMarks = {};
      r.data.answers.forEach(ans => {
        initialMarks[ans.question._id] = {
          marksAwarded: ans.marksAwarded ?? 0,
          feedback: ans.feedback || ''
        };
      });
      setMarksForm(initialMarks);
    } catch { toast.error('Failed to load attempt details'); }
    finally { setLoadingResults(false); }
  };

  const handleSubmitGrades = async () => {
    try {
      setGrading(true);
      const marksArray = Object.entries(marksForm).map(([questionId, data]) => ({
        questionId,
        marksAwarded: data.marksAwarded,
        feedback: data.feedback
      }));
      await examService.gradeAttempt(gradeAttemptData.exam, gradeAttemptData.student._id, { marks: marksArray });
      toast.success('Grades saved successfully');
      setGradeAttemptData(null);
      const r = await examService.getResults(showResults);
      setResultsData(r.data);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save grades'); }
    finally { setGrading(false); }
  };

  const updateOption = (idx, field, value) => {
    setQForm(prev => ({
      ...prev,
      options: prev.options.map((o, i) => i === idx ? { ...o, [field]: value } : (field === 'isCorrect' && value ? { ...o, isCorrect: false } : o))
    }));
  };

  const createExamModal = showCreate && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{editingExamId ? 'Edit Exam' : 'Create Exam'}</h2>
          <button onClick={() => { setShowCreate(false); setEditingExamId(null); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <div>
            <label className="form-label">Class <span className="text-red-500">*</span></label>
            <select value={createForm.classId} onChange={e => setCreateForm(p => ({ ...p, classId: e.target.value }))} className="form-input">
              <option value="">Select Class</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.className} — {c.subject}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Title <span className="text-red-500">*</span></label>
            <input type="text" value={createForm.title} onChange={e => setCreateForm(p => ({ ...p, title: e.target.value }))} className="form-input" placeholder="e.g., Mid Term Exam 2026" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Term</label>
              <select value={createForm.term} onChange={e => setCreateForm(p => ({ ...p, term: e.target.value }))} className="form-input">
                {TERMS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Paper Type</label>
              <select value={createForm.paperType} onChange={e => setCreateForm(p => ({ ...p, paperType: e.target.value }))} className="form-input">
                {PAPER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="form-label">Total Marks</label>
              <input type="number" value={createForm.totalMarks} onChange={e => setCreateForm(p => ({ ...p, totalMarks: e.target.value }))} className="form-input" min="1" />
            </div>
            <div>
              <label className="form-label">Pass Marks</label>
              <input type="number" value={createForm.passingMarks} onChange={e => setCreateForm(p => ({ ...p, passingMarks: e.target.value }))} className="form-input" min="0" />
            </div>
            <div>
              <label className="form-label">Duration (min)</label>
              <input type="number" value={createForm.duration} onChange={e => setCreateForm(p => ({ ...p, duration: e.target.value }))} className="form-input" min="1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Start Date</label>
              <input type="date" value={createForm.scheduledDate} onChange={e => setCreateForm(p => ({ ...p, scheduledDate: e.target.value }))} className="form-input" />
            </div>
            <div>
              <label className="form-label">End Date (For Free Exams)</label>
              <input type="date" value={createForm.endDate} onChange={e => setCreateForm(p => ({ ...p, endDate: e.target.value }))} className="form-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="form-label">Start Time (For Timed Exams)</label>
              <input type="time" value={createForm.startTime} onChange={e => setCreateForm(p => ({ ...p, startTime: e.target.value }))} className="form-input" />
            </div>
            <div>
              <label className="form-label">End Time</label>
              <input type="time" value={createForm.endTime} onChange={e => setCreateForm(p => ({ ...p, endTime: e.target.value }))} className="form-input" />
            </div>
          </div>
          <div className="mt-4">
            <label className="form-label">Description</label>
            <textarea value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} className="form-input" rows={2} placeholder="Optional..." />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => { setShowCreate(false); setEditingExamId(null); }} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={creating} className="btn btn-primary disabled:opacity-50">
              {creating ? <><Spinner size="sm" /> Saving...</> : <><Plus className="w-4 h-4" /> Save</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // ── RESULTS VIEW ──
  if (showResults) {
    return (
      <div>
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowResults(null)} className="btn btn-secondary">← Back</button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Exam Results</h1>
          </div>
          <button onClick={generatePDF} className="btn btn-primary">Download PDF Report</button>
        </div>
        {loadingResults ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> : resultsData && (
          <>
            <div className="card mb-4">
              <h2 className="font-semibold text-lg">{resultsData.exam?.title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{resultsData.exam?.class?.className} · Total: {resultsData.exam?.totalMarks} · Pass: {resultsData.exam?.passingMarks}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="card text-center"><div className="text-2xl font-bold">{resultsData.stats?.totalAttempts}</div><div className="text-sm text-gray-500 dark:text-gray-400">Attempts</div></div>
              <div className="card text-center"><div className="text-2xl font-bold text-green-600">{resultsData.stats?.passCount}</div><div className="text-sm text-gray-500 dark:text-gray-400">Passed</div></div>
              <div className="card text-center"><div className="text-2xl font-bold text-primary-600">{resultsData.stats?.averageScore}</div><div className="text-sm text-gray-500 dark:text-gray-400">Average</div></div>
              <div className="card text-center"><div className="text-2xl font-bold">{resultsData.stats?.highestScore}</div><div className="text-sm text-gray-500 dark:text-gray-400">Highest</div></div>
            </div>
            <div className="table-container">
              <table>
                <thead><tr><th>Student</th><th>Auto Score</th><th>Manual Score</th><th>Final Score</th><th>Status</th><th>Result</th><th>Action</th></tr></thead>
                <tbody>
                  {resultsData.attempts?.map(a => (
                    <tr key={a._id}>
                      <td><div className="font-medium">{a.student?.name}</div><div className="text-xs text-gray-500 dark:text-gray-400">{a.student?.email}</div></td>
                      <td>{a.autoScore}</td>
                      <td>{a.manualScore ?? '-'}</td>
                      <td className="font-bold">{a.finalScore ?? '-'}</td>
                      <td><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${a.status === 'REVIEWED' ? 'bg-green-100 text-green-800' : a.status === 'GRADED' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{a.status}</span></td>
                      <td>{a.finalScore != null && (Number(a.finalScore) >= Number(resultsData.exam?.passingMarks || 0) ? <span className="text-green-600 font-medium">Pass</span> : <span className="text-red-600 font-medium">Fail</span>)}</td>
                      <td>
                        <button onClick={() => openGradeModal(a)} className="btn btn-secondary text-xs py-1 px-2">
                          Review / Grade
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Grading Modal */}
        {gradeAttemptData && (
          <div className="fixed inset-0 bg-black/50 flex py-10 items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-gray-700">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Review Paper: {gradeAttemptData.student?.name}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Auto Score: <span className="font-semibold text-gray-800 dark:text-gray-200">{gradeAttemptData.autoScore}</span> | 
                    Manual Score: <span className="font-semibold text-gray-800 dark:text-gray-200">{gradeAttemptData.manualScore ?? '-'}</span> | 
                    Final: <span className="font-semibold text-gray-800 dark:text-gray-200">{gradeAttemptData.finalScore ?? '-'}</span>
                  </p>
                </div>
                <button onClick={() => setGradeAttemptData(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 dark:bg-gray-700">
                {gradeAttemptData.answers.map((ans) => {
                  const q = ans.question;
                  if (!q) return null;
                  return (
                    <div key={q._id} className="card bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="font-medium text-gray-800 dark:text-gray-200">
                          <span className="text-gray-400 dark:text-gray-500 mr-2">Q{q.questionNumber}.</span>
                          {q.content}
                        </div>
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4">
                          {q.marks} Marks
                        </div>
                      </div>
                      
                      {q.type === 'MCQ' ? (
                        <div className="space-y-2 mb-2">
                          {q.options.map((opt, i) => {
                            const isSelected = ans.selectedOption === opt._id;
                            const isCorrect = opt.isCorrect;
                            let bgClass = 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
                            if (isSelected && isCorrect) bgClass = 'bg-green-50/50 text-green-800 border-green-300 ring-1 ring-green-300';
                            else if (isSelected && !isCorrect) bgClass = 'bg-red-50 text-red-800 border-red-300 ring-1 ring-red-300';
                            else if (!isSelected && isCorrect) bgClass = 'bg-green-50 text-green-700 border-green-200 border-dashed border-2';
                            
                            return (
                              <div key={opt._id || i} className={`p-3 rounded-lg border flex items-center justify-between ${bgClass}`}>
                                <div>
                                  <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                                  {opt.text}
                                </div>
                                <div className="text-xs font-bold tracking-wide">
                                  {isSelected && isCorrect && <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Correct Choice</span>}
                                  {isSelected && !isCorrect && <span className="text-red-600">Student's Choice</span>}
                                  {isCorrect && !isSelected && <span className="text-green-600">Correct Answer</span>}
                                </div>
                              </div>
                            );
                          })}
                          <div className="text-sm font-medium mt-4 pt-4 border-t border-gray-100 flex justify-end">
                            <span className="text-gray-500 mr-2">Auto-graded:</span> 
                            <span className={`font-bold ${ans.marksAwarded > 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {ans.marksAwarded} / {q.marks}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-2">
                          <div className="text-sm font-medium text-gray-500 mb-2">Student's Written Answer:</div>
                          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 whitespace-pre-wrap min-h-[80px] text-gray-800 dark:text-gray-300">
                            {ans.writtenAnswer || <span className="text-gray-400 dark:text-gray-500 italic">No answer provided</span>}
                          </div>
                          <div className="mt-5 p-5 border border-primary-100 dark:border-primary-900/50 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                            <h4 className="text-sm font-bold text-primary-800 dark:text-primary-300 mb-4 flex items-center gap-2">
                              <Award className="w-4 h-4" /> Grade this answer
                            </h4>
                            <div className="flex flex-col sm:flex-row gap-5">
                              <div className="w-full sm:w-1/3">
                                <label className="text-sm font-medium text-primary-900 dark:text-primary-200 block mb-1.5">Marks Awarded</label>
                                <div className="flex items-center">
                                  <input 
                                    type="number" 
                                    min="0" 
                                    max={q.marks} 
                                    step="0.5"
                                    value={marksForm[q._id]?.marksAwarded ?? ''}
                                    onChange={(e) => setMarksForm(p => ({
                                      ...p, 
                                      [q._id]: { ...p[q._id], marksAwarded: e.target.value }
                                    }))}
                                    className="form-input w-24 text-center font-semibold text-lg"
                                  />
                                  <span className="text-sm font-medium text-primary-700 dark:text-primary-300 ml-3">/ {q.marks}</span>
                                </div>
                              </div>
                              <div className="w-full sm:w-2/3">
                                <label className="text-sm font-medium text-primary-900 dark:text-primary-200 block mb-1.5">Feedback (Optional)</label>
                                <textarea 
                                  value={marksForm[q._id]?.feedback ?? ''}
                                  onChange={(e) => setMarksForm(p => ({
                                    ...p, 
                                    [q._id]: { ...p[q._id], feedback: e.target.value }
                                  }))}
                                  className="form-input text-sm" 
                                  rows="2"
                                  placeholder="Provide constructive feedback..."
                                ></textarea>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="p-6 border-t border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center rounded-b-xl\">\n                <div className="text-sm text-gray-500 dark:text-gray-400 italic">Scores are saved to the student's final result.</div>
                <div className="flex gap-3">
                  <button onClick={() => setGradeAttemptData(null)} className="btn btn-secondary">Cancel</button>
                  <button onClick={handleSubmitGrades} disabled={grading} className="btn btn-primary px-6">
                    {grading ? <><Spinner size="sm" /> Saving...</> : 'Save Grades'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── EXAM DETAIL VIEW ──
  if (selectedExam && examDetail) {
    const exam = examDetail.exam;
    const questions = examDetail.questions || [];
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={closeDetail} className="btn btn-secondary">← Back</button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{exam.title}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{exam.class?.className} · {exam.subject} · {exam.paperType} · {exam.totalMarks} marks</p>
            </div>
          </div>
          {canManage && (
            <div className="flex gap-2">
              <button onClick={() => {
                setEditingExamId(exam._id);
                setCreateForm({
                  classId: exam.class?._id || exam.class,
                  title: exam.title,
                  description: exam.description || '',
                  subject: exam.subject || '',
                  term: exam.term,
                  paperType: exam.paperType,
                  totalMarks: exam.totalMarks,
                  passingMarks: exam.passingMarks || 0,
                  duration: exam.duration || 60,
                  scheduledDate: exam.scheduledDate ? new Date(exam.scheduledDate).toISOString().split('T')[0] : '',
                  endDate: exam.endDate ? new Date(exam.endDate).toISOString().split('T')[0] : '',
                  startTime: exam.startTime || '',
                  endTime: exam.endTime || ''
                });
                setShowCreate(true);
              }} className="btn btn-secondary text-sm">
                <Edit className="w-4 h-4" /> Edit
              </button>
              <button onClick={() => handleTogglePublish(exam._id)} className={`btn ${exam.isPublished ? 'btn-secondary' : 'btn-primary'} text-sm`}>
                {exam.isPublished ? <><EyeOff className="w-4 h-4" /> Unpublish</> : <><Eye className="w-4 h-4" /> Publish</>}
              </button>
              <button onClick={() => handleToggleResults(exam._id)} className={`btn ${exam.resultsPublished ? 'btn-secondary' : 'btn-primary'} text-sm`}>
                {exam.resultsPublished ? 'Hide Results' : 'Publish Results'}
              </button>
              <button onClick={() => openResults(exam._id)} className="btn btn-secondary text-sm">
                <BarChart3 className="w-4 h-4" /> Results
              </button>
              <button onClick={() => handleDelete(exam._id)} className="btn bg-red-600 text-white hover:bg-red-700 text-sm">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="flex gap-2 mb-6">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${exam.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            {exam.isPublished ? 'Published' : 'Draft'}
          </span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${exam.resultsPublished ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
            Results: {exam.resultsPublished ? 'Visible' : 'Hidden'}
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">{examDetail.attemptCount} Attempts</span>
        </div>

        {/* Questions */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Questions ({questions.length})</h2>
          {canManage && <button onClick={() => setShowAddQ(true)} className="btn btn-primary text-sm"><Plus className="w-4 h-4" /> Add Question</button>}
        </div>

        {questions.length === 0 ? (
          <div className="card text-center py-8 text-gray-500">No questions yet. Add your first question above.</div>
        ) : (
          <div className="space-y-3">
            {questions.map((q) => (
              <div key={q._id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-gray-400">Q{q.questionNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${q.type === 'MCQ' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{q.type}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-gray-900">{q.content}</p>
                    {q.type === 'MCQ' && q.options?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {q.options.map((opt, i) => (
                          <div key={opt._id || i} className={`text-sm px-2 py-1 rounded ${opt.isCorrect ? 'bg-green-50 text-green-800 font-medium' : 'text-gray-600'}`}>
                            {String.fromCharCode(65 + i)}. {opt.text} {opt.isCorrect && '✓'}
                          </div>
                        ))}
                      </div>
                    )}
                    {q.type === 'WRITTEN' && <p className="text-xs text-gray-400 mt-1">Lines: {q.lineCount}</p>}
                  </div>
                  {canManage && (
                    <div className="flex flex-col gap-2">
                      <button onClick={() => {
                        setEditingQuestionId(q._id);
                        setQForm({
                          type: q.type,
                          content: q.content,
                          marks: q.marks,
                          lineCount: q.lineCount || 5,
                          explanation: q.explanation || '',
                          options: q.type === 'MCQ' && q.options?.length > 0 ? q.options.map(o => ({text: o.text, isCorrect: o.isCorrect})) : [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }]
                        });
                        setShowAddQ(true);
                      }} className="p-1 text-gray-400 hover:text-primary-500 rounded"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteQuestion(q._id)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Question Modal */}
        {showAddQ && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{editingQuestionId ? 'Edit Question' : 'Add Question'}</h2>
                <button onClick={() => { setShowAddQ(false); setEditingQuestionId(null); setQForm({ type: 'MCQ', content: '', marks: 1, lineCount: 5, explanation: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }] }); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleAddQuestion} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Type</label>
                    <select value={qForm.type} onChange={e => setQForm(p => ({ ...p, type: e.target.value }))} className="form-input">
                      <option value="MCQ">MCQ</option>
                      <option value="WRITTEN">Written</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Marks</label>
                    <input type="number" value={qForm.marks} onChange={e => setQForm(p => ({ ...p, marks: e.target.value }))} className="form-input" min="0.5" step="0.5" />
                  </div>
                </div>
                <div>
                  <label className="form-label">Question Content <span className="text-red-500">*</span></label>
                  <textarea value={qForm.content} onChange={e => setQForm(p => ({ ...p, content: e.target.value }))} className="form-input" rows={3} placeholder="Enter the question..." />
                </div>
                {qForm.type === 'MCQ' && (
                  <div>
                    <label className="form-label">Options (select the correct one)</label>
                    <div className="space-y-2">
                      {qForm.options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input type="radio" name="correctOption" checked={opt.isCorrect} onChange={() => updateOption(i, 'isCorrect', true)} />
                          <input type="text" value={opt.text} onChange={e => updateOption(i, 'text', e.target.value)} className="form-input flex-1" placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {qForm.type === 'WRITTEN' && (
                  <div>
                    <label className="form-label">Answer Lines</label>
                    <input type="number" value={qForm.lineCount} onChange={e => setQForm(p => ({ ...p, lineCount: e.target.value }))} className="form-input" min="1" />
                  </div>
                )}
                <div>
                  <label className="form-label">Explanation (optional)</label>
                  <textarea value={qForm.explanation} onChange={e => setQForm(p => ({ ...p, explanation: e.target.value }))} className="form-input" rows={2} placeholder="Explanation shown after grading..." />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => { setShowAddQ(false); setEditingQuestionId(null); setQForm({ type: 'MCQ', content: '', marks: 1, lineCount: 5, explanation: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }] }); }} className="btn btn-secondary">Cancel</button>
                  <button type="submit" disabled={addingQ} className="btn btn-primary disabled:opacity-50">
                    {addingQ ? <><Spinner size="sm" /> Saving...</> : <><Plus className="w-4 h-4" /> Save</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {createExamModal}
      </div>
    );
  }

  // ── EXAM LIST VIEW ──
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Exams</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Create and manage exams</p>
        </div>
        {canManage && (
          <button onClick={() => {
            setEditingExamId(null);
            setCreateForm({
              classId: filterClass || '', title: '', description: '', subject: '', term: 'OTHER',
              paperType: 'MIXED', totalMarks: 100, passingMarks: 40, duration: 60,
              scheduledDate: '', endDate: '', startTime: '', endTime: ''
            });
            setShowCreate(true);
          }} className="btn btn-primary"><Plus className="w-5 h-5" /> New Exam</button>
        )}
      </div>

      <div className="card mb-6">
        <select value={filterClass} onChange={e => { setFilterClass(e.target.value); setPagination(p => ({ ...p, currentPage: 1 })); }} className="form-input w-auto min-w-[220px]">
          <option value="">All Classes</option>
          {classes.map(c => <option key={c._id} value={c._id}>{c.className} — {c.subject}</option>)}
        </select>
      </div>

      {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> :
      exams.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50">No exams found</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.filter(e => canManage || e.isPublished).map(exam => (
            <div key={exam._id} className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleCardClick(exam)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${canManage && !exam.isPublished ? 'bg-gray-100' : 'bg-green-100'}`}>
                    <FileText className={`w-5 h-5 ${canManage && !exam.isPublished ? 'text-gray-400' : 'text-green-600'}`} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-50">{exam.title}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {exam.class?.className} · {exam.paperType} · {exam.totalMarks} marks
                      {exam.scheduledDate && ` · ${new Date(exam.scheduledDate).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{exam.questionCount} Q {canManage ? `· ${exam.attemptCount} attempts` : ''}</span>
                  {canManage && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${exam.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {exam.isPublished ? 'Published' : 'Draft'}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: pagination.totalPages }, (_, i) => (
            <button key={i + 1} onClick={() => setPagination(p => ({ ...p, currentPage: i + 1 }))}
              className={`px-3 py-1 rounded text-sm ${pagination.currentPage === i + 1 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{i + 1}</button>
          ))}
        </div>
      )}

      {createExamModal}

      {/* Hidden Charts for PDF Export */}
      {showResults && resultsData && (
        <div ref={chartsRef} style={{ position: 'absolute', left: '-9999px', top: '0', opacity: '0', pointerEvents: 'none', background: 'white', padding: '20px', width: '800px', display: 'flex', gap: '20px' }}>
          <div style={{ background: 'white', padding: '10px' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '16px', fontWeight: 'bold', color: '#000' }}>Mark Distribution</h3>
            <BarChart width={350} height={250} data={getDistributionData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </div>
          <div style={{ background: 'white', padding: '10px' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '16px', fontWeight: 'bold', color: '#000' }}>Pass / Fail Ratio</h3>
            <PieChart width={350} height={250}>
              <Pie 
                data={getPassFailData()} 
                cx="50%" 
                cy="50%" 
                outerRadius={80} 
                fill="#8884d8" 
                dataKey="value" 
                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                isAnimationActive={false} // CRITICAL: Disable animation for capture
              >
                {getPassFailData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
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

export default ExamList;






