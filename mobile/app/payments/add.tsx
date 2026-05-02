import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  Modal,
  Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../../src/context/AuthContext';
import apiClient from '../../src/utils/api';
import { Colors, Spacing, BorderRadius, Shadow, GRadients } from '../../constants/theme';

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEARS = [2024, 2025, 2026].map(String);

export default function RecordPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { state } = React.useContext(AuthContext);
  const user = state.user;
  const isStudent = user?.role === 'STUDENT';
  const isAdmin = user?.role === 'ADMIN';
  
  const [loading, setLoading] = useState(false);
  const [enrollments, setEnrollments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  
  const [modals, setModals] = useState({
    type: false,
    target: false,
    month: false,
    year: false,
    method: false
  });
  
  const [form, setForm] = useState({
    paymentType: params.type === 'TEACHER_SALARY' ? 'TEACHER_SALARY' : 'CLASS_FEE',
    targetId: '', 
    targetName: '',
    amount: '',
    paymentMethod: isStudent ? 'CARD' : 'CASH',
    month: MONTHS[new Date().getMonth()],
    year: new Date().getFullYear().toString(),
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    notes: ''
  });

  const [slip, setSlip] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      if (isAdmin) {
        const [teachersRes, classesRes, enrollRes] = await Promise.all([
          apiClient.get('/teachers'),
          apiClient.get('/classes'),
          apiClient.get('/enrollments')
        ]);
        setTeachers(teachersRes.data.data);
        setAllClasses(classesRes.data.data);
        setEnrollments(enrollRes.data.data);
      } else if (isStudent) {
        const enrollRes = await apiClient.get(`/enrollments/student/${user.profileId}`);
        setEnrollments(enrollRes.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < cleaned.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      if (formatted.length < 19) formatted += cleaned[i];
    }
    setForm({ ...form, cardNumber: formatted });
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length >= 2) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    setForm({ ...form, expiryDate: formatted });
  };

  const handlePickSlip = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });
    if (!result.canceled) {
      setSlip(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!form.targetId || !form.amount) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const monthIndex = MONTHS.indexOf(form.month) + 1;
      let endpoint = '';
      let formData: any = new FormData();

      if (form.paymentType === 'TEACHER_SALARY') {
        endpoint = '/payments/teacher-salary';
        formData.append('teacherId', form.targetId);
      } else {
        endpoint = isStudent ? (form.paymentMethod === 'CARD' ? '/payments/gateway' : '/payments/bank-transfer') : '/payments';
        formData.append('enrollmentId', form.targetId);
      }

      formData.append('month', monthIndex.toString());
      formData.append('year', form.year);
      formData.append('amount', form.amount);
      formData.append('paymentMethod', form.paymentMethod);
      formData.append('notes', form.notes || (form.paymentType === 'TEACHER_SALARY' ? 'Monthly Salary' : 'Class Fee'));

      if (form.paymentMethod === 'CARD') {
        if (isStudent || form.paymentType === 'TEACHER_SALARY') {
          await apiClient.post(endpoint, {
            ... (form.paymentType === 'TEACHER_SALARY' ? { teacherId: form.targetId } : { enrollmentId: form.targetId }),
            month: monthIndex,
            year: parseInt(form.year),
            amount: parseFloat(form.amount),
            paymentMethod: 'CARD',
            cardNumber: form.cardNumber.replace(/\s/g, ''),
            expiryDate: form.expiryDate,
            cvv: form.cvv,
            notes: form.notes
          });
        }
      } else {
        if (slip) {
          const filename = slip.split('/').pop();
          const match = /\.(\w+)$/.exec(filename || '');
          const type = match ? `image/${match[1]}` : `image`;
          formData.append('receipt', { uri: slip, name: filename, type } as any);
        }
        await apiClient.post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      Alert.alert('Success', 'Payment recorded successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Payment error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const getTeacherClasses = (teacherId: string) => {
    return allClasses.filter((c: any) => c.teacher?._id === teacherId || c.teacher === teacherId);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {form.paymentType === 'TEACHER_SALARY' ? 'Pay Teacher Salary' : 'Record Student Fee'}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>
              {form.paymentType === 'TEACHER_SALARY' ? 'Select Teacher *' : 'Select Class *'}
            </Text>
            <TouchableOpacity 
              style={styles.inputContainer}
              onPress={() => setModals({ ...modals, target: true })}
            >
              <Ionicons name="book-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
              <Text style={[styles.input, !form.targetName && { color: Colors.dark.textMuted }]}>
                {form.targetName || `Choose ${form.paymentType === 'TEACHER_SALARY' ? 'Teacher' : 'Class'}`}
              </Text>
              <Ionicons name="search-outline" size={20} color={Colors.dark.primary} />
            </TouchableOpacity>
          </View>

          {form.paymentType === 'TEACHER_SALARY' && form.targetId && (
            <View style={styles.classInfo}>
              <Text style={styles.classLabel}>Teaching Classes:</Text>
              <View style={styles.classTags}>
                {getTeacherClasses(form.targetId).map((c: any) => (
                  <View key={c._id} style={styles.classTag}>
                    <Text style={styles.classTagText}>{c.className}</Text>
                  </View>
                ))}
                {getTeacherClasses(form.targetId).length === 0 && (
                  <Text style={styles.noClasses}>No classes assigned</Text>
                )}
              </View>
            </View>
          )}

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Amount (Rs.)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="cash-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={Colors.dark.textMuted}
                value={form.amount}
                onChangeText={(val) => setForm({ ...form, amount: val })}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Payment Method</Text>
            <TouchableOpacity 
              style={styles.inputContainer}
              onPress={() => setModals({ ...modals, method: true })}
            >
              <Ionicons name="card-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
              <Text style={styles.input}>{form.paymentMethod}</Text>
              <Ionicons name="chevron-down" size={18} color={Colors.dark.textMuted} />
            </TouchableOpacity>
          </View>

          {form.paymentMethod === 'CARD' && (
            <View style={styles.cardForm}>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Card Number</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="0000 0000 0000 0000"
                    placeholderTextColor={Colors.dark.textMuted}
                    value={form.cardNumber}
                    onChangeText={formatCardNumber}
                    keyboardType="numeric"
                    maxLength={19}
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.label}>Expiry</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="MM/YY"
                      placeholderTextColor={Colors.dark.textMuted}
                      value={form.expiryDate}
                      onChangeText={formatExpiryDate}
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>CVV</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="123"
                      placeholderTextColor={Colors.dark.textMuted}
                      value={form.cvv}
                      onChangeText={(val) => setForm({ ...form, cvv: val })}
                      keyboardType="numeric"
                      maxLength={3}
                      secureTextEntry
                    />
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Salary Month</Text>
          <TouchableOpacity style={styles.inputContainer} onPress={() => setModals({ ...modals, month: true })}>
            <Ionicons name="calendar-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
            <Text style={styles.input}>{form.month} {form.year}</Text>
            <Ionicons name="chevron-down" size={18} color={Colors.dark.textMuted} />
          </TouchableOpacity>
        </View>

        {form.paymentMethod === 'BANK_TRANSFER' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Salary Slip</Text>
            <TouchableOpacity style={styles.uploadBox} onPress={handlePickSlip}>
              {slip ? (
                <View style={styles.slipPreview}>
                  <Ionicons name="document-text" size={40} color={Colors.dark.primary} />
                  <Text style={styles.slipText}>Slip Selected</Text>
                </View>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="cloud-upload-outline" size={40} color={Colors.dark.textMuted} />
                  <Text style={styles.uploadText}>Upload Salary Slip</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleSave}
          disabled={loading}
        >
          <LinearGradient colors={GRadients.primary} style={styles.submitGradient}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Confirm Payment</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Modals */}
      <Modal visible={modals.target} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select {form.paymentType === 'TEACHER_SALARY' ? 'Teacher' : 'Recipient'}</Text>
            <ScrollView>
              {form.paymentType === 'TEACHER_SALARY' ? (
                teachers.map((t: any) => (
                  <TouchableOpacity 
                    key={t._id} style={styles.modalItem}
                    onPress={() => { setForm({ ...form, targetId: t._id, targetName: t.name }); setModals({ ...modals, target: false }); }}
                  >
                    <View>
                      <Text style={styles.modalItemText}>{t.name}</Text>
                      <Text style={styles.modalItemSub}>{t.email}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                enrollments.map((e: any) => (
                  <TouchableOpacity 
                    key={e._id} style={styles.modalItem}
                    onPress={() => { setForm({ ...form, targetId: e._id, targetName: `${e.student?.name} - ${e.class?.className}`, amount: e.class?.monthlyFee?.toString() || '' }); setModals({ ...modals, target: false }); }}
                  >
                    <View>
                      <Text style={styles.modalItemText}>{e.student?.name}</Text>
                      <Text style={styles.modalItemSub}>{e.class?.className}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModals({ ...modals, target: false })}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={modals.month} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Month</Text>
            <ScrollView>
              {MONTHS.map(m => (
                <TouchableOpacity key={m} style={styles.modalItem} onPress={() => { setForm({ ...form, month: m }); setModals({ ...modals, month: false }); }}>
                  <Text style={styles.modalItemText}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={modals.method} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Payment Method</Text>
            {['CASH', 'BANK_TRANSFER', 'CARD'].map(m => (
              <TouchableOpacity key={m} style={styles.modalItem} onPress={() => { setForm({ ...form, paymentMethod: m }); setModals({ ...modals, method: false }); }}>
                <Text style={styles.modalItemText}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  content: { padding: 20 },
  section: { backgroundColor: Colors.dark.surface, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.dark.border },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.dark.success, marginBottom: 15, textTransform: 'uppercase' },
  inputWrapper: { marginBottom: 15 },
  label: { fontSize: 13, color: Colors.dark.textMuted, marginBottom: 6 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.background, borderRadius: 10, paddingHorizontal: 15, height: 52, borderWidth: 1, borderColor: Colors.dark.border },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: Colors.dark.text, fontSize: 15 },
  classInfo: { marginBottom: 15, paddingHorizontal: 5 },
  classLabel: { fontSize: 13, color: Colors.dark.textMuted, marginBottom: 8 },
  classTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  classTag: { backgroundColor: 'rgba(34, 197, 94, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.2)' },
  classTagText: { color: Colors.dark.success, fontSize: 12, fontWeight: '600' },
  noClasses: { color: Colors.dark.textMuted, fontSize: 12, fontStyle: 'italic' },
  cardForm: { marginTop: 10 },
  row: { flexDirection: 'row' },
  uploadBox: { borderWidth: 2, borderColor: Colors.dark.border, borderStyle: 'dashed', borderRadius: 12, height: 120, justifyContent: 'center', alignItems: 'center' },
  uploadPlaceholder: { alignItems: 'center' },
  uploadText: { color: Colors.dark.text, marginTop: 8 },
  slipPreview: { alignItems: 'center' },
  slipText: { color: Colors.dark.primary, marginTop: 5, fontWeight: '600' },
  submitBtn: { marginTop: 10, marginBottom: 40 },
  submitGradient: { height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: Colors.dark.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.dark.text, marginBottom: 15 },
  modalItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  modalItemText: { color: Colors.dark.text, fontSize: 16, fontWeight: 'bold' },
  modalItemSub: { color: Colors.dark.textMuted, fontSize: 12, marginTop: 2 },
  closeBtn: { marginTop: 15, padding: 15, alignItems: 'center' },
  closeBtnText: { color: Colors.dark.primary, fontWeight: 'bold' }
});
