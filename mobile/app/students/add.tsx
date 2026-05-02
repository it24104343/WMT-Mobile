import React, { useState, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../../src/utils/api';
import { Colors, Spacing, BorderRadius, Shadow, GRadients } from '../../constants/theme';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddStudentScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  
  // Form State
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    grade: '',
    dob: new Date(),
    gender: 'Male',
    parentName: '',
    parentPhone: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGradePicker, setShowGradePicker] = useState(false);
  const grades_list = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13'];

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await apiClient.get('/classes');
      setClasses(response.data.data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.grade || !form.phone) {
      Alert.alert('Error', 'Please fill in all required fields (Name, Grade, Phone)');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/students', form);
      Alert.alert('Success', 'Student added successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Failed to add student:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label, key, placeholder, icon, keyboardType = 'default') => (
    <View style={styles.inputWrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <Ionicons name={icon as any} size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.dark.textMuted}
          value={form[key as keyof typeof form]}
          onChangeText={(val) => setForm({ ...form, [key]: val })}
          keyboardType={keyboardType as any}
        />
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Add New Student</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.formContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          {renderInput('Full Name *', 'name', 'Enter full name', 'person-outline')}
          
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Grade *</Text>
            <TouchableOpacity 
              style={styles.inputContainer} 
              onPress={() => setShowGradePicker(true)}
            >
              <Ionicons name="school-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <Text style={[styles.input, !form.grade && { color: '#94a3b8' }]}>
                {form.grade || 'Select grade'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          {renderInput('Phone Number *', 'phone', 'e.g. 0712345678', 'call-outline', 'phone-pad')}
          {renderInput('Email Address', 'email', 'example@mail.com', 'mail-outline', 'email-address')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Date of Birth</Text>
            <TouchableOpacity 
              style={styles.inputContainer} 
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <Text style={styles.input}>
                {form.dob.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={form.dob}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setForm({ ...form, dob: selectedDate });
                  }
                }}
              />
            )}
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderRow}>
              {['Male', 'Female'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderButton, form.gender === g && styles.genderButtonActive]}
                  onPress={() => setForm({ ...form, gender: g })}
                >
                  <Text style={[styles.genderText, form.gender === g && styles.genderTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {renderInput('Address', 'address', 'Enter home address', 'location-outline')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parent / Guardian Information</Text>
          {renderInput('Guardian Name', 'parentName', 'Enter guardian name', 'people-outline')}
          {renderInput('Guardian Phone', 'parentPhone', 'e.g. 0712345678', 'call-outline', 'phone-pad')}
        </View>

        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleSubmit}
          disabled={loading}
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.submitText}>Save Student Profile</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Grade Picker Modal */}
        <Modal visible={showGradePicker} transparent animationType="fade">
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setShowGradePicker(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Grade</Text>
                <TouchableOpacity onPress={() => setShowGradePicker(false)}>
                  <Ionicons name="close" size={24} color="#1e293b" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll}>
                {grades_list.map((g) => (
                  <TouchableOpacity 
                    key={g} 
                    style={[styles.gradeOption, form.grade === g && styles.gradeOptionActive]}
                    onPress={() => {
                      setForm({ ...form, grade: g });
                      setShowGradePicker(false);
                    }}
                  >
                    <Text style={[styles.gradeOptionText, form.grade === g && styles.gradeOptionTextActive]}>{g}</Text>
                    {form.grade === g && <Ionicons name="checkmark" size={20} color="#10b981" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

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
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  formContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadow.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: Spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.8,
  },
  inputWrapper: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 6,
    fontWeight: '600',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
    height: 52,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    color: '#1e293b',
    fontSize: 15,
    fontWeight: '500',
  },
  genderRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  genderButton: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
  },
  genderButtonActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10b981',
  },
  genderText: {
    color: Colors.dark.textMuted,
    fontWeight: '600',
  },
  genderTextActive: {
    color: '#10b981',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    maxHeight: '60%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalScroll: {
    maxHeight: 300,
  },
  gradeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  gradeOptionActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  gradeOptionText: {
    fontSize: 16,
    color: '#64748b',
  },
  gradeOptionTextActive: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  submitButton: {
    ...Shadow.md,
  },
  submitGradient: {
    flexDirection: 'row',
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
