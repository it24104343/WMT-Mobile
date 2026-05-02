import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../../src/utils/api';
import { Colors, Spacing, BorderRadius, Shadow, GRadients } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function StudentProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [student, setStudent] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModalVisible, setAssignModalVisible] = useState(false);

  const fetchData = async () => {
    try {
      const [studentRes, classesRes] = await Promise.all([
        apiClient.get(`/students/${id}`),
        apiClient.get('/classes')
      ]);
      setStudent(studentRes.data.data);
      setClasses(classesRes.data.data);
    } catch (error) {
      console.error('Failed to fetch student profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDelete = () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this student?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/students/${id}`);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete student');
            }
          }
        }
      ]
    );
  };

  const assignToClass = async (classId) => {
    try {
      await apiClient.post(`/enrollments`, {
        studentId: id,
        classId: classId
      });
      setAssignModalVisible(false);
      fetchData(); // Refresh data
      Alert.alert('Success', 'Student assigned to class successfully');
    } catch (error) {
      console.error('Enrollment error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to assign class');
    }
  };

  if (loading || !student) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={() => router.push({ pathname: '/students/add-edit', params: { id } })}
              >
                <Ionicons name="create-outline" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconButton, { marginLeft: 12 }]} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarTextLarge}>
                {student.name?.substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.profileName}>{student.name}</Text>
            <Text style={styles.profileId}>{student.studentId}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>Grade {student.grade}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{student.attendancePercentage || '0'}%</Text>
              <Text style={styles.statLabel}>Attendance</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{student.enrolledClasses?.length || 0}</Text>
              <Text style={styles.statLabel}>Classes</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>Paid</Text>
              <Text style={styles.statLabel}>Last Payment</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Enrolled Classes</Text>
              <TouchableOpacity 
                style={styles.assignButton}
                onPress={() => setAssignModalVisible(true)}
              >
                <Ionicons name="add" size={16} color={Colors.dark.primary} />
                <Text style={styles.assignButtonText}>Assign</Text>
              </TouchableOpacity>
            </View>
            
            {student.enrolledClasses?.length > 0 ? (
              student.enrolledClasses.map((cls, index) => (
                <View key={index} style={styles.classItem}>
                  <View style={styles.classIcon}>
                    <Ionicons name="book" size={20} color={Colors.dark.primary} />
                  </View>
                  <View style={styles.classInfo}>
                    <Text style={styles.className}>{cls.className || cls.class?.className || 'Class Name'}</Text>
                    <Text style={styles.classDetail}>{cls.teacher?.name || cls.class?.teacher?.name || 'TBA'} | {cls.dayOfWeek || cls.class?.dayOfWeek || 'N/A'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.dark.textMuted} />
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Not enrolled in any classes</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Ionicons name="call-outline" size={20} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.detailLabel}>Mobile Number</Text>
                <Text style={styles.detailText}>{student.contactNo || student.phone || 'Not provided'}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Ionicons name="mail-outline" size={20} color="#10b981" />
              </View>
              <View>
                <Text style={styles.detailLabel}>Email Address</Text>
                <Text style={styles.detailText}>{student.email || 'Not provided'}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <Ionicons name="location-outline" size={20} color="#f59e0b" />
              </View>
              <View>
                <Text style={styles.detailLabel}>Home Address</Text>
                <Text style={styles.detailText}>{student.address || 'Not provided'}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Assign Class Modal */}
      <Modal
        visible={assignModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign to Class</Text>
              <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {classes.map((cls) => (
                <TouchableOpacity 
                  key={cls._id} 
                  style={styles.modalItem}
                  onPress={() => assignToClass(cls._id)}
                >
                  <View>
                    <Text style={styles.modalItemTitle}>{cls.className}</Text>
                    <Text style={styles.modalItemSub}>{cls.subject} | {cls.dayOfWeek}</Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color={Colors.dark.primary} />
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
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    alignItems: 'center',
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.dark.primary,
    marginBottom: Spacing.md,
  },
  avatarTextLarge: {
    color: Colors.dark.primary,
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileId: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: Spacing.md,
    marginTop: -Spacing.xl,
    ...Shadow.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#f1f5f9',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  assignButtonText: {
    color: Colors.dark.primary,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: Spacing.md,
    borderRadius: 16,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  classIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  classDetail: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    marginTop: 2,
  },
  emptyText: {
    color: Colors.dark.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.dark.background,
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  modalList: {
    marginBottom: Spacing.lg,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalItemSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});
