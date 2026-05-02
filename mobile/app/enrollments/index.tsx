import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../../src/utils/api';
import { AuthContext } from '../../src/context/AuthContext';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';

export default function EnrollmentsScreen() {
  const router = useRouter();
  const { classId } = useLocalSearchParams();
  const { state } = useContext(AuthContext);
  const isTeacher = state.user?.role === 'TEACHER';
  const isStudent = state.user?.role === 'STUDENT';
  const isAdmin = state.user?.role === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [classModalVisible, setClassModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  const fetchEnrollments = async () => {
    if (!selectedClass && !classId) {
      setEnrollments([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setLoading(true);
    try {
      const params: any = {};
      let endpoint = '/enrollments';

      if (isStudent) {
        endpoint = `/enrollments/student/${state.user.profileId}`;
      } else {
        if (isTeacher) params.teacher = state.user.profileId;
        if (selectedClass) params.classId = selectedClass._id;
        else if (classId) params.classId = classId;
      }
      
      const response = await apiClient.get(endpoint, { params });
      setEnrollments(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch enrollments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const params = isTeacher ? { teacher: state.user.profileId } : {};
      const response = await apiClient.get('/classes', { params });
      const fetchedClasses = response.data.data || [];
      setClasses(fetchedClasses);
      
      // If classId param is provided, auto-select that class
      if (classId) {
        const target = fetchedClasses.find((c: any) => c._id === classId);
        if (target) setSelectedClass(target);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [selectedClass, classId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEnrollments();
  };

  const filteredEnrollments = enrollments.filter(e => 
    e.student?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    e.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.class?.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.class?.className?.toLowerCase().includes(search.toLowerCase()) ||
    e.student?.studentId?.toLowerCase().includes(search.toLowerCase())
  );

  const theme = Colors.dark;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.title, { color: '#fff' }]}>Enrollments</Text>
          {!isStudent && (
            <TouchableOpacity 
              onPress={() => router.push({ 
                pathname: '/enrollments/add', 
                params: selectedClass ? { classId: selectedClass._id, className: selectedClass.className || selectedClass.name } : {} 
              })} 
              style={[styles.addButton, { backgroundColor: '#10b981' }]}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {!isStudent && (
          <View style={styles.filterRow}>
            <TouchableOpacity 
              style={[styles.classPicker, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setClassModalVisible(true)}
            >
              <Ionicons name="book-outline" size={18} color={theme.textMuted} />
              <Text style={[styles.classPickerText, { color: selectedClass ? theme.text : theme.textMuted }]}>
                {selectedClass ? (selectedClass.className || selectedClass.name) : 'All Classes'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#10b981" />
            </TouchableOpacity>
            
            {selectedClass && (
              <TouchableOpacity 
                style={[styles.clearBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => setSelectedClass(null)}
              >
                <Ionicons name="close" size={18} color={theme.error} />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search" size={20} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search student or class..."
            placeholderTextColor={theme.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
      >
        {!isStudent && !selectedClass && !classId ? (
          <View style={styles.selectClassContainer}>
            <View style={[styles.selectClassIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Ionicons name="school-outline" size={64} color="#10b981" />
            </View>
            <Text style={[styles.selectClassTitle, { color: theme.text }]}>Select a Class</Text>
            <Text style={[styles.selectClassSub, { color: theme.textMuted }]}>
              Please choose a class to manage its student enrollments.
            </Text>
            <TouchableOpacity 
              style={[styles.selectBtn, { backgroundColor: '#10b981' }]}
              onPress={() => setClassModalVisible(true)}
            >
              <Text style={styles.selectBtnText}>Choose Class</Text>
            </TouchableOpacity>
          </View>
        ) : loading && !refreshing ? (
          <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 50 }} />
        ) : filteredEnrollments.length > 0 ? (
          filteredEnrollments.map((item, index) => (
            <View key={index} style={[styles.enrollmentCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.studentInfo}>
                <View style={[styles.avatar, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <Text style={[styles.avatarText, { color: '#10b981' }]}>
                    {(item.student?.fullName || item.student?.name)?.substring(0, 1) || 'S'}
                  </Text>
                </View>
                <View style={styles.details}>
                  <Text style={[styles.studentName, { color: theme.text }]}>{item.student?.fullName || item.student?.name}</Text>
                  <Text style={[styles.studentId, { color: theme.textMuted }]}>{item.student?.studentId || 'ID: ' + item.student?._id?.substring(0, 8)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'ACTIVE' || item.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                  <Text style={[styles.statusText, { color: item.status === 'ACTIVE' || item.isActive ? theme.success : theme.error }]}>
                    {item.status || (item.isActive ? 'ACTIVE' : 'INACTIVE')}
                  </Text>
                </View>
              </View>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <View style={styles.classInfo}>
                <Ionicons name="book-outline" size={16} color={theme.textMuted} />
                <Text style={[styles.className, { color: theme.text }]}>{item.class?.name || item.class?.className}</Text>
              </View>
              <View style={styles.footer}>
                <Text style={[styles.dateText, { color: theme.textMuted }]}>Enrolled: {item.enrolledAt ? new Date(item.enrolledAt).toLocaleDateString() : 'N/A'}</Text>
                <TouchableOpacity 
                  style={[styles.viewBtn, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }]}
                  onPress={() => router.push(`/students/${item.student?._id || item.student}`)}
                >
                  <Text style={[styles.viewBtnText, { color: '#10b981' }]}>Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={theme.border} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>No enrollments found for this class</Text>
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Class Selector Modal */}
      <Modal
        visible={classModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setClassModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitleText, { color: theme.text }]}>Select Class</Text>
              <TouchableOpacity onPress={() => setClassModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              <TouchableOpacity 
                style={[styles.modalItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => {
                  setSelectedClass(null);
                  setClassModalVisible(false);
                }}
              >
                <Text style={[styles.modalItemTitle, { color: theme.text }]}>All Classes</Text>
                {!selectedClass && <Ionicons name="checkmark-circle" size={20} color="#10b981" />}
              </TouchableOpacity>
              
              {classes.map((cls) => (
                <TouchableOpacity 
                  key={cls._id} 
                  style={[styles.modalItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => {
                    setSelectedClass(cls);
                    setClassModalVisible(false);
                  }}
                >
                  <View>
                    <Text style={[styles.modalItemTitle, { color: theme.text }]}>{cls.className || cls.name}</Text>
                    <Text style={[styles.modalItemSub, { color: theme.textMuted }]}>{cls.subject} • Grade {cls.grade}</Text>
                  </View>
                  {selectedClass?._id === cls._id && <Ionicons name="checkmark-circle" size={20} color="#10b981" />}
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
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 14,
    color: '#1e293b',
  },
  content: {
    padding: Spacing.lg,
  },
  enrollmentCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 18,
  },
  details: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  studentName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  studentId: {
    fontSize: 12,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: Spacing.md,
  },
  classInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  className: {
    fontSize: 14,
    color: '#475569',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  viewBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  viewBtnText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
    marginTop: 16,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.md,
  },
  classPicker: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 10,
  },
  classPickerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  clearBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalList: {
    marginBottom: Spacing.lg,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  modalItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalItemSub: {
    fontSize: 12,
    marginTop: 2,
  },
  selectClassContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: Spacing.xl,
  },
  selectClassIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  selectClassTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  selectClassSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  selectBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
  },
  selectBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
