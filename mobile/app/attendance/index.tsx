import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../../src/utils/api';
import { AuthContext } from '../../src/context/AuthContext';
import { Colors, Spacing, BorderRadius, Shadow, GRadients } from '../../constants/theme';

export default function AttendanceScreen() {
  const router = useRouter();
  const { state } = useContext(AuthContext);
  const isTeacher = state.user?.role === 'TEACHER';
  
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any>({}); // studentId -> status (Present/Absent)
  const [classModalVisible, setClassModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [showTodayOnly, setShowTodayOnly] = useState(true);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDay = days[new Date().getDay()];

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const params: any = {};
      if (isTeacher) params.teacher = state.user.profileId;
      if (state.user?.role === 'STUDENT') params.student = state.user.profileId;
      
      const response = await apiClient.get('/classes', { params });
      setClasses(response.data.data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const fetchStudents = async (classId: string) => {
    setLoading(true);
    try {
      // 1. Try to find today's session for this class
      const today = new Date().toISOString().split('T')[0];
      const sessionRes = await apiClient.get('/attendance/sessions', {
        params: { classId, startDate: today, endDate: today }
      });

      let session = sessionRes.data.data[0];

      // 2. If no session exists, create one for today (ONLY if timing is valid)
      if (!session) {
        const timing = isTimingValid(selectedClass || classes.find(c => c._id === classId));
        if (!timing.valid) {
          setLoading(false);
          Alert.alert('Cannot Start Attendance', timing.reason);
          return;
        }

        const createRes = await apiClient.post('/attendance/sessions', {
          classId,
          date: new Date().toISOString(),
          topic: `Class on ${new Date().toLocaleDateString()}`
        });
        session = createRes.data.data;
      }

      setCurrentSession(session);

      // 3. Fetch attendance for this session
      const attendanceRes = await apiClient.get(`/attendance/sessions/${session._id}`);
      const attendanceData = attendanceRes.data.data.attendance;
      
      setStudents(attendanceData);
      
      // Initialize local state from session records
      const initial: any = {};
      attendanceData.forEach((a: any) => {
        initial[a.student?._id || a.student] = a.status === 'PRESENT' ? 'Present' : 'Absent';
      });
      setAttendance(initial);

    } catch (error: any) {
      console.error('Failed to fetch attendance session:', error);
      const message = error.response?.data?.message || 'Failed to load attendance session';
      Alert.alert('Attendance Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClass = (cls: any) => {
    setSelectedClass(cls);
    setClassModalVisible(false);
    fetchStudents(cls._id);
    fetchPastSessions(cls._id);
  };

  const fetchPastSessions = async (classId: string) => {
    try {
      const response = await apiClient.get('/attendance/sessions', {
        params: { classId, sort: '-date' }
      });
      setPastSessions(response.data.data);
    } catch (error) {
      console.error('Failed to fetch past sessions:', error);
    }
  };

  const scrollRef = React.useRef<ScrollView>(null);

  const handleSelectSession = (session: any) => {
    setHistoryModalVisible(false);
    setCurrentSession(session);
    loadSessionAttendance(session._id);
    // Scroll to top to see the loaded data
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const loadSessionAttendance = async (sessionId: string) => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/attendance/sessions/${sessionId}`);
      const attendanceData = response.data.data.attendance;
      
      setStudents(attendanceData);
      
      const initial: any = {};
      attendanceData.forEach((a: any) => {
        initial[a.student?._id || a.student] = a.status === 'PRESENT' ? 'Present' : 'Absent';
      });
      setAttendance(initial);
    } catch (error) {
      console.error('Failed to load session attendance:', error);
      Alert.alert('Error', 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = (studentId: string) => {
    // Check timing before allowing any changes
    const timing = isTimingValid(selectedClass);
    if (!timing.valid) {
      Alert.alert('Cannot Mark Attendance', timing.reason);
      return;
    }

    setAttendance((prev: any) => ({
      ...prev,
      [studentId]: prev[studentId] === 'Present' ? 'Absent' : 'Present'
    }));
  };

  const isTimingValid = (cls: any) => {
    if (!cls) return { valid: false, reason: 'No class selected' };
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = new Date();
    const todayDay = days[now.getDay()];
    
    // Check Day
    const classDay = cls.dayOfWeek || cls.day;
    if (classDay !== todayDay) {
      return { 
        valid: false, 
        reason: `Attendance can only be marked on the scheduled day (${classDay}). Today is ${todayDay}.` 
      };
    }

    // Check Time
    const currentHours = now.getHours();
    const currentMins = now.getMinutes();
    const currentTimeVal = currentHours * 60 + currentMins;

    const [startH, startM] = cls.startTime.split(':').map(Number);
    const [endH, endM] = cls.endTime.split(':').map(Number);
    
    const startVal = startH * 60 + startM;
    const endVal = endH * 60 + endM;

    // Allow 15 minutes grace period before and after
    const gracePeriod = 15;

    if (currentTimeVal < (startVal - gracePeriod)) {
      return { 
        valid: false, 
        reason: `Class hasn't started yet. You can start marking from ${startH}:${(startM-gracePeriod).toString().padStart(2,'0')}.` 
      };
    }
    
    if (currentTimeVal > (endVal + gracePeriod)) {
      return { 
        valid: false, 
        reason: `Class has already ended. Marking is only allowed during class hours.` 
      };
    }

    return { valid: true };
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass || !currentSession) return;
    
    // Final timing check before saving
    const timing = isTimingValid(selectedClass);
    if (!timing.valid) {
      Alert.alert('Cannot Save Attendance', timing.reason);
      return;
    }

    setLoading(true);
    try {
      const records = Object.keys(attendance).map(studentId => ({
        studentId: studentId,
        status: attendance[studentId].toUpperCase() // Backend expects PRESENT/ABSENT
      }));

      await apiClient.put(`/attendance/sessions/${currentSession._id}/mark`, {
        records
      });
      
      Alert.alert('Success', 'Attendance saved successfully');
    } catch (error) {
      console.error('Save attendance error:', error);
      Alert.alert('Error', 'Failed to save attendance');
    } finally {
      setLoading(false);
    }
  };

  const theme = {
    bg: '#f8fafc',
    headerBg: ['#0f172a', '#0f172a'],
    card: '#ffffff',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#e2e8f0',
    primary: '#22c55e',
    iconColor: '#fff',
    backBtnBg: 'rgba(255,255,255,0.1)'
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { backgroundColor: '#0f172a' }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.backBtnBg }]}>
            <Ionicons name="chevron-back" size={24} color={theme.iconColor} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.iconColor }]}>Attendance</Text>
          <TouchableOpacity 
            style={[styles.saveButton, !selectedClass && { opacity: 0.5 }, { backgroundColor: '#22c55e' }]} 
            onPress={handleSaveAttendance}
            disabled={!selectedClass || loading}
          >
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark-done" size={24} color="#fff" />}
          </TouchableOpacity>
        </View>

        <View style={styles.selectorRow}>
          <TouchableOpacity 
            style={[styles.classSelector, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', flex: 1 }]}
            onPress={() => setClassModalVisible(true)}
          >
            <Ionicons name="book-outline" size={20} color="rgba(255,255,255,0.6)" />
            <Text style={[styles.selectorText, { color: '#fff' }]}>
              {selectedClass ? selectedClass.name || selectedClass.className : 'Select Class'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#22c55e" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.historyBtn, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }, !selectedClass && { opacity: 0.5 }]}
            onPress={() => selectedClass && setHistoryModalVisible(true)}
            disabled={!selectedClass}
          >
            <Ionicons name="time-outline" size={24} color="#22c55e" />
          </TouchableOpacity>
        </View>

        {currentSession && (
          <View style={styles.sessionHeaderRow}>
            <View style={styles.sessionBadge}>
              <Ionicons name="calendar" size={14} color="#fff" />
              <Text style={styles.sessionBadgeText}>
                {new Date(currentSession.date).toLocaleDateString()} {currentSession.startTime || ''}
              </Text>
            </View>
            
            {new Date(currentSession.date).toDateString() !== new Date().toDateString() && (
              <TouchableOpacity 
                style={styles.historyModeBadge}
                onPress={() => fetchStudents(selectedClass._id)}
              >
                <Text style={styles.historyModeText}>VIEWING HISTORY</Text>
                <Ionicons name="close-circle" size={14} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <ScrollView 
        ref={scrollRef}
        style={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        {!selectedClass ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={80} color={Colors.dark.border} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Class Selected</Text>
            <Text style={[styles.emptySub, { color: theme.textMuted }]}>Select a class above to start marking attendance for today.</Text>
          </View>
        ) : (
          <>
            {students.map((item) => {
              const student = item.student || item;
              return (
                <TouchableOpacity 
                  key={student._id} 
                  style={[styles.studentCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={() => toggleStatus(student._id)}
                >
                  <View style={styles.studentInfo}>
                    <Text style={[styles.studentName, { color: theme.text }]}>{student.fullName || student.name}</Text>
                    <Text style={[styles.studentId, { color: theme.textMuted }]}>{student.studentId || 'ID: ' + student._id.substring(0,8)}</Text>
                  </View>
                  <View style={[
                    styles.statusPill, 
                    { backgroundColor: attendance[student._id] === 'Present' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' }
                  ]}>
                    <Text style={[
                      styles.statusText, 
                      { color: attendance[student._id] === 'Present' ? '#22c55e' : '#ef4444' }
                    ]}>
                      {attendance[student._id]}
                    </Text>
                  </View>
                  <View style={[
                    styles.checkbox, 
                    { 
                      backgroundColor: attendance[student._id] === 'Present' ? '#22c55e' : 'transparent', 
                      borderColor: attendance[student._id] === 'Present' ? '#22c55e' : theme.border 
                    }
                  ]}>
                    {attendance[student._id] === 'Present' && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            })}

            {pastSessions.length > 0 && (
              <View style={styles.recentSection}>
                <View style={styles.recentHeader}>
                  <Ionicons name="time-outline" size={18} color={theme.textMuted} />
                  <Text style={[styles.recentTitle, { color: theme.textMuted }]}>Recent Records</Text>
                </View>
                {pastSessions.slice(0, 5).map((session) => (
                  <TouchableOpacity 
                    key={session._id} 
                    style={[styles.recentCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                    onPress={() => handleSelectSession(session)}
                  >
                    <View style={styles.recentInfo}>
                      <Text style={[styles.recentDate, { color: theme.text }]}>{new Date(session.date).toLocaleDateString()}</Text>
                      <Text style={[styles.recentTopic, { color: theme.textMuted }]} numberOfLines={1}>
                        {session.topic || 'Regular Session'}
                      </Text>
                    </View>
                    <View style={styles.recentMeta}>
                      <Text style={[styles.recentTime, { color: theme.primary }]}>{session.startTime}</Text>
                      <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Class Selector Modal */}
      <Modal
        visible={classModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setClassModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.bg }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Select Class</Text>
                <Text style={[styles.modalSubTitle, { color: theme.textMuted }]}>
                  {showTodayOnly ? `Showing classes for ${todayDay}` : 'Showing all scheduled classes'}
                </Text>
              </View>
              <View style={styles.modalHeaderActions}>
                <TouchableOpacity 
                  style={[styles.filterToggle, showTodayOnly && styles.filterToggleActive]} 
                  onPress={() => setShowTodayOnly(!showTodayOnly)}
                >
                  <Ionicons name={showTodayOnly ? "calendar" : "list"} size={18} color={showTodayOnly ? "#fff" : theme.primary} />
                  <Text style={[styles.filterToggleText, { color: showTodayOnly ? "#fff" : theme.primary }]}>
                    {showTodayOnly ? "Today" : "All"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setClassModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {classes
                .filter(cls => !showTodayOnly || (cls.dayOfWeek || cls.day) === todayDay)
                .map((cls) => (
                <TouchableOpacity 
                  key={cls._id} 
                  style={[styles.modalItem, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={() => handleSelectClass(cls)}
                >
                  <View style={styles.modalItemLeft}>
                    <View style={[styles.dayIcon, { backgroundColor: (cls.dayOfWeek || cls.day) === todayDay ? Colors.dark.success : 'rgba(255,255,255,0.1)' }]}>
                      <Text style={styles.dayIconText}>{(cls.dayOfWeek || cls.day || '').substring(0, 3)}</Text>
                    </View>
                    <View>
                      <Text style={[styles.modalItemTitle, { color: theme.text }]}>{cls.name || cls.className}</Text>
                      <Text style={[styles.modalItemSub, { color: theme.textMuted }]}>
                        {cls.subject} • {cls.grade}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.modalItemRight}>
                    <Text style={[styles.modalItemTime, { color: theme.primary }]}>{cls.startTime}</Text>
                    <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                  </View>
                </TouchableOpacity>
              ))}

              {classes.filter(cls => !showTodayOnly || (cls.dayOfWeek || cls.day) === todayDay).length === 0 && (
                <View style={styles.modalEmpty}>
                  <Ionicons name="cafe-outline" size={48} color={theme.border} />
                  <Text style={[styles.modalEmptyText, { color: theme.textMuted }]}>
                    No classes scheduled for {showTodayOnly ? 'today' : 'the system'}.
                  </Text>
                  {showTodayOnly && (
                    <TouchableOpacity onPress={() => setShowTodayOnly(false)} style={styles.showAllBtn}>
                      <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Show All Classes</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={historyModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.bg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Attendance History</Text>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              <TouchableOpacity 
                style={[styles.modalItem, { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: Colors.dark.success }]}
                onPress={() => {
                  setHistoryModalVisible(false);
                  fetchStudents(selectedClass._id);
                }}
              >
                <View>
                  <Text style={[styles.modalItemTitle, { color: Colors.dark.success }]}>New Session (Today)</Text>
                  <Text style={[styles.modalItemSub, { color: theme.textMuted }]}>Create or mark attendance for today</Text>
                </View>
                <Ionicons name="add-circle" size={24} color={Colors.dark.success} />
              </TouchableOpacity>

              {pastSessions.map((session) => (
                <TouchableOpacity 
                  key={session._id} 
                  style={[styles.modalItem, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={() => handleSelectSession(session)}
                >
                  <View>
                    <Text style={[styles.modalItemTitle, { color: theme.text }]}>{new Date(session.date).toLocaleDateString()}</Text>
                    <Text style={[styles.modalItemSub, { color: theme.textMuted }]}>
                      {session.startTime} - {session.endTime || 'N/A'} | {session.topic || 'No topic'}
                    </Text>
                  </View>
                  <Ionicons name="eye-outline" size={24} color={theme.primary} />
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
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 30,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerLight: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: Spacing.lg,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.sm,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  classSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  selectorText: {
    flex: 1,
    marginLeft: Spacing.md,
    fontWeight: '600',
    fontSize: 14,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  historyBtn: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  sessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 10,
    gap: 6,
  },
  sessionBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  historyModeBadge: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  historyModeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    padding: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: Spacing.lg,
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
  },
  studentId: {
    fontSize: 12,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: Spacing.md,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
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
  modalTitle: {
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
  modalSubTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
    gap: 6,
  },
  filterToggleActive: {
    backgroundColor: Colors.dark.primary,
  },
  filterToggleText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  modalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dayIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayIconText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  modalItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalItemTime: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  modalEmptyText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  showAllBtn: {
    marginTop: 15,
    padding: 10,
  },
  recentSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 8,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
  },
  recentInfo: {
    flex: 1,
  },
  recentDate: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  recentTopic: {
    fontSize: 12,
    marginTop: 2,
  },
  recentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recentTime: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
