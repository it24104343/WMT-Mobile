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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiClient from '../../src/utils/api';
import { AuthContext } from '../../src/context/AuthContext';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';

const TERMS = [
  { value: 'TERM_1', label: 'Term 1' },
  { value: 'TERM_2', label: 'Term 2' },
  { value: 'TERM_3', label: 'Term 3' },
  { value: 'MID_TERM', label: 'Mid Term' },
  { value: 'FINAL', label: 'Final' },
  { value: 'QUIZ', label: 'Quiz' },
  { value: 'OTHER', label: 'Other' }
];

const PAPER_TYPES = [
  { value: 'MCQ', label: 'MCQ Only' },
  { value: 'WRITTEN', label: 'Written Only' },
  { value: 'MIXED', label: 'Mixed' }
];

export default function ExamFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditing = !!id;
  
  const { state } = useContext(AuthContext);
  const isTeacher = state.user?.role === 'TEACHER';

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [classes, setClasses] = useState<any[]>([]);
  const [form, setForm] = useState({
    classId: '',
    title: '',
    description: '',
    subject: '',
    term: 'OTHER',
    paperType: 'MIXED',
    totalMarks: '100',
    passingMarks: '40',
    duration: '60',
    scheduledDate: '',
    endDate: '',
    startTime: '',
    endTime: ''
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setForm({ ...form, scheduledDate: dateString });
    }
  };

  const onStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      const timeString = selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      setForm({ ...form, startTime: timeString });
    }
  };

  const onEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      const timeString = selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      setForm({ ...form, endTime: timeString });
    }
  };

  useEffect(() => {
    fetchClasses();
    if (isEditing) {
      fetchExamToEdit();
    }
  }, [id]);

  const fetchClasses = async () => {
    try {
      const params = isTeacher ? { teacher: state.user.profileId } : {};
      const response = await apiClient.get('/classes', { params });
      setClasses(response.data.data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const fetchExamToEdit = async () => {
    try {
      const response = await apiClient.get(`/exams/${id}`);
      const exam = response.data.data.exam;
      setForm({
        classId: exam.class?._id || exam.class,
        title: exam.title,
        description: exam.description || '',
        subject: exam.subject,
        term: exam.term,
        paperType: exam.paperType,
        totalMarks: exam.totalMarks.toString(),
        passingMarks: exam.passingMarks.toString(),
        duration: exam.duration.toString(),
        scheduledDate: exam.scheduledDate ? exam.scheduledDate.split('T')[0] : '',
        endDate: exam.endDate ? exam.endDate.split('T')[0] : '',
        startTime: exam.startTime || '',
        endTime: exam.endTime || ''
      });
    } catch (error) {
      console.error('Failed to fetch exam for editing:', error);
      Alert.alert('Error', 'Failed to load exam data');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.classId) {
      Alert.alert('Error', 'Please select a class for the exam');
      return;
    }
    if (!form.title) {
      Alert.alert('Error', 'Please enter an exam title');
      return;
    }
    if (!form.totalMarks) {
      Alert.alert('Error', 'Please enter total marks');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        totalMarks: parseInt(form.totalMarks),
        passingMarks: parseInt(form.passingMarks),
        duration: parseInt(form.duration)
      };

      if (isEditing) {
        await apiClient.put(`/exams/${id}`, payload);
        Alert.alert('Success', 'Exam updated successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        await apiClient.post('/exams', payload);
        Alert.alert('Success', 'Exam created successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error: any) {
      console.error('Submit exam error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save exam');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text style={{ color: '#94a3b8', marginTop: 12 }}>Loading exam details...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <View style={[styles.header, { backgroundColor: '#0f172a' }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>{isEditing ? 'Edit Exam' : 'Create Exam'}</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSub}>
          {isEditing ? 'Update your assessment settings' : 'Schedule a new assessment for your students'}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.label}>Basic Information</Text>
          <View style={styles.card}>
            <View style={styles.inputBox}>
              <Text style={styles.inputLabel}>Select Class <Text style={{color: '#ef4444'}}>*</Text></Text>
              <View style={styles.pickerContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                  {classes.length > 0 ? (
                    classes.map((cls) => (
                      <TouchableOpacity
                        key={cls._id}
                        style={[styles.chip, form.classId === cls._id && styles.chipActive]}
                        onPress={() => setForm({ ...form, classId: cls._id, subject: cls.subject })}
                      >
                        <Text style={[styles.chipText, form.classId === cls._id && styles.chipTextActive]}>
                          {cls.className}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={{ color: '#64748b', fontSize: 13, padding: 10 }}>
                      No active classes found.
                    </Text>
                  )}
                </ScrollView>
              </View>
            </View>

            <View style={styles.inputBox}>
              <Text style={styles.inputLabel}>Exam Title <Text style={{color: '#ef4444'}}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Mid Term Exam 2026"
                placeholderTextColor="#64748b"
                value={form.title}
                onChangeText={(val) => setForm({ ...form, title: val })}
              />
            </View>

            <View style={styles.inputBox}>
              <Text style={styles.inputLabel}>Subject</Text>
              <TextInput
                style={styles.input}
                placeholder="Subject name"
                placeholderTextColor="#64748b"
                value={form.subject}
                onChangeText={(val) => setForm({ ...form, subject: val })}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Configuration</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.inputBox, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Term</Text>
                <View style={styles.selectWrapper}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                    {TERMS.map((t) => (
                      <TouchableOpacity
                        key={t.value}
                        style={[styles.smallChip, form.term === t.value && styles.smallChipActive]}
                        onPress={() => setForm({ ...form, term: t.value })}
                      >
                        <Text style={[styles.smallChipText, form.term === t.value && styles.smallChipTextActive]}>
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputBox, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Paper Type</Text>
                <View style={styles.typeRow}>
                  {PAPER_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[styles.typeBtn, form.paperType === type.value && styles.typeBtnActive]}
                      onPress={() => setForm({ ...form, paperType: type.value })}
                    >
                      <Text style={[styles.typeBtnText, form.paperType === type.value && styles.typeBtnTextActive]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputBox, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.inputLabel}>Total Marks <Text style={{color: '#ef4444'}}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={form.totalMarks}
                  onChangeText={(val) => setForm({ ...form, totalMarks: val })}
                />
              </View>
              <View style={[styles.inputBox, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Pass Marks</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={form.passingMarks}
                  onChangeText={(val) => setForm({ ...form, passingMarks: val })}
                />
              </View>
            </View>

            <View style={styles.inputBox}>
              <Text style={styles.inputLabel}>Duration (Minutes)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={form.duration}
                onChangeText={(val) => setForm({ ...form, duration: val })}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Schedule</Text>
          <View style={styles.card}>
            <View style={styles.inputBox}>
              <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
              <TouchableOpacity 
                style={styles.inputWithIcon} 
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#64748b" style={{ marginRight: 10 }} />
                <Text style={[styles.field, !form.scheduledDate && { color: '#64748b' }]}>
                  {form.scheduledDate || "Select Date"}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#64748b" />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={form.scheduledDate ? new Date(form.scheduledDate) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>

            <View style={styles.row}>
              <View style={[styles.inputBox, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.inputLabel}>Start Time (HH:MM)</Text>
                <TouchableOpacity 
                  style={styles.inputWithIcon} 
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color="#64748b" style={{ marginRight: 10 }} />
                  <Text style={[styles.field, !form.startTime && { color: '#64748b' }]}>
                    {form.startTime || "00:00"}
                  </Text>
                </TouchableOpacity>
                {showStartTimePicker && (
                  <DateTimePicker
                    value={new Date()}
                    mode="time"
                    is24Hour={true}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onStartTimeChange}
                  />
                )}
              </View>
              <View style={[styles.inputBox, { flex: 1 }]}>
                <Text style={styles.inputLabel}>End Time (HH:MM)</Text>
                <TouchableOpacity 
                  style={styles.inputWithIcon} 
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color="#64748b" style={{ marginRight: 10 }} />
                  <Text style={[styles.field, !form.endTime && { color: '#64748b' }]}>
                    {form.endTime || "00:00"}
                  </Text>
                </TouchableOpacity>
                {showEndTimePicker && (
                  <DateTimePicker
                    value={new Date()}
                    mode="time"
                    is24Hour={true}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onEndTimeChange}
                  />
                )}
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, { backgroundColor: '#3b82f6', borderRadius: 16, height: 60, justifyContent: 'center', alignItems: 'center' }]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name={isEditing ? "save-outline" : "add-circle-outline"} size={24} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.submitText}>{isEditing ? 'Save Changes' : 'Create Exam'}</Text>
            </>
          )}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSub: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadow.sm,
  },
  inputBox: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 14,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 15,
  },
  pickerContainer: {
    marginTop: 4,
  },
  chipScroll: {
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 10,
  },
  chipActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3b82f6',
  },
  chipText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#3b82f6',
  },
  smallChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  smallChipActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: '#f59e0b',
  },
  smallChipText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  smallChipTextActive: {
    color: '#f59e0b',
  },
  row: {
    flexDirection: 'row',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  typeBtnActive: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  typeBtnText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 'bold',
  },
  typeBtnTextActive: {
    color: '#3b82f6',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 52,
  },
  field: {
    flex: 1,
    color: '#1e293b',
    fontSize: 15,
  },
  submitButton: {
    marginTop: 8,
    ...Shadow.md,
  },
  submitGradient: {
    flexDirection: 'row',
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
