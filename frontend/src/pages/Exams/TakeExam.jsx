import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import examService from '../../services/examService';
import { Spinner, Badge, ConfirmDialog } from '../../components/UI';
import { Clock, AlertTriangle, ArrowLeft, CheckCircle } from 'lucide-react';

const TakeExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [examDetail, setExamDetail] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [answers, setAnswers] = useState({});

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    confirmVariant: 'danger'
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch Exam details
      const examRes = await examService.getExamById(id);
      setExamDetail(examRes.data);
      
      // Fetch Attempt if exists
      try {
        const attemptRes = await examService.getAttempt(id, user.profileId);
        setAttempt(attemptRes.data);
        
        // Populate answers map
        if (attemptRes.data && attemptRes.data.answers) {
          const ansMap = {};
          attemptRes.data.answers.forEach(a => {
            ansMap[a.question._id || a.question] = {
              selectedOption: a.selectedOption || null,
              writtenAnswer: a.writtenAnswer || ''
            };
          });
          setAnswers(ansMap);
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error('Error fetching attempt', err);
        }
      }
    } catch (err) {
      toast.error('Failed to load exam details');
      navigate('/exams');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async () => {
    try {
      setSubmitting(true);
      const r = await examService.startAttempt(id, { studentId: user.profileId });
      setAttempt(r.data);
      toast.success('Exam Started!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start exam');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Submit Exam',
      message: 'Are you sure you want to submit? You cannot change your answers after this.',
      confirmText: 'Submit',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          setSubmitting(true);
          const payload = Object.keys(answers).map(qId => ({
            questionId: qId,
            selectedOption: answers[qId].selectedOption,
            writtenAnswer: answers[qId].writtenAnswer
          }));
          
          await examService.submitAttempt(id, { studentId: user.profileId, answers: payload });
          toast.success('Exam submitted successfully!');
          fetchData(); // reload
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to submit exam');
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  const handleMCQChange = (qId, optionId) => {
    if (attempt?.status !== 'IN_PROGRESS') return;
    setAnswers(p => ({
      ...p,
      [qId]: { ...p[qId], selectedOption: optionId }
    }));
  };

  const handleWrittenChange = (qId, text) => {
    if (attempt?.status !== 'IN_PROGRESS') return;
    setAnswers(p => ({
      ...p,
      [qId]: { ...p[qId], writtenAnswer: text }
    }));
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!examDetail) return <div className="text-center py-20">Exam not found</div>;

  const { exam, questions } = examDetail;
  
  // Status logic
  const isStarted = attempt && attempt.status !== 'NOT_STARTED';
  const isFinished = attempt && (attempt.status === 'SUBMITTED' || attempt.status === 'GRADED' || attempt.status === 'REVIEWED');

  // Time logic for "Start" page
  let canStart = false;
  let timeMsg = '';
  const now = new Date();
  
  if (!isStarted) {
    if (exam.scheduledDate) {
      const scheduledStr = new Date(exam.scheduledDate).toDateString();
      if (exam.endDate) {
        // Date Range logic
        const end = new Date(exam.endDate);
        end.setHours(23, 59, 59, 999);
        const start = new Date(exam.scheduledDate);
        if (now < start) {
          timeMsg = `Exam opens on ${scheduledStr}`;
        } else if (now > end) {
          timeMsg = `Exam closed on ${end.toDateString()}`;
        } else {
          canStart = true;
          timeMsg = `Open until ${end.toDateString()}`;
        }
      } else if (exam.startTime && exam.endTime) {
        // Timed Logic on a single day
        if (now.toDateString() !== scheduledStr) {
          timeMsg = `Exam is scheduled for ${scheduledStr}`;
        } else {
          const [sH, sM] = exam.startTime.split(':');
          const [eH, eM] = exam.endTime.split(':');
          const tStart = new Date(); tStart.setHours(+sH, +sM, 0);
          const tEnd = new Date(); tEnd.setHours(+eH, +eM, 0);
          
          if (now < tStart) {
            timeMsg = `Exam starts at ${exam.startTime}`;
          } else if (now > tEnd) {
            timeMsg = `Exam ended at ${exam.endTime}`;
          } else {
            canStart = true;
            timeMsg = `Closes at ${exam.endTime}`;
          }
        }
      } else {
        // Just scheduledDate, open all day
        if (now.toDateString() === scheduledStr) {
          canStart = true;
          timeMsg = 'Open today only';
        } else {
          timeMsg = `Scheduled for ${scheduledStr}`;
        }
      }
    } else {
      canStart = true; // Always open
      timeMsg = 'No time limits';
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/exams')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{exam.title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{exam.class?.className} · {exam.subject}</p>
        </div>
      </div>

      {!isStarted && (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Ready to take the exam?</h2>
          <p className="text-gray-600 mb-6 max-w-sm mx-auto">
            This exam has {questions.length} questions. You will have {exam.duration} minutes to complete it once you start.
          </p>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-800 rounded-lg font-medium mb-8 border border-yellow-200">
            <AlertTriangle className="w-4 h-4" />
            {timeMsg}
          </div>

          <div>
            <button 
              onClick={handleStartExam} 
              disabled={!canStart || submitting}
              className="btn btn-primary px-8 py-3 text-lg disabled:opacity-50"
            >
              {submitting ? 'Starting...' : 'Start Exam'}
            </button>
            {!canStart && <p className="text-sm text-red-500 mt-3">You cannot start the exam at this time.</p>}
          </div>
        </div>
      )}

      {isStarted && (
        <div className="space-y-6">
          <div className="flex items-center justify-between card bg-white sticky top-4 z-10 shadow-lg border border-gray-100">
            <div>
              <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Exam Status</div>
              <div className="font-medium text-lg flex items-center gap-2">
                {isFinished ? (
                  <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-5 h-5"/> Submitted</span>
                ) : (
                  <span className="text-primary-600 flex items-center gap-1"><Clock className="w-5 h-5"/> In Progress</span>
                )}
              </div>
            </div>
            
            {isFinished && attempt.status !== 'SUBMITTED' && exam.resultsPublished && (
              <div className="text-right">
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Your Score</div>
                <div className="text-2xl font-bold text-primary-600">{attempt.finalScore} <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">/ {exam.totalMarks}</span></div>
              </div>
            )}
            
            {!isFinished && (
              <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary px-6">
                {submitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            )}
          </div>

          <div className="space-y-4">
            {questions.map((q, idx) => {
              const ans = answers[q._id] || {};
              // Build review info if results are published
              let rowClass = 'card border transition-colors ';
              let ReviewFeedback = null;
              
              if (isFinished && exam.resultsPublished && attempt.status !== 'SUBMITTED') {
                if (q.type === 'MCQ') {
                  const myAttemptObj = attempt.answers?.find(a => a.question?._id === q._id || a.question === q._id);
                  if (myAttemptObj?.marksAwarded > 0) {
                    rowClass += 'border-green-300 bg-green-50/30';
                    ReviewFeedback = <Badge variant="success">+{myAttemptObj.marksAwarded} Marks</Badge>;
                  } else {
                    rowClass += 'border-red-300 bg-red-50/30';
                    ReviewFeedback = <Badge variant="danger">0 Marks</Badge>;
                  }
                }
              } else {
                rowClass += 'border-gray-100 hover:border-gray-200';
              }

              return (
                <div key={q._id} className={rowClass}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="font-medium text-gray-900 dark:text-gray-50 leading-relaxed">
                      <span className="text-gray-400 mr-2">{idx + 1}.</span>
                      {q.content}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {q.marks} Marks
                      </span>
                      {ReviewFeedback}
                    </div>
                  </div>

                  {q.type === 'MCQ' && (
                    <div className="space-y-2 pl-6">
                      {q.options.map((opt, oIdx) => {
                        const isSelected = ans.selectedOption === opt._id;
                        let optClass = `p-3 rounded-xl border flex items-center gap-3 transition-colors ${isSelected && !isFinished ? 'border-primary-500 bg-primary-50' : 'border-gray-200'} ${!isFinished ? 'cursor-pointer hover:bg-gray-50' : ''}`;
                        let marker = null;
                        
                        // If Results Published
                        if (isFinished && exam.resultsPublished) {
                          if (opt.isCorrect) {
                            optClass = `p-3 rounded-xl flex items-center gap-3 bg-green-100 border-green-500`;
                            marker = <CheckCircle className="w-5 h-5 text-green-600" />;
                          } else if (isSelected) {
                            optClass = `p-3 rounded-xl flex items-center gap-3 bg-red-100 border-red-300`;
                          }
                        }

                        return (
                          <div key={opt._id} className={optClass} onClick={() => handleMCQChange(q._id, opt._id)}>
                            <div className="flex-1 flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary-600' : 'border-gray-300'}`}>
                                {isSelected && <div className="w-2.5 h-2.5 bg-primary-600 rounded-full" />}
                              </div>
                              <span className="text-gray-800">{String.fromCharCode(65 + oIdx)}. {opt.text}</span>
                            </div>
                            {marker}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.type === 'WRITTEN' && (
                    <div className="mt-4">
                      <textarea
                        value={ans.writtenAnswer || ''}
                        onChange={(e) => handleWrittenChange(q._id, e.target.value)}
                        disabled={isFinished}
                        rows={q.lineCount || 5}
                        className="form-input focus:bg-white resize-none"
                        placeholder={isFinished ? "No answer provided." : "Type your answer here..."}
                      />
                    </div>
                  )}
                  
                  {isFinished && exam.resultsPublished && q.explanation && (
                    <div className="mt-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100 text-sm text-blue-900">
                      <strong>Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
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

export default TakeExam;



