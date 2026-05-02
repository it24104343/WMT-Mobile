import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../../src/utils/api';
import { AuthContext } from '../../src/context/AuthContext';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function TakeExamScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { state } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [examDetail, setExamDetail] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [answers, setAnswers] = useState<any>({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const examRes = await apiClient.get(`/exams/${id}`);
      setExamDetail(examRes.data.data);

      try {
        const attemptRes = await apiClient.get(`/exams/${id}/attempt/${state.user.profileId}`);
        const attemptData = attemptRes.data.data;
        setAttempt(attemptData);
        
        if (attemptData?.status === 'IN_PROGRESS') {
          // Calculate remaining time
          const start = new Date(attemptData.startedAt).getTime();
          const limit = examRes.data.data.exam.duration * 60 * 1000;
          const elapsed = Date.now() - start;
          const remaining = Math.max(0, Math.floor((limit - elapsed) / 1000));
          setTimeLeft(remaining);
        }

        if (attemptData?.answers) {
          const ansMap: any = {};
          attemptData.answers.forEach((a: any) => {
            ansMap[a.question._id || a.question] = {
              selectedOption: a.selectedOption || null,
              writtenAnswer: a.writtenAnswer || ''
            };
          });
          setAnswers(ansMap);
        }
      } catch (e) {
        // No attempt yet
      }
    } catch (error) {
      console.error('Fetch exam error:', error);
      Alert.alert('Error', 'Failed to load exam details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft !== null && timeLeft > 0 && attempt?.status === 'IN_PROGRESS') {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev !== null && prev <= 1) {
            clearInterval(timer);
            autoSubmit();
            return 0;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeLeft, attempt?.status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleStartExam = async () => {
    setSubmitting(true);
    try {
      const response = await apiClient.post(`/exams/${id}/attempt`, { studentId: state.user.profileId });
      setAttempt(response.data.data);
      setTimeLeft(examDetail.exam.duration * 60);
      Alert.alert('Success', 'Exam started! Good luck.');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Could not start exam');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMCQChange = (qId: string, optionId: string) => {
    if (attempt?.status !== 'IN_PROGRESS') return;
    setAnswers({ ...answers, [qId]: { ...answers[qId], selectedOption: optionId } });
  };

  const handleWrittenChange = (qId: string, text: string) => {
    if (attempt?.status !== 'IN_PROGRESS') return;
    setAnswers({ ...answers, [qId]: { ...answers[qId], writtenAnswer: text } });
  };

  const handleSubmit = () => {
    Alert.alert(
      'Submit Exam',
      'Are you sure you want to submit? You cannot change your answers after this.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => processSubmit()
        }
      ]
    );
  };

  const autoSubmit = () => {
    Alert.alert('Time Up', 'Your time is up! Submitting your answers automatically.');
    processSubmit();
  };

  const processSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = Object.keys(answers).map(qId => ({
        questionId: qId,
        selectedOption: answers[qId].selectedOption,
        writtenAnswer: answers[qId].writtenAnswer
      }));
      await apiClient.put(`/exams/${id}/attempt/submit`, { studentId: state.user.profileId, answers: payload });
      Alert.alert('Success', 'Exam submitted successfully!');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !examDetail) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  const { exam, questions } = examDetail;
  const isStarted = attempt && attempt.status !== 'NOT_STARTED';
  const isFinished = attempt && ['SUBMITTED', 'GRADED', 'REVIEWED'].includes(attempt.status);
  const currentQuestion = questions[currentQuestionIdx];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: '#0f172a' }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={[styles.timerBox, timeLeft !== null && timeLeft < 60 && { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Ionicons name="time-outline" size={18} color={timeLeft !== null && timeLeft < 60 ? '#ef4444' : '#f59e0b'} />
            <Text style={[styles.timerText, timeLeft !== null && timeLeft < 60 && { color: '#ef4444' }]}>
              {timeLeft !== null ? formatTime(timeLeft) : `${exam.duration}m`}
            </Text>
          </View>
          {isStarted && !isFinished && (
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
              <Text style={styles.submitBtnText}>Submit</Text>
            </TouchableOpacity>
          )}
          {!isStarted && <View style={{ width: 40 }} />}
        </View>
        <Text style={styles.examTitle}>{exam.title}</Text>
        <Text style={styles.examSub}>{exam.subject} • {questions.length} Questions</Text>
      </View>

      {!isStarted ? (
        <View style={styles.startContainer}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={48} color="#3b82f6" style={{ marginBottom: 16 }} />
            <Text style={styles.infoTitle}>Exam Instructions</Text>
            <Text style={styles.infoText}>
              • Do not close the app during the exam.{"\n"}
              • Ensure you have a stable internet connection.{"\n"}
              • Once you start, the timer will begin.{"\n"}
              • Total duration is {exam.duration} minutes.
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.startBtn, { backgroundColor: '#3b82f6', height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }]} 
            onPress={handleStartExam} 
            disabled={submitting}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.startBtnText}>Start Exam Now</Text>}
          </TouchableOpacity>
        </View>
      ) : isFinished ? (
        <ScrollView style={styles.resultsContainer} contentContainerStyle={styles.resultsContent}>
          <View style={styles.resultHeader}>
            <Ionicons 
              name={attempt.finalScore >= (exam.passingMarks || 0) ? "trophy" : "alert-circle"} 
              size={64} 
              color={attempt.finalScore >= (exam.passingMarks || 0) ? "#f59e0b" : "#ef4444"} 
            />
            <Text style={styles.resultTitle}>
              {attempt.status === 'GRADED' || attempt.status === 'REVIEWED' ? 'Exam Graded' : 'Exam Submitted'}
            </Text>
            <Text style={styles.resultStatus}>
              {attempt.status === 'SUBMITTED' ? 'Waiting for teacher review' : 'Check your marks below'}
            </Text>
          </View>

          <View style={styles.scoreRow}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreVal}>{attempt.finalScore ?? '--'}</Text>
              <Text style={styles.scoreLab}>Your Marks</Text>
            </View>
            <View style={[styles.scoreBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#334155' }]}>
              <Text style={styles.scoreVal}>{exam.totalMarks}</Text>
              <Text style={styles.scoreLab}>Total Marks</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={[styles.scoreVal, { color: attempt.finalScore >= (exam.passingMarks || 0) ? '#22c55e' : '#ef4444' }]}>
                {attempt.finalScore >= (exam.passingMarks || 0) ? 'PASS' : 'FAIL'}
              </Text>
              <Text style={styles.scoreLab}>Result</Text>
            </View>
          </View>

          {attempt.feedback ? (
            <View style={styles.feedbackCard}>
              <Text style={styles.feedbackTitle}>Teacher Feedback</Text>
              <Text style={styles.feedbackText}>{attempt.feedback}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.viewAnswersBtn} onPress={() => { /* maybe allow scrolling questions */ }}>
            <Text style={styles.viewAnswersText}>You can still review your questions below</Text>
          </TouchableOpacity>
          
          <View style={{ marginTop: 20, opacity: 0.7 }}>
             {/* Question review part here if needed, or just let them scroll down */}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.examContainer}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressFill, { width: `${((currentQuestionIdx + 1) / questions.length) * 100}%` }]} />
          </View>

          <ScrollView style={styles.questionScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionCount}>Question {currentQuestionIdx + 1} of {questions.length}</Text>
              <Text style={styles.marksBadge}>{currentQuestion.marks} Marks</Text>
            </View>

            <Text style={styles.questionText}>{currentQuestion.content}</Text>

            {currentQuestion.type === 'MCQ' ? (
              <View style={styles.optionsList}>
                {currentQuestion.options.map((opt: any, idx: number) => {
                  const isSelected = answers[currentQuestion._id]?.selectedOption === opt._id;
                  return (
                    <TouchableOpacity
                      key={opt._id}
                      style={[styles.optionCard, isSelected && styles.optionCardActive]}
                      onPress={() => handleMCQChange(currentQuestion._id, opt._id)}
                    >
                      <View style={[styles.optionMarker, isSelected && styles.optionMarkerActive]}>
                        <Text style={[styles.optionMarkerText, isSelected && { color: '#fff' }]}>
                          {String.fromCharCode(65 + idx)}
                        </Text>
                      </View>
                      <Text style={[styles.optionText, isSelected && { color: '#fff' }]}>{opt.text}</Text>
                      {isSelected && <Ionicons name="checkmark-circle" size={20} color="#22c55e" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <TextInput
                style={styles.textArea}
                placeholder="Type your answer here..."
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={8}
                value={answers[currentQuestion._id]?.writtenAnswer || ''}
                onChangeText={(val) => handleWrittenChange(currentQuestion._id, val)}
              />
            )}
            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={styles.navigation}>
            <TouchableOpacity 
              style={[styles.navBtn, currentQuestionIdx === 0 && { opacity: 0.3 }]} 
              onPress={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIdx === 0}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
              <Text style={styles.navBtnText}>Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navBtn, currentQuestionIdx === questions.length - 1 && { backgroundColor: '#22c55e' }]} 
              onPress={() => {
                if (currentQuestionIdx < questions.length - 1) {
                  setCurrentQuestionIdx(prev => prev + 1);
                } else {
                  handleSubmit();
                }
              }}
            >
              <Text style={styles.navBtnText}>{currentQuestionIdx === questions.length - 1 ? 'Finish' : 'Next'}</Text>
              <Ionicons name={currentQuestionIdx === questions.length - 1 ? 'checkmark-done' : 'arrow-forward'} size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  timerText: {
    color: '#f59e0b',
    fontWeight: 'bold',
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  examTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  examSub: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  startContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 24,
    textAlign: 'center',
  },
  startBtn: {
    ...Shadow.md,
  },
  startGradient: {
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  examContainer: {
    flex: 1,
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#1e293b',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
  },
  questionScroll: {
    flex: 1,
    padding: 20,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  questionCount: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  marksBadge: {
    backgroundColor: '#0f172a',
    color: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  questionText: {
    fontSize: 18,
    color: '#1e293b',
    lineHeight: 28,
    fontWeight: '500',
    marginBottom: 30,
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  optionCardActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3b82f6',
  },
  optionMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  optionMarkerActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  optionMarkerText: {
    color: '#64748b',
    fontWeight: 'bold',
    fontSize: 14,
  },
  optionText: {
    flex: 1,
    color: '#334155',
    fontSize: 15,
  },
  textArea: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    color: '#1e293b',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    textAlignVertical: 'top',
  },
  navigation: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    justifyContent: 'space-between',
    gap: 12,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 56,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  navBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  resultsContent: {
    padding: 24,
    alignItems: 'center',
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
  },
  resultStatus: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
    width: '100%',
  },
  scoreBox: {
    flex: 1,
    alignItems: 'center',
  },
  scoreVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  scoreLab: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  feedbackCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    width: '100%',
    marginBottom: 24,
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  viewAnswersBtn: {
    paddingVertical: 12,
  },
  viewAnswersText: {
    color: '#64748b',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
