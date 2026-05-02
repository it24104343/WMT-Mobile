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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../../../src/utils/api';
import { Colors, Spacing, BorderRadius, Shadow, GRadients } from '../../../constants/theme';

export default function ExamMarksScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [exam, setExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({}); // studentId -> mark
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, ATTENDED, ABSENT
  const { state } = React.useContext(require('../../../src/context/AuthContext').AuthContext);
  const isAdmin = state.user?.role === 'ADMIN';
  const isTeacher = state.user?.role === 'TEACHER';

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const examRes = await apiClient.get(`/exams/${id}`);
      const { exam: examData } = examRes.data.data;
      setExam(examData);

      // Fetch students for the class this exam belongs to
      const studentsRes = await apiClient.get(`/enrollments/class/${examData.class?._id}`);
      const studentData = studentsRes.data.data;
      setStudents(studentData);

      // Initialize marks from existing results if any
      const initialMarks = {};
      examData.results?.forEach(res => {
        initialMarks[res.student] = res.marks?.toString();
      });
      setMarks(initialMarks);

    } catch (error) {
      console.error('Failed to fetch exam data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const calculateGrade = (mark) => {
    const m = parseInt(mark);
    if (isNaN(m)) return '-';
    if (m >= 75) return 'A';
    if (m >= 65) return 'B';
    if (m >= 55) return 'C';
    if (m >= 35) return 'S';
    return 'W';
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return '#22c55e';
      case 'B': return '#3b82f6';
      case 'C': return '#f59e0b';
      case 'W': return '#ef4444';
      default: return Colors.dark.textMuted;
    }
  };

  const handleSaveMarks = async () => {
    setSaving(true);
    try {
      const results = Object.keys(marks).map(studentId => ({
        student: studentId,
        marks: parseInt(marks[studentId]),
        grade: calculateGrade(marks[studentId])
      }));

      await apiClient.post(`/exams/${id}/results`, { results });
      Alert.alert('Success', 'Marks saved successfully');
    } catch (error) {
      console.error('Save marks error:', error);
      Alert.alert('Error', 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter((s: any) => {
    const studentName = s.student?.name || s.student?.fullName || '';
    const studentId = s.student?.studentId || '';
    const matchesSearch = studentName.toLowerCase().includes(search.toLowerCase()) || 
                          studentId.toLowerCase().includes(search.toLowerCase());
    const isAttended = !!marks[s._id];
    
    if (activeFilter === 'ATTENDED') return matchesSearch && isAttended;
    if (activeFilter === 'ABSENT') return matchesSearch && !isAttended;
    return matchesSearch;
  });

  const stats = {
    total: students.length,
    attended: Object.keys(marks).length,
    passed: Object.values(marks).filter((m: any) => parseInt(m) >= (exam.passingMarks || 35)).length
  };

  if (loading || !exam) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>{exam.title}</Text>
            <Text style={styles.subtitle}>{exam.class?.className || 'Class Exam'}</Text>
          </View>
          {isTeacher ? (
            <TouchableOpacity 
              style={[styles.saveButton, saving && { opacity: 0.7 }]}
              onPress={handleSaveMarks}
              disabled={saving}
            >
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="cloud-upload" size={24} color="#fff" />}
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="rgba(255,255,255,0.5)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search student..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.filterTabs}>
          {['ALL', 'ATTENDED', 'ABSENT'].map(filter => (
            <TouchableOpacity 
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[styles.filterTab, activeFilter === filter && styles.filterTabActive]}
            >
              <Text style={[styles.filterTabText, activeFilter === filter && styles.filterTabTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.statsStrip}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>ENROLLED</Text>
          <Text style={styles.statValue}>{stats.total}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>ATTENDED</Text>
          <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.attended}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>PASSED</Text>
          <Text style={[styles.statValue, { color: '#3b82f6' }]}>{stats.passed}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredStudents.map((s, index) => {
          const studentId = s.student?._id;
          const grade = calculateGrade(marks[studentId]);
          const isAbsent = !marks[studentId];
          
          return (
            <View key={index} style={[styles.studentCard, isAbsent && styles.absentCard]}>
              <View style={styles.studentInfo}>
                <View style={[styles.avatar, { backgroundColor: isAbsent ? '#f1f5f9' : 'rgba(16, 185, 129, 0.1)' }]}>
                  <Text style={[styles.avatarText, { color: isAbsent ? '#94a3b8' : '#10b981' }]}>
                    {(s.student?.name || s.student?.fullName || 'S').substring(0, 1)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{s.student?.name || s.student?.fullName}</Text>
                  <Text style={styles.studentId}>{s.student?.studentId}</Text>
                </View>
                {isAbsent ? (
                  <View style={styles.absentBadge}>
                    <Text style={styles.absentText}>ABSENT</Text>
                  </View>
                ) : (
                  <View style={styles.scoreSection}>
                    <TextInput
                      style={styles.markInput}
                      value={marks[student._id]}
                      onChangeText={(val) => setMarks({ ...marks, [student._id]: val })}
                      keyboardType="numeric"
                      placeholder="0"
                      editable={isTeacher}
                    />
                    <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(grade) + '15' }]}>
                      <Text style={[styles.gradeText, { color: getGradeColor(grade) }]}>{grade}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          );
        })}
        {filteredStudents.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color="#e2e8f0" />
            <Text style={styles.emptyText}>No students found</Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 64,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.md,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    marginLeft: 10,
    fontSize: 14,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  filterTabActive: {
    backgroundColor: '#10b981',
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.6)',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 20,
    marginTop: -15,
    padding: 16,
    borderRadius: 16,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#f1f5f9',
  },
  content: {
    paddingHorizontal: 20,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  absentCard: {
    backgroundColor: '#f8fafc',
    opacity: 0.8,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  studentName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  studentId: {
    fontSize: 11,
    color: '#64748b',
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markInput: {
    width: 50,
    height: 36,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    color: '#1e293b',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: 'bold',
  },
  gradeBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  absentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fee2e2',
    borderRadius: 6,
  },
  absentText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 12,
    fontWeight: '500',
  },
});
