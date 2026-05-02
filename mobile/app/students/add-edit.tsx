import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, ScrollView, Pressable, ActivityIndicator, Alert, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import studentService from '@/src/services/studentService';

export default function AddEditStudentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    grade: '',
    parentName: '',
    parentPhone: '',
  });

  const [paymentOption, setPaymentOption] = useState('now');
  const [isPaid, setIsPaid] = useState(true);

  useEffect(() => {
    if (isEditing) {
      fetchStudent();
    }
  }, [id]);

  const fetchStudent = async () => {
    try {
      const response = await studentService.getStudent(id as string);
      const student = response.data || response;
      setFormData({
        name: student.name || '',
        email: student.email || '',
        phone: student.phone || '',
        grade: student.grade ? student.grade.toString() : '',
        parentName: student.parentName || '',
        parentPhone: student.parentPhone || '',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch student details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert('Validation Error', 'Name and Email are required.');
      return;
    }

    try {
      setSaving(true);
      if (isEditing) {
        await studentService.updateStudent(id as string, formData);
        Alert.alert('Success', 'Student updated successfully');
      } else {
        const payload = { ...formData, paymentOption, isPaid };
        await studentService.createStudent(payload);
        Alert.alert('Success', 'Student added successfully');
      }
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save student');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color="#333" />
        </Pressable>
        <ThemedText type="title">{isEditing ? 'Edit Student' : 'Add Student'}</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.formContainer}>
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Name *</ThemedText>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Enter student name"
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Email *</ThemedText>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="Enter email address"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Phone</ThemedText>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Grade</ThemedText>
          <TextInput
            style={styles.input}
            value={formData.grade}
            onChangeText={(text) => setFormData({ ...formData, grade: text })}
            placeholder="e.g. 10"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Parent/Guardian Name</ThemedText>
          <TextInput
            style={styles.input}
            value={formData.parentName}
            onChangeText={(text) => setFormData({ ...formData, parentName: text })}
            placeholder="Enter parent name"
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Parent Phone</ThemedText>
          <TextInput
            style={styles.input}
            value={formData.parentPhone}
            onChangeText={(text) => setFormData({ ...formData, parentPhone: text })}
            placeholder="Enter parent phone number"
            keyboardType="phone-pad"
          />
        </View>

        {!isEditing && (
          <View style={styles.paymentSection}>
            <ThemedText style={styles.sectionTitle}>Registration Payment</ThemedText>
            
            <View style={styles.switchRow}>
              <ThemedText>Pay Now (Cash)</ThemedText>
              <Switch
                value={paymentOption === 'now'}
                onValueChange={(val) => setPaymentOption(val ? 'now' : 'later')}
                trackColor={{ false: '#ccc', true: '#4CAF50' }}
              />
            </View>

            {paymentOption === 'now' && (
              <View style={styles.switchRow}>
                <ThemedText>Mark as Paid</ThemedText>
                <Switch
                  value={isPaid}
                  onValueChange={setIsPaid}
                  trackColor={{ false: '#ccc', true: '#4CAF50' }}
                />
              </View>
            )}
          </View>
        )}

        <Pressable 
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
             <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.saveBtnText}>
              {isEditing ? 'Update Student' : 'Add Student'}
            </ThemedText>
          )}
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 16
  },
  backBtn: { padding: 4 },
  formContainer: { padding: 20, gap: 16 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#555' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
  },
  paymentSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    marginTop: 8,
    gap: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveBtn: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
