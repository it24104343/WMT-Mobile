import React, { useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../../src/utils/api';
import { Colors, Spacing, BorderRadius, Shadow, GRadients } from '../../constants/theme';

export default function AddTeacherScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    qualification: '',
    address: '',
    salary: '',
  });

  React.useEffect(() => {
    if (isEdit) {
      fetchTeacherData();
    }
  }, [id]);

  const fetchTeacherData = async () => {
    setFetching(true);
    try {
      const response = await apiClient.get(`/teachers/${id}`);
      const data = response.data.data;
      setForm({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || data.contactNo || '',
        subject: data.subjects?.[0] || '',
        qualification: data.qualification || '',
        address: data.address || '',
        salary: data.salary?.toString() || '',
      });
    } catch (error) {
      console.error('Failed to fetch teacher:', error);
      Alert.alert('Error', 'Failed to load teacher data');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.subject || !form.phone) {
      Alert.alert('Error', 'Please fill in all required fields (Name, Subject, Phone)');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        subjects: [form.subject]
      };

      if (isEdit) {
        await apiClient.put(`/teachers/${id}`, payload);
        Alert.alert('Success', 'Teacher updated successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        await apiClient.post('/teachers', payload);
        Alert.alert('Success', 'Teacher added successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('Failed to save teacher:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save teacher');
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Add New Teacher</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.formContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Info</Text>
          {renderInput('Full Name *', 'name', 'Enter full name', 'person-outline')}
          {renderInput('Primary Subject *', 'subject', 'e.g. Mathematics, Physics', 'book-outline')}
          {renderInput('Qualifications', 'qualification', 'e.g. B.Sc, M.Sc', 'ribbon-outline')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Details</Text>
          {renderInput('Phone Number *', 'phone', 'e.g. 0712345678', 'call-outline', 'phone-pad')}
          {renderInput('Email Address', 'email', 'example@mail.com', 'mail-outline', 'email-address')}
          {renderInput('Home Address', 'address', 'Enter home address', 'location-outline')}
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
                <Text style={styles.submitText}>Save Teacher</Text>
              </>
            )}
          </LinearGradient>
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
