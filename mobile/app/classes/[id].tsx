import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, TextInput } from 'react-native';
import apiClient from '../../src/utils/api';
import { AuthContext } from '../../src/context/AuthContext';

const { width } = Dimensions.get('window');

export default function ClassDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { state } = useContext(AuthContext);
  const isAdminOrTeacher = state.user?.role === 'ADMIN' || state.user?.role === 'TEACHER';
  const isAdmin = state.user?.role === 'ADMIN';

  const [classData, setClassData] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionModalVisible, setSessionModalVisible] = useState(false);
  const [newSession, setNewSession] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    topic: '',
    chapterName: '',
    documentUrl: '',
    documentName: '',
    notes: '',
  });

  const fetchData = async () => {
    try {
      const [classRes, sessionsRes] = await Promise.all([
        apiClient.get(`/classes/${id}`),
        apiClient.get(`/attendance/sessions`, { params: { classId: id } })
      ]);
      setClassData(classRes.data.data);
      setSessions(sessionsRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch class details:', error);
      Alert.alert('Error', 'Failed to load class details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDelete = () => {
    if (!isAdmin) {
      Alert.alert('Access Denied', 'Only administrators can delete classes');
      return;
    }
    Alert.alert(
      'Delete Class',
      'Are you sure you want to delete this class? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/classes/${id}`);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete class');
            }
          }
        }
      ]
    );
  };

  const handleCreateSession = async () => {
    if (!newSession.date) {
      Alert.alert('Error', 'Please select a date');
      return;
    }
    
    try {
      setLoading(true);
      await apiClient.post('/attendance/sessions', {
        classId: id,
        ...newSession,
        startTime: newSession.startTime || classData.startTime,
        endTime: newSession.endTime || classData.endTime,
      });
      setSessionModalVisible(false);
      fetchData();
      Alert.alert('Success', 'Session created successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    if (!isAdminOrTeacher) {
      Alert.alert('Access Denied', 'You do not have permission to delete sessions');
      return;
    }
    Alert.alert(
      'Delete Session',
      'Are you sure you want to permanently delete this session? This will also remove all attendance records for it.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/attendance/sessions/${sessionId}`);
              fetchData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete session');
            }
          }
        }
      ]
    );
  };

  if (loading || !classData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  const enrolledCount = classData.students?.length || 0;
  const capacity = classData.capacity || 50;
  const enrollmentPercentage = Math.min(100, (enrolledCount / capacity) * 100);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Banner Section */}
        <LinearGradient
          colors={['#1e293b', '#0f172a']}
          style={styles.banner}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButtonBanner}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.bannerInfo}>
            <Text style={styles.bannerTitle}>{classData.className}</Text>
            <View style={styles.bannerBadgeRow}>
              <View style={styles.bannerBadge}>
                <Text style={styles.bannerBadgeText}>{classData.grade}</Text>
              </View>
              <View style={[styles.bannerBadge, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                <Text style={[styles.bannerBadgeText, { color: '#4ade80' }]}>{classData.subject}</Text>
              </View>
            </View>
          </View>

          <View style={styles.bannerActions}>
            {isAdmin && (
              <TouchableOpacity 
                style={styles.bannerActionBtn}
                onPress={() => router.push(`/classes/add?id=${id}`)}
              >
                <Ionicons name="pencil" size={18} color="#fff" />
              </TouchableOpacity>
            )}
            {isAdmin && (
              <TouchableOpacity 
                style={[styles.bannerActionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]} 
                onPress={handleDelete}
              >
                <Ionicons name="trash" size={18} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>

        <View style={styles.mainContent}>
          {/* Stats Summary */}
          <View style={styles.statsGrid}>
            {isAdminOrTeacher && (
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Ionicons name="people" size={16} color="#22c55e" />
                  <Text style={styles.statLabel}>Enrolled</Text>
                </View>
                <Text style={styles.statMainValue}>{enrolledCount}</Text>
                <View style={styles.statFooter}>
                  <View style={styles.miniProgress}>
                    <View style={[styles.miniProgressFill, { width: `${enrollmentPercentage}%` }]} />
                  </View>
                  <Text style={styles.statSubValue}>{capacity} Max</Text>
                </View>
              </View>
            )}

            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Ionicons name="layers" size={16} color="#3b82f6" />
                <Text style={styles.statLabel}>Progress</Text>
              </View>
              <Text style={styles.statMainValue}>
                {classData.sessionStats?.completed || 0}
                <Text style={styles.statMainValueUnit}>/{classData.sessionStats?.total || 0}</Text>
              </Text>
              <View style={styles.statFooter}>
                <Text style={[styles.statSubValue, { color: '#3b82f6' }]}>
                  {classData.sessionStats?.upcoming || 0} left
                </Text>
              </View>
            </View>
          </View>

          {/* Detailed Info Card */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="time-outline" size={20} color="#1e293b" />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Schedule</Text>
                  <Text style={styles.infoValue}>{classData.dayOfWeek}</Text>
                  <Text style={styles.infoSubValue}>{classData.startTime} - {classData.endTime}</Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="location-outline" size={20} color="#1e293b" />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoValue}>{classData.hall?.name || classData.classroom || 'N/A'}</Text>
                  <Text style={styles.infoSubValue}>Physical Class</Text>
                </View>
              </View>
            </View>

            <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="wallet-outline" size={20} color="#1e293b" />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Monthly Fee</Text>
                  <Text style={styles.infoValue}>Rs. {classData.monthlyFee?.toLocaleString()}</Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.infoIconBox}>
                  <Ionicons name="person-outline" size={20} color="#1e293b" />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Teacher</Text>
                  <Text style={styles.infoValue}>{classData.teacher?.name || 'Assigned'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Sessions Section */}
          <View style={styles.sessionSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Sessions</Text>
              {isAdminOrTeacher && (
                <TouchableOpacity 
                  style={styles.addBtn}
                  onPress={() => {
                    setNewSession({
                      date: new Date().toISOString().split('T')[0],
                      startTime: classData.startTime,
                      endTime: classData.endTime,
                      topic: '',
                      notes: '',
                    });
                    setSessionModalVisible(true);
                  }}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.addBtnText}>Schedule</Text>
                </TouchableOpacity>
              )}
            </View>

            {sessions.length > 0 ? (
              sessions.map((session: any) => (
                <TouchableOpacity 
                  key={session._id} 
                  style={styles.sessionItem}
                  activeOpacity={0.7}
                >
                  <View style={styles.sessionDateBox}>
                    <Text style={styles.sessionDateMonth}>
                      {new Date(session.date).toLocaleString('default', { month: 'short' })}
                    </Text>
                    <Text style={styles.sessionDateDay}>
                      {new Date(session.date).getDate()}
                    </Text>
                  </View>
                  <View style={styles.sessionInfo}>
                    <View style={styles.topicRow}>
                      <Text style={styles.sessionTopic} numberOfLines={1}>
                        {session.topic || 'Regular Session'}
                      </Text>
                      <View style={styles.statusBadge}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>Upcoming</Text>
                      </View>
                    </View>
                    {session.chapterName && (
                      <View style={styles.chapterRow}>
                        <Ionicons name="layers-outline" size={14} color="#3b82f6" />
                        <Text style={styles.chapterText}>{session.chapterName}</Text>
                      </View>
                    )}
                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={14} color="#64748b" />
                      <Text style={styles.sessionTime}>
                        {session.startTime} - {session.endTime}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.sessionActions}>
                    {session.documentUrl && (
                      <TouchableOpacity 
                        onPress={() => Alert.alert('Download', `Downloading ${session.documentName || 'document'}...`)}
                        style={styles.downloadBtn}
                      >
                        <Ionicons name="document-text-outline" size={20} color="#3b82f6" />
                      </TouchableOpacity>
                    )}
                    {isAdminOrTeacher && (
                      <TouchableOpacity 
                        onPress={() => handleCancelSession(session._id)}
                        style={styles.deleteBtn}
                      >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No sessions scheduled</Text>
              </View>
            )}
          </View>

          {/* Student List Section */}
          <View style={styles.studentSection}>
            <View style={styles.sectionHeader}>
              {isAdmin && (
                <TouchableOpacity 
                  style={styles.addBtn}
                  onPress={() => router.push(`/enrollments?classId=${id}`)}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.addBtnText}>Add Student</Text>
                </TouchableOpacity>
              )}
            </View>

            {isAdminOrTeacher && (
              classData.students && classData.students.length > 0 ? (
                classData.students.map((student: any, index: number) => (
                  <View key={student._id || index} style={styles.studentItem}>
                    <View style={styles.studentAvatar}>
                      <Text style={styles.avatarText}>{(student.name || 'S').charAt(0)}</Text>
                    </View>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{student.name}</Text>
                      <Text style={styles.studentEmail} numberOfLines={1}>{student.email}</Text>
                    </View>
                    {isAdmin && (
                      <TouchableOpacity 
                        style={styles.removeBtn}
                        onPress={() => {
                          Alert.alert('Remove Student', `Remove ${student.name}?`, [
                            { text: 'Cancel', style: 'cancel' },
                            { 
                              text: 'Remove', 
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  await apiClient.delete(`/classes/${id}/students/${student._id}`);
                                  fetchData();
                                } catch (error) {
                                  Alert.alert('Error', 'Failed to remove student');
                                }
                              }
                            }
                          ]);
                        }}
                      >
                        <Ionicons name="close-circle-outline" size={20} color="#64748b" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.emptyStudents}>
                  <Text style={styles.emptyText}>No students enrolled</Text>
                </View>
              )
            )}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Create Session Modal */}
      <Modal
        visible={sessionModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSessionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#0f172a', '#1e293b']}
              style={styles.modalHeader}
            >
              <View>
                <Text style={styles.modalTitle}>Schedule Session</Text>
                <Text style={styles.modalSubtitle}>Plan your next lesson</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setSessionModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputSection}>
                <Text style={styles.fieldLabel}>Basic Information</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="calendar-outline" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={newSession.date}
                      onChangeText={(text) => setNewSession({...newSession, date: text})}
                      placeholder="2024-04-28"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>
                
                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Text style={styles.inputLabel}>Start Time</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="time-outline" size={20} color="#64748b" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={newSession.startTime}
                        onChangeText={(text) => setNewSession({...newSession, startTime: text})}
                        placeholder="08:00"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                  </View>
                  <View style={{width: 12}} />
                  <View style={styles.flex1}>
                    <Text style={styles.inputLabel}>End Time</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="time-outline" size={20} color="#64748b" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={newSession.endTime}
                        onChangeText={(text) => setNewSession({...newSession, endTime: text})}
                        placeholder="10:00"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.fieldLabel}>Lesson Details</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Topic</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="book-outline" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={newSession.topic}
                      onChangeText={(text) => setNewSession({...newSession, topic: text})}
                      placeholder="e.g. Calculus Basics"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Chapter Name</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="layers-outline" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={newSession.chapterName}
                      onChangeText={(text) => setNewSession({...newSession, chapterName: text})}
                      placeholder="e.g. Chapter 1: Introduction"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.fieldLabel}>Resources & Notes</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Document Link (Optional)</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="link-outline" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={newSession.documentUrl}
                      onChangeText={(text) => setNewSession({...newSession, documentUrl: text})}
                      placeholder="https://google-drive.com/..."
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Document Name</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="document-text-outline" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={newSession.documentName}
                      onChangeText={(text) => setNewSession({...newSession, documentName: text})}
                      placeholder="e.g. Lecture_Notes.pdf"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Notes</Text>
                  <View style={[styles.inputContainer, { height: 100, alignItems: 'flex-start', paddingTop: 12 }]}>
                    <Ionicons name="chatbubble-outline" size={20} color="#64748b" style={[styles.inputIcon, { marginTop: 2 }]} />
                    <TextInput
                      style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                      value={newSession.notes}
                      onChangeText={(text) => setNewSession({...newSession, notes: text})}
                      placeholder="Anything else for students to know?"
                      placeholderTextColor="#94a3b8"
                      multiline
                    />
                  </View>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.submitBtnContainer}
                onPress={handleCreateSession}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitBtn}
                >
                  <Text style={styles.submitBtnText}>Confirm & Schedule</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" style={{marginLeft: 8}} />
                </LinearGradient>
              </TouchableOpacity>
              
              <View style={{height: 40}} />
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
  content: {
    flex: 1,
  },
  banner: {
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    backgroundColor: '#0f172a',
  },
  backButtonBanner: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  bannerInfo: {
    marginBottom: 24,
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  bannerBadgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bannerBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bannerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bannerActions: {
    flexDirection: 'row',
    gap: 12,
    position: 'absolute',
    top: 60,
    right: 24,
  },
  bannerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    paddingHorizontal: 20,
    marginTop: -20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  statMainValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  statMainValueUnit: {
    fontSize: 14,
    color: '#64748b',
  },
  statFooter: {
    gap: 6,
  },
  miniProgress: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
  },
  statSubValue: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
    marginBottom: 10,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  infoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  infoSubValue: {
    fontSize: 11,
    color: '#64748b',
  },
  studentSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 2,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  sessionSection: {
    marginBottom: 24,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  sessionDateBox: {
    width: 60,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sessionDateDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    lineHeight: 22,
  },
  sessionDateMonth: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  sessionInfo: {
    flex: 1,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sessionTopic: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#10b981',
    textTransform: 'uppercase',
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  chapterText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionTime: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  sessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  downloadBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    height: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 32,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 24,
  },
  inputSection: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    opacity: 0.5,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
  submitBtnContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  submitBtn: {
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 2,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: 'bold',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  studentEmail: {
    fontSize: 11,
    color: '#64748b',
  },
  removeBtn: {
    padding: 4,
  },
  emptyStudents: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#475569',
    fontSize: 14,
  },
  sessionSection: {
    marginBottom: 24,
  },
});
