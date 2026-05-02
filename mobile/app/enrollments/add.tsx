import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../../src/utils/api';
import { AuthContext } from '../../src/context/AuthContext';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';

export default function EnrollStudentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { state } = useContext(AuthContext);
  const isTeacher = state.user?.role === 'TEACHER';

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  
  const [studentModalVisible, setStudentModalVisible] = useState(false);
  const [classModalVisible, setClassModalVisible] = useState(false);
  
  const [form, setForm] = useState({
    studentId: '',
    studentName: '',
    classId: (params.classId as string) || '',
    className: (params.className as string) || '',
    payAdmissionFee: false,
    notes: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentRes, classRes] = await Promise.all([
          apiClient.get('/students', { params: { limit: 200 } }),
          apiClient.get('/classes', { 
            params: { 
              limit: 100,
              teacher: isTeacher ? state.user.profileId : undefined
            } 
          })
        ]);
        
        setStudents(studentRes.data.data || []);
        setClasses(classRes.data.data || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        Alert.alert('Error', 'Failed to load students and classes');
      } finally {
        setFetchingData(false);
      }
    };

    fetchData();
  }, []);

  const validate = () => {
    if (!form.studentId) {
      Alert.alert('Missing Field', 'Please select a student');
      return false;
    }
    if (!form.classId) {
      Alert.alert('Missing Field', 'Please select a class');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await apiClient.post('/enrollments', {
        studentId: form.studentId,
        classId: form.classId,
        payAdmissionFee: form.payAdmissionFee,
        notes: form.notes,
      });
      
      Alert.alert('Success', 'Student enrolled successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to enroll student');
    } finally {
      setLoading(false);
    }
  };

  const theme = Colors.dark;

  if (fetchingData) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
      >
        <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={[styles.title, { color: '#fff' }]}>Enroll Student</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Enrollment Details</Text>
            
            <TouchableOpacity 
              style={styles.selectorWrapper} 
              onPress={() => setStudentModalVisible(true)}
            >
              <Text style={[styles.label, { color: theme.textMuted }]}>Select Student <Text style={styles.required}>*</Text></Text>
              <View style={[styles.selector, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Ionicons name="person-outline" size={20} color={theme.textMuted} style={{ marginRight: 10 }} />
                <Text style={[styles.selectorText, { color: form.studentName ? theme.text : theme.textMuted }]}>
                  {form.studentName || 'Select Student'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#10b981" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.selectorWrapper} 
              onPress={() => setClassModalVisible(true)}
            >
              <Text style={[styles.label, { color: theme.textMuted }]}>Select Class <Text style={styles.required}>*</Text></Text>
              <View style={[styles.selector, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Ionicons name="book-outline" size={20} color={theme.textMuted} style={{ marginRight: 10 }} />
                <Text style={[styles.selectorText, { color: form.className ? theme.text : theme.textMuted }]}>
                  {form.className || 'Select Class'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#10b981" />
              </View>
            </TouchableOpacity>

            <View style={[styles.switchWrapper, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.switchLabel, { color: theme.text }]}>Admission Fee Paid</Text>
                <Text style={[styles.switchSubtitle, { color: theme.textMuted }]}>Mark admission fee as paid immediately</Text>
              </View>
              <Switch
                value={form.payAdmissionFee}
                onValueChange={(val) => setForm({ ...form, payAdmissionFee: val })}
                trackColor={{ false: theme.border, true: '#10b981' }}
                thumbColor={Platform.OS === 'ios' ? '#fff' : form.payAdmissionFee ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.textMuted }]}>Notes (Optional)</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text, height: 100, textAlignVertical: 'top' }]}
                value={form.notes}
                onChangeText={(val) => setForm({ ...form, notes: val })}
                placeholder="Add any specific notes for this enrollment..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TouchableOpacity 
            style={[styles.submitBtn, { backgroundColor: '#10b981' }, loading && { opacity: 0.7 }]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="person-add-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>Enroll Student</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Student Modal */}
      <Modal visible={studentModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Student</Text>
              <TouchableOpacity onPress={() => setStudentModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {students.map((student: any) => (
                <TouchableOpacity 
                  key={student._id} 
                  style={[styles.modalItem, { borderBottomColor: theme.border }]} 
                  onPress={() => {
                    setForm({ ...form, studentId: student._id, studentName: student.name });
                    setStudentModalVisible(false);
                  }}
                >
                  <View style={[styles.studentAvatar, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                    <Text style={[styles.avatarText, { color: '#10b981' }]}>{student.name.substring(0, 1)}</Text>
                  </View>
                  <View>
                    <Text style={[styles.modalItemText, { color: theme.text }]}>{student.name}</Text>
                    <Text style={[styles.modalItemSubtext, { color: theme.textMuted }]}>Grade {student.grade} • {student.studentId}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Class Modal */}
      <Modal visible={classModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Class</Text>
              <TouchableOpacity onPress={() => setClassModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {classes.map((c: any) => (
                <TouchableOpacity 
                  key={c._id} 
                  style={[styles.modalItem, { borderBottomColor: theme.border }]} 
                  onPress={() => {
                    setForm({ ...form, classId: c._id, className: c.className });
                    setClassModalVisible(false);
                  }}
                >
                  <View style={[styles.classIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                    <Ionicons name="book-outline" size={20} color="#10b981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modalItemText, { color: theme.text }]}>{c.className}</Text>
                    <Text style={[styles.modalItemSubtext, { color: theme.textMuted }]}>{c.subject} • Grade {c.grade}</Text>
                  </View>
                  <View style={[styles.capacityBadge, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.capacityText, { color: theme.textMuted }]}>{c.enrolledCount}/{c.capacity}</Text>
                  </View>
                </TouchableOpacity>
              ))}
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
    backgroundColor: '#f1f5f9',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  content: {
    padding: Spacing.lg,
  },
  formCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: Spacing.lg,
  },
  selectorWrapper: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    padding: 12,
    borderWidth: 1,
  },
  selectorText: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
  },
  switchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  switchSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  textInput: {
    borderRadius: BorderRadius.md,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  submitBtn: {
    backgroundColor: '#10b981',
    height: 54,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.md,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 16,
  },
  classIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  modalItemSubtext: {
    fontSize: 12,
    color: '#64748b',
  },
  capacityBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  capacityText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
});
