import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../../../src/utils/api';
import { Colors, Spacing, BorderRadius, Shadow, GRadients } from '../../../constants/theme';

export default function ExamDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [qForm, setQForm] = useState({
    type: 'MCQ',
    content: '',
    marks: '1',
    options: ['', '', '', ''],
    correctOption: 0,
    explanation: ''
  });

  const fetchExamDetails = async () => {
    try {
      const response = await apiClient.get(`/exams/${id}`);
      const { exam: examData, questions: qData } = response.data.data;
      setExam(examData);
      setQuestions(qData || []);


    } catch (error) {
      console.error('Failed to fetch exam details:', error);
      Alert.alert('Error', 'Failed to load exam details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamDetails();
  }, [id]);

  const handleTogglePublish = async () => {
    try {
      await apiClient.put(`/exams/${id}/publish`);
      fetchExamDetails();
      Alert.alert('Success', `Exam ${exam.isPublished ? 'Unpublished' : 'Published'}!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleToggleResults = async () => {
    try {
      await apiClient.put(`/exams/${id}/results`);
      fetchExamDetails();
      Alert.alert('Success', `Results ${exam.resultsPublished ? 'Hidden' : 'Published'}!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update results status');
    }
  };

  const handleAddQuestion = async () => {
    if (!qForm.content) {
      Alert.alert('Error', 'Question content is required');
      return;
    }
    try {
      const payload = {
        type: qForm.type,
        content: qForm.content,
        marks: parseFloat(qForm.marks),
        options: qForm.type === 'MCQ' ? qForm.options.map((opt, i) => ({
          text: opt,
          isCorrect: i === qForm.correctOption
        })) : [],
        explanation: qForm.explanation
      };
      await apiClient.post(`/exams/${id}/questions`, payload);
      setModalVisible(false);
      setQForm({
        type: 'MCQ',
        content: '',
        marks: '1',
        options: ['', '', '', ''],
        correctOption: 0,
        explanation: ''
      });
      fetchExamDetails();
      Alert.alert('Success', 'Question added!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add question');
    }
  };

  const handleDeleteQuestion = (qId: string) => {
    Alert.alert('Delete', 'Are you sure you want to delete this question?', [
      { text: 'Cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/exams/${id}/questions/${qId}`);
            fetchExamDetails();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete');
          }
        }
      }
    ]);
  };

  const { state } = React.useContext(require('../../../src/context/AuthContext').AuthContext);
  const isAdmin = state.user?.role === 'ADMIN';
  const isTeacher = state.user?.role === 'TEACHER';

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>{exam.title}</Text>
          {isTeacher && (
            <TouchableOpacity 
              onPress={() => router.push({ pathname: '/exams/add', params: { id } })} 
              style={styles.editButton}
            >
              <Ionicons name="create-outline" size={22} color="#fff" />
            </TouchableOpacity>
          )}
          {isAdmin && <View style={{ width: 40 }} />}
        </View>
        <Text style={styles.subTitle}>{exam.class?.className} • {exam.subject}</Text>
        
        {isTeacher && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: exam.isPublished ? '#64748b' : '#10b981' }]}
              onPress={exam.isPublished ? undefined : handleTogglePublish}
              activeOpacity={exam.isPublished ? 1 : 0.8}
              disabled={exam.isPublished}
            >
              <Ionicons name={exam.isPublished ? "checkmark-done-circle" : "checkmark-circle-outline"} size={18} color="#fff" />
              <Text style={styles.actionBtnText}>{exam.isPublished ? 'Published!' : 'Publish Now'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>


        {!isAdmin && (
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Ionicons name="help-outline" size={20} color="#3b82f6" />
              </View>
              <Text style={styles.statVal}>{questions.length}</Text>
              <Text style={styles.statLab}>Questions</Text>
            </View>
            <View style={styles.statBox}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Ionicons name="star-outline" size={20} color="#10b981" />
              </View>
              <Text style={styles.statVal}>{exam.totalMarks}</Text>
              <Text style={styles.statLab}>Total Marks</Text>
            </View>
            <View style={styles.statBox}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <Ionicons name="time-outline" size={20} color="#f59e0b" />
              </View>
              <Text style={styles.statVal}>{exam.duration}</Text>
              <Text style={styles.statLab}>Minutes</Text>
            </View>
          </View>
        )}

        {!isAdmin && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Questions</Text>
            {isTeacher && (
              <TouchableOpacity style={styles.addQBtn} onPress={() => setModalVisible(true)}>
                <Ionicons name="add-circle" size={24} color="#10b981" />
                <Text style={styles.addQText}>Add Question</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {!isAdmin && questions.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="help-circle-outline" size={48} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyText}>No questions added yet</Text>
            <Text style={styles.emptySubText}>Click "Add Question" to start building your exam</Text>
          </View>
        ) : (
          !isAdmin && questions.map((q, idx) => (
            <View key={q._id} style={styles.qCard}>
              <View style={styles.qHeader}>
                <View style={styles.qIndex}>
                  <Text style={styles.qIndexText}>Q{idx + 1}</Text>
                </View>
                <View style={styles.qMeta}>
                  <View style={styles.qTypeBadge}>
                    <Text style={styles.qTypeText}>{q.type}</Text>
                  </View>
                  <Text style={styles.qMarksText}>{q.marks} Marks</Text>
                </View>
                  {isTeacher && (
                    <TouchableOpacity onPress={() => handleDeleteQuestion(q._id)} style={styles.deleteBtn}>
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  )}
              </View>
              <Text style={styles.qContent}>{q.content}</Text>
              {q.type === 'MCQ' && (
                <View style={styles.optionsList}>
                  {q.options.map((opt: any, i: number) => (
                    <View key={i} style={[styles.optItem, opt.isCorrect && styles.optItemCorrect]}>
                      <View style={[styles.optDot, opt.isCorrect && styles.optDotCorrect]} />
                      <Text style={[styles.optText, opt.isCorrect && styles.optTextCorrect]}>{opt.text}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}

        <TouchableOpacity 
          style={styles.resultsFab}
          onPress={() => router.push(`/exams/${id}/marks`)}
          activeOpacity={0.9}
        >
          <LinearGradient 
            colors={['#10b981', '#059669']} 
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.resultsGradient}
          >
            <Ionicons name="people-outline" size={24} color="#fff" />
            <Text style={styles.resultsFabText}>{isAdmin ? 'View All Student Results' : 'Manage Submissions'}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Question Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#0f172a', '#1e293b']}
              style={styles.modalHeader}
            >
              <View>
                <Text style={styles.modalTitle}>Add Question</Text>
                <Text style={styles.modalSubtitle}>Create a new exam task</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputSection}>
                <Text style={styles.fieldLabel}>Configuration</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Question Type</Text>
                  <View style={styles.typeRow}>
                    {['MCQ', 'WRITTEN'].map((t) => (
                      <TouchableOpacity 
                        key={t}
                        style={[styles.typeBtn, qForm.type === t && styles.typeBtnActive]}
                        onPress={() => setQForm({ ...qForm, type: t })}
                      >
                        <Text style={[styles.typeBtnText, qForm.type === t && styles.typeBtnTextActive]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Marks</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="star-outline" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput 
                      style={styles.input}
                      keyboardType="numeric"
                      value={qForm.marks}
                      onChangeText={(val) => setQForm({ ...qForm, marks: val })}
                      placeholder="1"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.fieldLabel}>Question Content</Text>
                <View style={[styles.inputContainer, { height: 120, alignItems: 'flex-start', paddingTop: 12 }]}>
                  <Ionicons name="document-text-outline" size={20} color="#64748b" style={[styles.inputIcon, { marginTop: 2 }]} />
                  <TextInput 
                    style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                    multiline
                    placeholder="Enter your question here..."
                    placeholderTextColor="#94a3b8"
                    value={qForm.content}
                    onChangeText={(val) => setQForm({ ...qForm, content: val })}
                  />
                </View>
              </View>

              {qForm.type === 'MCQ' && (
                <View style={styles.inputSection}>
                  <Text style={styles.fieldLabel}>Options (Select Correct)</Text>
                  {qForm.options.map((opt, i) => (
                    <View key={i} style={styles.optInputRow}>
                      <TouchableOpacity 
                        style={[styles.optSelect, qForm.correctOption === i && styles.optSelectActive]}
                        onPress={() => setQForm({ ...qForm, correctOption: i })}
                      >
                        {qForm.correctOption === i && <View style={styles.optSelectDot} />}
                      </TouchableOpacity>
                      <View style={[styles.inputContainer, { flex: 1, height: 50 }]}>
                        <TextInput 
                          style={styles.input}
                          placeholder={`Option ${String.fromCharCode(65 + i)}`}
                          placeholderTextColor="#94a3b8"
                          value={opt}
                          onChangeText={(val) => {
                            const newOpts = [...qForm.options];
                            newOpts[i] = val;
                            setQForm({ ...qForm, options: newOpts });
                          }}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity 
                style={styles.submitBtnContainer}
                onPress={handleAddQuestion}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitBtn}
                >
                  <Text style={styles.submitBtnText}>Save Question</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" style={{marginLeft: 8}} />
                </LinearGradient>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 64,
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginHorizontal: 12,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 24,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  content: {
    padding: 20,
  },
  summaryContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryVal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  summaryLab: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 'bold',
    marginTop: 4,
  },
  percentageRow: {
    flexDirection: 'row',
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    justifyContent: 'space-around',
  },
  percentBox: {
    alignItems: 'center',
  },
  percentVal: {
    fontSize: 28,
    fontWeight: '800',
  },
  percentLab: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  percentDivider: {
    width: 1,
    backgroundColor: '#f1f5f9',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    justifyContent: 'space-between',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLab: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  addQBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addQText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptySubText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
  },
  qCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  qHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  qIndex: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  qIndexText: {
    color: '#1e293b',
    fontWeight: 'bold',
    fontSize: 14,
  },
  qMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qTypeBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  qTypeText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  qMarksText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteBtn: {
    padding: 4,
  },
  qContent: {
    fontSize: 16,
    color: '#1e293b',
    lineHeight: 24,
    marginBottom: 16,
    fontWeight: '500',
  },
  optionsList: {
    gap: 10,
  },
  optItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  optItemCorrect: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  optDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e1',
    marginRight: 12,
  },
  optDotCorrect: {
    backgroundColor: '#10b981',
  },
  optText: {
    fontSize: 14,
    color: '#475569',
  },
  optTextCorrect: {
    color: '#1e293b',
    fontWeight: 'bold',
  },
  resultsFab: {
    marginTop: 12,
  },
  resultsGradient: {
    flexDirection: 'row',
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  resultsFabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    height: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 32,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 24,
  },
  inputSection: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    opacity: 0.5,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typeBtnActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  typeBtnText: {
    color: '#64748b',
    fontWeight: 'bold',
  },
  typeBtnTextActive: {
    color: '#10b981',
  },
  optInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  optSelect: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optSelectActive: {
    borderColor: '#10b981',
  },
  optSelectDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10b981',
  },
  submitBtnContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  submitBtn: {
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
