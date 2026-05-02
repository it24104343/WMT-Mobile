import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiClient from '../../src/utils/api';
import { AuthContext } from '../../src/context/AuthContext';
import { Colors, Spacing, BorderRadius, Shadow, GRadients } from '../../constants/theme';

const { width } = Dimensions.get('window');

const REQUEST_TYPES = [
  { label: 'Leave Request', value: 'LEAVE', icon: 'exit-outline' },
  { label: 'Other', value: 'OTHER', icon: 'help-circle-outline' },
];

const RECIPIENTS = [
  { label: 'Admin', value: 'ADMIN', icon: 'shield-checkmark' },
  { label: 'Teacher', value: 'TEACHER', icon: 'school' },
];

const PRIORITIES = [
  { label: 'Low', value: 'LOW', color: '#64748b', icon: 'flag-outline' },
  { label: 'Normal', value: 'NORMAL', color: '#3b82f6', icon: 'flag-outline' },
  { label: 'High', value: 'HIGH', color: '#ef4444', icon: 'flag' },
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AddServiceRequestScreen() {
  const router = useRouter();
  const { state } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [classPickerVisible, setClassPickerVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());
  
  const [form, setForm] = useState({
    type: state.user?.role === 'ADMIN' ? 'OTHER' : 'LEAVE',
    priority: 'NORMAL',
    subject: '',
    description: '',
    requestDate: '',
    classId: '',
    recipient: state.user?.role === 'ADMIN' ? 'TEACHER' : 'ADMIN',
    targetTeacher: '',
  });

  const [teachers, setTeachers] = useState([]);
  const [teacherPickerVisible, setTeacherPickerVisible] = useState(false);

  const fetchTeachers = async () => {
    try {
      const response = await apiClient.get('/teachers');
      setTeachers(response.data.data);
    } catch (error) {
      console.error('Fetch teachers error:', error);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  const fetchClasses = async () => {
    try {
      let response;
      if (state.user?.role === 'STUDENT') {
        response = await apiClient.get(`/enrollments/student/${state.user.profileId}`);
        setClasses(response.data.data.map((e: any) => e.class));
      } else if (state.user?.role === 'TEACHER') {
        response = await apiClient.get('/classes', { params: { teacher: state.user.profileId } });
        setClasses(response.data.data);
      }
    } catch (error) {
      console.error('Fetch classes error:', error);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
    
    // Format to YYYY-MM-DD
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    setForm({ ...form, requestDate: formattedDate, classId: '' });
  };

  const filteredClasses = classes.filter((c: any) => {
    if (form.type !== 'LEAVE' || !form.requestDate) return true;
    const selectedDayName = DAYS[date.getDay()];
    return c.dayOfWeek === selectedDayName;
  });

  const handleSubmit = async () => {
    const isLeave = form.type === 'LEAVE';
    
    if (isLeave) {
      if (!form.requestDate) {
        Alert.alert('Error', 'Please select a leave date first');
        return;
      }
      if (!form.classId) {
        Alert.alert('Error', 'Please select a class for your leave request');
        return;
      }
    } else {
      if (!form.subject) {
        Alert.alert('Error', 'Please provide a Subject');
        return;
      }
    }

    if (form.recipient === 'TEACHER' && !form.targetTeacher) {
      Alert.alert('Error', 'Please select a specific teacher to receive this request');
      return;
    }

    if (!form.description) {
      Alert.alert('Error', 'Please provide a Description');
      return;
    }

    setLoading(true);
    try {
      const selectedClass = classes.find((c: any) => c._id === form.classId);
      const submitData = {
        ...form,
        class: form.classId,
        targetTeacher: form.recipient === 'TEACHER' ? form.targetTeacher : null,
        subject: isLeave ? `Leave Request: ${selectedClass?.className || 'General'}` : form.subject
      };

      await apiClient.post('/service-requests', submitData);
      Alert.alert('Success', 'Your request has been submitted successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Submit request error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const selectedClass = classes.find((c: any) => c._id === form.classId);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      {/* Header Section - Navy Blue with 40px rounded corners */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>New Request</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.headerContent}>
            <Text style={styles.headerSub}>
                {state.user?.role === 'ADMIN' ? 'Send a direct message to a teacher' : 'Submit a formal request for processing'}
            </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* STEP 1: Recipient Selector (NOW FIRST) */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Send To <Text style={{color: '#ef4444'}}>*</Text></Text>
          <View style={styles.priorityRow}>
            {RECIPIENTS.filter(r => state.user?.role !== 'ADMIN' || r.value === 'TEACHER').map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[
                  styles.priorityBtn, 
                  form.recipient === r.value && styles.priorityBtnActive
                ]}
                onPress={() => {
                  // If switching to Teacher, we usually treat it as a message (OTHER)
                  setForm({ 
                    ...form, 
                    recipient: r.value, 
                    targetTeacher: '', 
                    type: r.value === 'TEACHER' ? 'OTHER' : form.type 
                  });
                }}
              >
                <Ionicons name={r.icon as any} size={18} color={form.recipient === r.value ? '#22c55e' : '#64748b'} />
                <Text style={[styles.priorityBtnText, form.recipient === r.value && styles.priorityBtnTextActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* STEP 2 (TEACHER PATH): Select Specific Teacher */}
          {form.recipient === 'TEACHER' && (
            <View style={[styles.inputBox, { marginTop: 15 }]}>
              <Text style={styles.fieldLabel}>Select Teacher <Text style={{color: '#ef4444'}}>*</Text></Text>
              <TouchableOpacity 
                style={styles.inputContainer}
                onPress={() => setTeacherPickerVisible(true)}
              >
                <Ionicons name="person-outline" size={20} color="#22c55e" style={styles.inputIcon} />
                <Text style={[styles.fieldText, !form.targetTeacher && { color: '#94a3b8' }]}>
                  {form.targetTeacher ? (teachers.find((t: any) => t._id === form.targetTeacher)?.name || 'Teacher Selected') : 'Select which teacher to contact'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* STEP 2 (ADMIN PATH): Request Type Selector */}
        {form.recipient === 'ADMIN' && state.user?.role !== 'ADMIN' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>What type of request? <Text style={{color: '#ef4444'}}>*</Text></Text>
            <View style={styles.typeGrid}>
              {REQUEST_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[styles.typeCard, form.type === type.value && styles.typeCardActive]}
                  onPress={() => setForm({ ...form, type: type.value })}
                >
                  <Ionicons 
                      name={type.icon as any} 
                      size={22} 
                      color={form.type === type.value ? '#22c55e' : '#64748b'} 
                  />
                  <Text style={[styles.typeLabel, form.type === type.value && styles.typeLabelActive]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* STEP 3: Form Details Card */}
        <View style={styles.formCard}>
          {/* Conditional Fields for Leave Request (ONLY for Admin) */}
          {form.recipient === 'ADMIN' && form.type === 'LEAVE' ? (
            <>
              <View style={styles.inputBox}>
                <Text style={styles.fieldLabel}>Leave Date <Text style={{color: '#ef4444'}}>*</Text></Text>
                <TouchableOpacity 
                  style={styles.inputContainer}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#22c55e" style={styles.inputIcon} />
                  <Text style={[styles.fieldText, !form.requestDate && { color: '#94a3b8' }]}>
                    {form.requestDate || 'Select Date First'}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    minimumDate={new Date()}
                  />
                )}
              </View>

              <View style={styles.inputBox}>
                <Text style={styles.fieldLabel}>Select Class <Text style={{color: '#ef4444'}}>*</Text></Text>
                <TouchableOpacity 
                  style={[styles.inputContainer, !form.requestDate && { opacity: 0.5 }]}
                  onPress={() => {
                    if (!form.requestDate) {
                      Alert.alert('Notice', 'Please select a leave date first to see scheduled classes');
                      return;
                    }
                    if (filteredClasses.length === 0) {
                      Alert.alert('No Classes', `You have no classes scheduled for ${DAYS[date.getDay()]}. Please pick another date.`);
                      return;
                    }
                    setClassPickerVisible(true);
                  }}
                  disabled={!form.requestDate}
                >
                  <Ionicons name="book-outline" size={20} color="#22c55e" style={styles.inputIcon} />
                  <Text style={[styles.fieldText, !form.classId && { color: '#94a3b8' }]}>
                    {selectedClass ? selectedClass.className : 'Select which class you are missing'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            /* Show Subject field for OTHER requests or Teacher messages */
            <View style={styles.inputBox}>
              <Text style={styles.fieldLabel}>Subject <Text style={{color: '#ef4444'}}>*</Text></Text>
              <TextInput
                style={styles.textInput}
                placeholder={form.recipient === 'TEACHER' ? "Message subject..." : "Brief summary of your request"}
                placeholderTextColor="#94a3b8"
                value={form.subject}
                onChangeText={(val) => setForm({ ...form, subject: val })}
              />
            </View>
          )}

          <View style={styles.inputBox}>
            <Text style={styles.fieldLabel}>Description <Text style={{color: '#ef4444'}}>*</Text></Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Explain your request in detail..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={6}
              value={form.description}
              onChangeText={(val) => setForm({ ...form, description: val })}
            />
          </View>

          <View style={styles.prioritySection}>
            <Text style={styles.fieldLabel}>Priority Level</Text>
            <View style={styles.priorityRow}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[
                    styles.priorityBtn, 
                    form.priority === p.value && styles.priorityBtnActiveSelected
                  ]}
                  onPress={() => setForm({ ...form, priority: p.value })}
                >
                  <Ionicons 
                    name={p.icon as any} 
                    size={18} 
                    color={form.priority === p.value ? '#22c55e' : '#64748b'} 
                    style={{ backgroundColor: 'transparent' }}
                  />
                  <Text style={[
                    styles.priorityBtnText, 
                    form.priority === p.value && styles.priorityBtnTextActiveSelected
                  ]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            style={styles.submitBtn} 
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#fff" style={{ marginRight: 10 }} />
                  <Text style={styles.submitBtnText}>
                    {state.user?.role === 'ADMIN' ? 'Send Message' : 'Submit Request'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Teacher Picker Modal */}
      <Modal
        visible={teacherPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTeacherPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Teacher</Text>
              <TouchableOpacity onPress={() => setTeacherPickerVisible(false)}>
                <Ionicons name="close" size={24} color="#1e293b" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={teachers}
              keyExtractor={(item: any) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.classOption}
                  onPress={() => {
                    setForm({ ...form, targetTeacher: item._id });
                    setTeacherPickerVisible(false);
                  }}
                >
                  <View>
                    <Text style={styles.classOptionTitle}>{item.name}</Text>
                    <Text style={styles.classOptionSub}>{item.subject} · {item.email}</Text>
                  </View>
                  {form.targetTeacher === item._id && (
                    <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text style={styles.emptyText}>No teachers found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Class Picker Modal */}
      <Modal
        visible={classPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setClassPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Class</Text>
              <TouchableOpacity onPress={() => setClassPickerVisible(false)}>
                <Ionicons name="close" size={24} color="#1e293b" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={filteredClasses}
              keyExtractor={(item: any) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.classOption}
                  onPress={() => {
                    setForm({ ...form, classId: item._id });
                    setClassPickerVisible(false);
                  }}
                >
                  <View>
                    <Text style={styles.classOptionTitle}>{item.className}</Text>
                    <Text style={styles.classOptionSub}>{item.subject} · {item.dayOfWeek} {item.startTime}</Text>
                  </View>
                  {form.classId === item._id && (
                    <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text style={styles.emptyText}>No classes found for this day</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#0f172a',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    ...Shadow.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 10,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  headerGreenRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
  },
  headerGreenText: {
      color: '#22c55e',
      fontSize: 18,
      fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 25,
  },
  section: {
    marginBottom: 25,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    gap: 12,
    ...Shadow.sm,
  },
  typeCardActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#22c55e',
  },
  typeIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: '#f1f5f9',
      justifyContent: 'center',
      alignItems: 'center',
  },
  typeIconContainerActive: {
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  typeLabelActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    gap: 8,
    ...Shadow.sm,
  },
  priorityBtnActive: {
      borderColor: '#22c55e',
      backgroundColor: '#f0fdf4',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  priorityBtnTextActive: {
      color: '#64748b',
  },
  priorityBtnActiveSelected: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
  },
  priorityBtnTextActiveSelected: {
    color: '#000',
    fontWeight: '800',
    backgroundColor: 'transparent',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadow.md,
    marginBottom: 20,
  },
  inputBox: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    height: 56,
  },
  textInput: {
      backgroundColor: '#f8fafc',
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderWidth: 1.5,
      borderColor: '#e2e8f0',
      color: '#1e293b',
      fontSize: 15,
      fontWeight: '500',
  },
  inputIcon: {
    marginRight: 12,
  },
  fieldText: {
    flex: 1,
    color: '#1e293b',
    fontSize: 15,
    fontWeight: '500',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  prioritySection: {
      marginTop: 10,
      marginBottom: 25,
  },
  submitBtn: {
    ...Shadow.md,
  },
  submitGradient: {
    flexDirection: 'row',
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    maxHeight: '80%',
    paddingBottom: 40,
    ...Shadow.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  classOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  classOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  classOptionSub: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyList: {
    padding: 50,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '500',
  },
});
