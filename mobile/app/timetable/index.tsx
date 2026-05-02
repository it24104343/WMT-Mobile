import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../../src/utils/api';
import { AuthContext } from '../../src/context/AuthContext';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';

export default function TimetableScreen() {
  const router = useRouter();
  const { state } = useContext(AuthContext);
  const isTeacher = state.user?.role === 'TEACHER';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timetable, setTimetable] = useState([]);

  const fetchTimetable = async () => {
    try {
      const params: any = {};
      if (isTeacher) params.teacher = state.user.profileId;
      if (state.user?.role === 'STUDENT') params.student = state.user.profileId;
      
      const response = await apiClient.get('/classes/timetable', { params });
      
      // Timetable response is grouped by day in the backend
      const rawData = response.data.data;
      const flatData = [];
      Object.keys(rawData).forEach(day => {
        rawData[day].forEach(session => {
          flatData.push({ ...session, dayOfWeek: day });
        });
      });
      setTimetable(flatData);
    } catch (error) {
      console.error('Failed to fetch timetable:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTimetable();
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>My Timetable</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
        ) : days.map((day) => {
          const sessions = timetable.filter(s => s.dayOfWeek === day);
          if (sessions.length === 0) return null;

          return (
            <View key={day} style={styles.daySection}>
              <Text style={styles.dayTitle}>{day}</Text>
              {sessions.map((session, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.sessionCard}
                  onPress={() => router.push(`/classes/${session._id}`)}
                >
                  <View style={styles.timeSection}>
                    <Text style={styles.startTime}>{session.startTime}</Text>
                    <Text style={[styles.endTime, { color: Colors.dark.textMuted }]}>{session.endTime}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.detailsSection}>
                    <Text style={styles.className}>{session.name || session.className}</Text>
                    <View style={styles.subjectRow}>
                      <Text style={[styles.subject, { color: Colors.dark.textMuted }]}>{session.subject} - {session.grade}</Text>
                      <View style={styles.sessionCountBadge}>
                        <Ionicons name="layers-outline" size={10} color={Colors.dark.primary} />
                        <Text style={styles.sessionCountText}>{session.sessionCount || 0} Sessions</Text>
                      </View>
                    </View>
                    <View style={styles.locationBox}>
                      <Ionicons name="location" size={14} color="#3b82f6" />
                      <Text style={styles.locationText}>{session.hall?.name || session.hall || 'Main Hall'}</Text>
                    </View>
                  </View>
                  <View style={[styles.typeBadge, { backgroundColor: session.mode === 'ONLINE' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)' }]}>
                    <Text style={[styles.typeText, { color: session.mode === 'ONLINE' ? '#3b82f6' : '#22c55e' }]}>
                      {session.mode}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
        
        {timetable.length === 0 && !loading && (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>No classes scheduled in your timetable</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 30,
    backgroundColor: '#0f172a',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: Spacing.lg,
  },
  daySection: {
    marginBottom: Spacing.xl,
  },
  dayTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  sessionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadow.sm,
  },
  timeSection: {
    width: 60,
    alignItems: 'center',
  },
  startTime: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  endTime: {
    fontSize: 11,
    color: '#64748b',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0',
    marginHorizontal: Spacing.md,
  },
  detailsSection: {
    flex: 1,
  },
  className: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  subject: {
    fontSize: 12,
    color: '#64748b',
  },
  sessionCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  sessionCountText: {
    fontSize: 10,
    color: '#22c55e',
    fontWeight: 'bold',
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 11,
    color: '#3b82f6',
    marginLeft: 4,
    fontWeight: '500',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  typeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: Spacing.xl,
  },
});
