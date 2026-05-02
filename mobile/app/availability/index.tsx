import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal } from 'react-native';
import apiClient from '../../src/utils/api';
import { AuthContext } from '../../src/context/AuthContext';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';

export default function AvailabilityScreen() {
  const router = useRouter();
  const { state } = useContext(AuthContext);
  const isAdmin = state.user?.role === 'ADMIN';
  
  const [loading, setLoading] = useState(false);
  const [fetchingTeachers, setFetchingTeachers] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [teacherModalVisible, setTeacherModalVisible] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [form, setForm] = useState({
    dayOfWeek: 'Monday',
    startTime: '08:00',
    endTime: '10:00',
  });

  useEffect(() => {
    if (isAdmin) {
      fetchTeachers();
    }
  }, [isAdmin]);

  const fetchTeachers = async () => {
    setFetchingTeachers(true);
    try {
      const response = await apiClient.get('/teachers');
      setTeachers(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    } finally {
      setFetchingTeachers(false);
    }
  };

  const checkAvailability = async () => {
    const teacherId = isAdmin ? selectedTeacher?._id : state.user.profileId;
    
    if (!teacherId) {
      Alert.alert('Error', isAdmin ? 'Please select a teacher first' : 'Teacher profile not found');
      return;
    }

    setLoading(true);
    setResults(null);
    try {
      const response = await apiClient.post('/classes/check-availability', {
        ...form,
        teacherId
      });
      setResults(response.data);
    } catch (error) {
      console.error('Check availability error:', error);
      Alert.alert('Error', 'Failed to check availability');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Availability</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isAdmin && (
          <View style={styles.card}>
            <Text style={styles.label}>Select Teacher</Text>
            <TouchableOpacity 
              style={styles.selector} 
              onPress={() => setTeacherModalVisible(true)}
              disabled={fetchingTeachers}
            >
              {fetchingTeachers ? (
                <ActivityIndicator size="small" color={Colors.dark.primary} />
              ) : (
                <>
                  <Text style={[styles.selectorText, !selectedTeacher && { color: '#64748b' }]}>
                    {selectedTeacher ? selectedTeacher.name : 'Choose a teacher...'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={Colors.dark.primary} />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.label}>Day of Week</Text>
          <View style={styles.dayGrid}>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
              <TouchableOpacity
                key={day}
                style={[styles.dayChip, form.dayOfWeek === day && styles.dayChipActive]}
                onPress={() => setForm({ ...form, dayOfWeek: day })}
              >
                <Text style={[styles.dayChipText, form.dayOfWeek === day && styles.dayChipTextActive]}>
                  {day.substring(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.timeRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Start Time</Text>
              <TextInput
                style={styles.input}
                value={form.startTime}
                onChangeText={(val) => setForm({ ...form, startTime: val })}
                placeholder="HH:MM"
              />
            </View>
            <View style={{ width: Spacing.md }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>End Time</Text>
              <TextInput
                style={styles.input}
                value={form.endTime}
                onChangeText={(val) => setForm({ ...form, endTime: val })}
                placeholder="HH:MM"
              />
            </View>
          </View>

          <TouchableOpacity 
            style={styles.checkBtn} 
            onPress={checkAvailability}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.checkBtnText}>Check Conflict</Text>
            )}
          </TouchableOpacity>
        </View>

        {results && (
          <View style={[styles.resultCard, { borderColor: results.available ? '#22c55e' : '#ef4444' }]}>
            <View style={styles.resultHeader}>
              <Ionicons 
                name={results.available ? "checkmark-circle" : "alert-circle"} 
                size={24} 
                color={results.available ? "#22c55e" : "#ef4444"} 
              />
              <Text style={[styles.resultTitle, { color: results.available ? "#166534" : "#991b1b" }]}>
                {results.available ? "Slot is Available" : "Slot Conflict Detected"}
              </Text>
            </View>
            {!results.available && results.conflictingClass && (
              <View style={styles.conflictList}>
                <Text style={styles.conflictText}>
                  • Conflicts with {results.conflictingClass.className} ({results.conflictingClass.startTime} - {results.conflictingClass.endTime})
                </Text>
              </View>
            )}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Teacher Selection Modal */}
      <Modal
        visible={teacherModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTeacherModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Teacher</Text>
              <TouchableOpacity onPress={() => setTeacherModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {teachers.map((t: any) => (
                <TouchableOpacity 
                  key={t._id} 
                  style={[styles.modalItem, selectedTeacher?._id === t._id && styles.modalItemSelected]}
                  onPress={() => {
                    setSelectedTeacher(t);
                    setTeacherModalVisible(false);
                  }}
                >
                  <View style={styles.teacherInfo}>
                    <Text style={[styles.teacherName, selectedTeacher?._id === t._id && { color: Colors.dark.primary }]}>
                      {t.name}
                    </Text>
                    <Text style={styles.teacherSubject}>{t.subjects?.join(', ') || 'No subjects listed'}</Text>
                  </View>
                  {selectedTeacher?._id === t._id && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.dark.primary} />
                  )}
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
    backgroundColor: '#0f172a',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#334155',
    ...Shadow.sm,
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 12,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  dayChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  dayChipText: {
    fontSize: 12,
    color: '#64748b',
  },
  dayChipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  timeRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#fff',
  },
  checkBtn: {
    backgroundColor: '#3b82f6',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  checkBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultCard: {
    backgroundColor: '#1e293b',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    ...Shadow.sm,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  conflictList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  conflictText: {
    fontSize: 13,
    color: '#ef4444',
    marginBottom: 4,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectorText: {
    color: '#fff',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalList: {
    padding: 20,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalItemSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: -12,
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  teacherSubject: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
});
