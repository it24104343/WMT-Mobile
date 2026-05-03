import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  LinearGradient,
  Modal,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import apiClient from '../../src/utils/api';
import { Colors, Spacing, BorderRadius, Shadow, GRadients } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function TeacherProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [allClasses, setAllClasses] = useState([]);

  const fetchTeacher = async () => {
    try {
      const response = await apiClient.get(`/teachers/${id}`);
      setTeacher(response.data.data);
    } catch (error) {
      console.error('Failed to fetch teacher profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchTeacher();
      fetchClasses();
    }, [id])
  );

  const fetchClasses = async () => {
    try {
      const response = await apiClient.get('/classes');
      setAllClasses(response.data.data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const assignToClass = async (classId) => {
    try {
      await apiClient.put(`/classes/${classId}/assign-teacher`, { teacherId: id });
      Alert.alert('Success', 'Teacher assigned successfully');
      setShowAssignModal(false);
      fetchTeacher();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to assign teacher');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this teacher?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/teachers/${id}`);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete teacher');
            }
          }
        }
      ]
    );
  };

  if (loading || !teacher) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ExpoLinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={() => router.push({ pathname: '/teachers/add', params: { id } })}
              >
                <Ionicons name="create-outline" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconButton, { marginLeft: 12 }]} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.profileInfo}>
            <View style={[styles.avatarLarge, { borderColor: '#10b981' }]}>
              {teacher.profileImage ? (
                <Image source={{ uri: teacher.profileImage }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.avatarTextLarge, { color: '#10b981' }]}>
                  {teacher.name?.substring(0, 2).toUpperCase()}
                </Text>
              )}
            </View>
            <Text style={styles.profileName}>{teacher.name}</Text>
            <Text style={styles.profileSubject}>{teacher.subject}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{teacher.qualification || 'Senior Teacher'}</Text>
            </View>
          </View>
        </ExpoLinearGradient>

        <View style={styles.content}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{teacher.assignedClasses?.length || 0}</Text>
              <Text style={styles.statLabel}>Assigned Classes</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>Active</Text>
              <Text style={styles.statLabel}>Status</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Assigned Classes</Text>
              <TouchableOpacity 
                style={styles.assignButton}
                onPress={() => setShowAssignModal(true)}
              >
                <Ionicons name="add" size={20} color="#10b981" />
                <Text style={styles.assignButtonText}>Assign</Text>
              </TouchableOpacity>
            </View>
            {teacher.assignedClasses?.length > 0 ? (
              teacher.assignedClasses.map((cls, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.classItem}
                  onPress={() => router.push(`/classes/${cls._id || cls.id}`)}
                >
                  <View style={[styles.classIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                    <Ionicons name="book" size={20} color="#10b981" />
                  </View>
                  <View style={styles.classInfo}>
                    <Text style={styles.className}>{cls.className || cls.name || 'Class Name'}</Text>
                    <Text style={styles.classDetail}>{cls.subject || 'Subject'} | {cls.dayOfWeek || cls.day || 'N/A'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#64748b" />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="alert-circle-outline" size={32} color={Colors.dark.textMuted} />
                <Text style={styles.emptyText}>No classes assigned yet</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact & Qualifications</Text>
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Ionicons name="call-outline" size={20} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.detailLabel}>Mobile Number</Text>
                <Text style={styles.detailText}>{teacher.phone || teacher.contactNo || 'Not provided'}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Ionicons name="mail-outline" size={20} color="#10b981" />
              </View>
              <View>
                <Text style={styles.detailLabel}>Email Address</Text>
                <Text style={styles.detailText}>{teacher.email || 'Not provided'}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <Ionicons name="location-outline" size={20} color="#f59e0b" />
              </View>
              <View>
                <Text style={styles.detailLabel}>Home Address</Text>
                <Text style={styles.detailText}>{teacher.address || 'Not provided'}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Assign Class Modal */}
      <Modal visible={showAssignModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign to Class</Text>
              <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                <Ionicons name="close" size={24} color="#1e293b" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {allClasses.map((cls) => (
                <TouchableOpacity 
                  key={cls._id} 
                  style={styles.modalItem}
                  onPress={() => assignToClass(cls._id)}
                >
                  <View>
                    <Text style={styles.modalItemTitle}>{cls.className}</Text>
                    <Text style={styles.modalItemSub}>{cls.subject} | {cls.dayOfWeek}</Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color="#10b981" />
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
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarTextLarge: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileSubject: {
    fontSize: 16,
    color: Colors.dark.textMuted,
    marginTop: 4,
  },
  badge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  badgeText: {
    color: '#10b981',
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
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  assignButtonText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 14,
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
  emptyCard: {
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.dark.border,
  },
  emptyText: {
    color: Colors.dark.textMuted,
    marginTop: Spacing.sm,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalList: {
    marginBottom: 20,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
