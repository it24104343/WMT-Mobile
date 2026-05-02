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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiClient from '../../src/utils/api';
import { AuthContext } from '../../src/context/AuthContext';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';

export default function AddClassScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEdit = !!id;
  const { state } = useContext(AuthContext);
  const isTeacher = state.user?.role === 'TEACHER';

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [halls, setHalls] = useState([]);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerData, setPickerData] = useState({ title: '', options: [] as any[], key: '' });
  const [hallModalVisible, setHallModalVisible] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  const [form, setForm] = useState({
    className: '',
    grade: '',
    subject: '',
    classType: 'THEORY',
    mode: 'PHYSICAL',
    monthlyFee: '',
    targetMonthYear: '',
    paymentRequiredFromWeek: '1',
    teacher: isTeacher ? state.user.profileId : '',
    teacherName: isTeacher ? (state.user.fullName || state.user.username) : '',
    capacity: '',
    dayOfWeek: '',
    hall: '',
    hallName: '',
    startTime: '',
    endTime: '',
    onlineMeetingLink: '',
    onlineMeetingDetails: '',
  });

  const getTargetMonthOptions = () => {
    const options = [];
    const now = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    for (let i = -1; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      options.push(`${months[d.getMonth()]} ${d.getFullYear()}`);
    }
    return options;
  };

  const targetMonthOptions = getTargetMonthOptions();

  useEffect(() => {
    const initData = async () => {
      try {
        if (!isTeacher) {
          const tResp = await apiClient.get('/teachers');
          setTeachers(tResp.data.data || []);
        }
        
        const hResp = await apiClient.get('/halls');
        setHalls(hResp.data.data || []);

        if (isEdit) {
          const cResp = await apiClient.get(`/classes/${id}`);
          const c = cResp.data.data;
          
          if (c.teacher) {
            await fetchTeacherSubjects(c.teacher._id || c.teacher);
          }

          setForm({
            className: c.className || '',
            grade: c.grade || '',
            subject: c.subject || '',
            classType: c.classType || 'THEORY',
            mode: c.mode || 'PHYSICAL',
            monthlyFee: String(c.monthlyFee || ''),
            targetMonthYear: `${c.targetMonth} ${c.targetYear}`,
            paymentRequiredFromWeek: String(c.paymentRequiredFromWeek || '1'),
            teacher: c.teacher?._id || c.teacher || '',
            teacherName: c.teacher?.name || '',
            capacity: String(c.capacity || ''),
            dayOfWeek: c.dayOfWeek || '',
            hall: c.hall?._id || c.hall || '',
            hallName: c.hall?.name || '',
            startTime: c.startTime || '',
            endTime: c.endTime || '',
            onlineMeetingLink: c.onlineMeetingLink || '',
            onlineMeetingDetails: c.onlineMeetingDetails || '',
          });
        } else {
          const now = new Date();
          const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
          setForm(prev => ({
            ...prev,
            targetMonthYear: `${months[now.getMonth()]} ${now.getFullYear()}`,
          }));
          
          if (isTeacher && state.user.profileId) {
            fetchTeacherSubjects(state.user.profileId);
          }
        }
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setFetchingData(false);
      }
    };
    initData();
  }, [id]);

  const fetchTeacherSubjects = async (teacherId: string) => {
    try {
      const response = await apiClient.get(`/teachers/${teacherId}`);
      const subjects = response.data.data.subjects || [];
      setTeacherSubjects(subjects);
      return subjects;
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
      return [];
    }
  };

  const validate = () => {
    const required = ['grade', 'subject', 'monthlyFee', 'targetMonthYear', 'teacher', 'capacity', 'dayOfWeek', 'startTime', 'endTime'];
    for (const field of required) {
      if (!form[field as keyof typeof form]) {
        Alert.alert('Missing Field', `Please provide ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const [m, y] = form.targetMonthYear.split(' ');
      const classTitle = form.className || `${form.subject} - Grade ${form.grade}`;

      const submitData = {
        ...form,
        className: classTitle,
        monthlyFee: Number(form.monthlyFee),
        capacity: Number(form.capacity),
        targetMonth: m,
        targetYear: Number(y),
        paymentRequiredFromWeek: Number(form.paymentRequiredFromWeek),
      };
      
      delete (submitData as any).teacherName;
      delete (submitData as any).hallName;
      delete (submitData as any).targetMonthYear;
      if (form.mode !== 'PHYSICAL') delete submitData.hall;

      if (isEdit) {
        await apiClient.put(`/classes/${id}`, submitData);
        Alert.alert('Success', 'Class updated successfully', [{ text: 'OK', onPress: () => router.back() }]);
      } else {
        await apiClient.post('/classes', submitData);
        Alert.alert('Success', 'Class created successfully', [{ text: 'OK', onPress: () => router.back() }]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save class');
    } finally {
      setLoading(false);
    }
  };

  const onTimeChange = (event: any, selectedDate: Date | undefined, type: 'start' | 'end') => {
    if (type === 'start') {
      setShowStartTimePicker(false);
      if (selectedDate) {
        setForm({ ...form, startTime: selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
      }
    } else {
      setShowEndTimePicker(false);
      if (selectedDate) {
        setForm({ ...form, endTime: selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
      }
    }
  };

  const openPicker = (title: string, options: any[], key: string) => {
    setPickerData({ title, options, key });
    setPickerVisible(true);
  };

  const renderDropdown = (label: string, value: string, options: any[], key: string, isObject = false) => {
    const displayValue = isObject 
      ? options.find(o => o.value === value)?.label 
      : value;

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{label} <Text style={styles.required}>*</Text></Text>
        <TouchableOpacity 
          style={styles.dropdownSelector}
          onPress={() => openPicker(label, options, key)}
        >
          <Text style={[styles.selectorText, !displayValue && {color: '#475569'}]}>
            {displayValue || `Select ${label}`}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#22c55e" />
        </TouchableOpacity>
      </View>
    );
  };

  if (fetchingData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
      >
        <ExpoLinearGradient colors={['#0f172a', '#1e293b']} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{isEdit ? 'Edit Class' : 'Create Class'}</Text>
            <Text style={styles.headerSubtitle}>{isEdit ? 'Update tuition class details' : 'Set up a new tuition class'}</Text>
          </View>
        </ExpoLinearGradient>

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.formCard}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                {renderDropdown('Grade', form.grade, Array.from({length: 13}, (_, i) => `Grade ${i + 1}`), 'grade')}
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                {renderDropdown('Subject', form.subject, teacherSubjects.length > 0 ? teacherSubjects : ['ICT', 'Maths', 'Science', 'English'], 'subject')}
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                {renderDropdown('Class Type', form.classType, [
                  {value: 'THEORY', label: 'Theory'},
                  {value: 'PAPER', label: 'Paper'},
                  {value: 'REVISION', label: 'Revision'}
                ], 'classType', true)}
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                {renderDropdown('Mode', form.mode, [
                  {value: 'PHYSICAL', label: 'Physical'},
                  {value: 'ONLINE', label: 'Online'}
                ], 'mode', true)}
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>Monthly Fee (LKR) <Text style={styles.required}>*</Text></Text>
                <TextInput 
                  style={styles.textInput}
                  value={form.monthlyFee}
                  onChangeText={(v) => setForm({...form, monthlyFee: v})}
                  placeholder="2500"
                  placeholderTextColor="#475569"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>Capacity <Text style={styles.required}>*</Text></Text>
                <TextInput 
                  style={styles.textInput}
                  value={form.capacity}
                  onChangeText={(v) => setForm({...form, capacity: v})}
                  placeholder="50"
                  placeholderTextColor="#475569"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {renderDropdown('Class Month', form.targetMonthYear, targetMonthOptions, 'targetMonthYear')}

            {renderDropdown('Day of Week', form.dayOfWeek, ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], 'dayOfWeek')}

            <View style={styles.row}>
              <TouchableOpacity style={styles.fieldWrapper} onPress={() => setShowStartTimePicker(true)}>
                <Text style={styles.label}>Start Time <Text style={styles.required}>*</Text></Text>
                <View style={styles.timeSelector}>
                  <Text style={[styles.timeText, !form.startTime && {color: '#475569'}]}>{form.startTime || 'Select'}</Text>
                  <Ionicons name="time-outline" size={18} color="#22c55e" />
                </View>
              </TouchableOpacity>
              <View style={{ width: 12 }} />
              <TouchableOpacity style={styles.fieldWrapper} onPress={() => setShowEndTimePicker(true)}>
                <Text style={styles.label}>End Time <Text style={styles.required}>*</Text></Text>
                <View style={styles.timeSelector}>
                  <Text style={[styles.timeText, !form.endTime && {color: '#475569'}]}>{form.endTime || 'Select'}</Text>
                  <Ionicons name="time-outline" size={18} color="#22c55e" />
                </View>
              </TouchableOpacity>
            </View>

            {renderDropdown('Payment From', form.paymentRequiredFromWeek, [
              {value: '1', label: 'Week 1'}, {value: '2', label: 'Week 2'}, {value: '3', label: 'Week 3'}
            ], 'paymentRequiredFromWeek', true)}

            {!isTeacher && (
              <TouchableOpacity style={styles.selectorWrapper} onPress={() => openPicker('Select Teacher', teachers.map((t: any) => ({ value: t._id, label: t.name })), 'teacher', true)}>
                <Text style={styles.label}>Teacher <Text style={styles.required}>*</Text></Text>
                <View style={styles.dropdownSelector}>
                  <Text style={[styles.selectorText, !form.teacherName && {color: '#475569'}]}>{form.teacherName || 'Select Teacher'}</Text>
                  <Ionicons name="chevron-down" size={20} color="#22c55e" />
                </View>
              </TouchableOpacity>
            )}

            {form.mode === 'PHYSICAL' && (
              <TouchableOpacity style={styles.selectorWrapper} onPress={() => setHallModalVisible(true)}>
                <Text style={styles.label}>Hall / Classroom</Text>
                <View style={styles.selector}>
                  <Text style={[styles.selectorText, !form.hallName && {color: '#475569'}]}>{form.hallName || 'Select Hall'}</Text>
                  <Ionicons name="chevron-down" size={20} color="#64748b" />
                </View>
              </TouchableOpacity>
            )}

            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>Custom Class Name (Optional)</Text>
              <TextInput 
                style={styles.textInput}
                value={form.className}
                onChangeText={(v) => setForm({...form, className: v})}
                placeholder="Leave blank for auto-name"
                placeholderTextColor="#475569"
              />
            </View>
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.stickyFooter}>
          <TouchableOpacity 
            style={styles.submitBtn} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <Text style={styles.submitBtnText}>{isEdit ? 'Update Class' : 'Create Class'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Time Pickers */}
      {showStartTimePicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={(e, d) => onTimeChange(e, d, 'start')}
        />
      )}
      {showEndTimePicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={(e, d) => onTimeChange(e, d, 'end')}
        />
      )}

      {/* Generic Picker Modal */}
      <Modal visible={pickerVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{pickerData.title}</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {pickerData.options.map((opt) => {
                const isObj = typeof opt === 'object';
                const val = isObj ? opt.value : opt;
                const label = isObj ? opt.label : opt;
                const active = form[pickerData.key as keyof typeof form] === val;

                return (
                  <TouchableOpacity 
                    key={val} 
                    style={[styles.modalItem, active && styles.modalItemActive]} 
                    onPress={() => {
                      if (pickerData.key === 'teacher') {
                        setForm({...form, teacher: val, teacherName: label});
                        fetchTeacherSubjects(val);
                      } else {
                        setForm({...form, [pickerData.key]: val});
                      }
                      setPickerVisible(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, active && styles.modalItemTextActive]}>{label}</Text>
                    {active && <Ionicons name="checkmark-circle" size={20} color="#22c55e" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={hallModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select Hall</Text>
              <TouchableOpacity onPress={() => setHallModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {halls.map((h: any) => (
                <TouchableOpacity key={h._id} style={styles.modalItem} onPress={() => {
                  setForm({...form, hall: h._id, hallName: h.name});
                  setHallModalVisible(false);
                }}>
                  <Text style={styles.modalItemText}>{h.name} (Cap: {h.capacity})</Text>
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
    backgroundColor: '#f8fafc',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingHorizontal: 20,
    paddingBottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  scrollContent: {
    flex: 1,
  },
  formCard: {
    margin: 16,
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadow.sm,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  required: {
    color: '#ef4444',
  },
  optionList: {
    flexDirection: 'row',
  },
  optionItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  optionItemActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: '#22c55e',
  },
  optionText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  optionTextActive: {
    color: '#22c55e',
  },
  fieldWrapper: {
    flex: 1,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    color: '#1e293b',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  timeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  timeText: {
    color: '#1e293b',
    fontSize: 15,
    fontWeight: '600',
  },
  selectorWrapper: {
    marginBottom: 20,
  },
  dropdownSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectorText: {
    color: '#1e293b',
    fontSize: 15,
    fontWeight: '500',
  },
  stickyFooter: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  submitBtn: {
    backgroundColor: '#10b981',
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  modalItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalItemText: {
    color: '#fff',
    fontSize: 16,
  },
  modalItemActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: '#22c55e',
    borderWidth: 1,
    borderRadius: 12,
  },
  modalItemTextActive: {
    color: '#22c55e',
    fontWeight: 'bold',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalCloseText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
