import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../../src/utils/api';
import { AuthContext } from '../../src/context/AuthContext';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';

export default function ExamListScreen() {
  const router = useRouter();
  const { state } = useContext(AuthContext);
  const isTeacher = state.user?.role === 'TEACHER';

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any>([]);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, LIVE, HISTORY

  const fetchExams = async () => {
    try {
      const params = isTeacher ? { teacher: state.user.profileId } : {};
      const response = await apiClient.get('/exams', { params });
      setExams(response.data.data);

    } catch (error: any) {
      const msg = error.response?.data?.message || error.message;
      console.error('Failed to fetch exams:', msg, error.response?.data?.error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchExams();
    }, [state.user?.profileId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchExams();
  };

  const getExamStatus = (item: any) => {
    const now = new Date();
    const scheduledDate = item.scheduledDate ? new Date(item.scheduledDate) : null;
    const endDate = item.endDate ? new Date(item.endDate) : null;
    
    let startTime = scheduledDate ? new Date(scheduledDate) : null;
    if (startTime && item.startTime) {
      const [h, m] = item.startTime.split(':');
      startTime.setHours(parseInt(h), parseInt(m), 0);
    }
    
    let endDateTime = endDate ? new Date(endDate) : null;
    if (endDateTime && item.endTime) {
      const [h, m] = item.endTime.split(':');
      endDateTime.setHours(parseInt(h), parseInt(m), 59);
    } else if (startTime) {
      // Fallback to duration if no endDate
      endDateTime = new Date(startTime.getTime() + (item.duration || 60) * 60000);
    }
    
    const isPast = endDateTime && now > endDateTime;
    const isFuture = startTime && now < startTime;
    const isLive = startTime && !isPast && !isFuture;
    return { isPast, isFuture, isLive };
  };

  const filteredExams = exams.filter(e => {
    const matchesSearch = e.title?.toLowerCase().includes(search.toLowerCase()) ||
                         e.class?.className?.toLowerCase().includes(search.toLowerCase()) ||
                         e.class?.name?.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;

    const { isPast, isLive } = getExamStatus(e);
    const isSubmitted = e.myAttempt?.status === 'SUBMITTED' || e.myAttempt?.status === 'GRADED' || e.myAttempt?.status === 'REVIEWED';

    if (activeTab === 'LIVE') return isLive && !isSubmitted;
    if (activeTab === 'UPCOMING') return isFuture && !isSubmitted;
    if (activeTab === 'HISTORY') return isPast || isSubmitted;
    
    return true;
  });

  const theme = {
    bg: '#f8fafc',
    headerBg: '#0f172a',
    card: '#ffffff',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#e2e8f0',
    primary: '#3b82f6',
    iconColor: '#fff',
    backBtnBg: 'rgba(255,255,255,0.1)',
    searchInputBg: 'rgba(255,255,255,0.05)'
  };

  const ExamCard = ({ item }) => {
    const myAttempt = item.myAttempt;
    const isSubmitted = myAttempt?.status === 'SUBMITTED' || myAttempt?.status === 'GRADED' || myAttempt?.status === 'REVIEWED';

    
    // Calculate if exam is active
    const now = new Date();
    const scheduledDate = item.scheduledDate ? new Date(item.scheduledDate) : null;
    let startTime = scheduledDate;
    if (startTime && item.startTime) {
      const [h, m] = item.startTime.split(':');
      startTime.setHours(parseInt(h), parseInt(m), 0);
    }
    
    const isPast = startTime && now > new Date(startTime.getTime() + (item.duration || 60) * 60000);
    const isFuture = startTime && now < startTime;
    const isLive = startTime && !isPast && !isFuture;

    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => {
          if (isTeacher || state.user?.role === 'ADMIN') {
            router.push(`/exams/${item._id}`);
          } else {
            // Always allow entering to see instructions or results
            router.push({ pathname: '/exams/take', params: { id: item._id } });
          }
        }}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.dateBox, { backgroundColor: isLive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)' }]}>
            <Text style={[styles.dateDay, { color: isLive ? '#22c55e' : '#f59e0b' }]}>
              {item.scheduledDate ? new Date(item.scheduledDate).getDate() : '--'}
            </Text>
            <Text style={[styles.dateMonth, { color: isLive ? '#22c55e' : '#f59e0b' }]}>
              {item.scheduledDate ? new Date(item.scheduledDate).toLocaleString('default', { month: 'short' }).toUpperCase() : 'N/A'}
            </Text>
          </View>
          <View style={styles.info}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.name, { color: theme.text }]}>{item.title}</Text>
              {!isTeacher && item.resultsPublished && myAttempt?.finalScore != null && (
                <View style={styles.upperScoreBadge}>
                  <Text style={styles.upperScoreText}>{myAttempt.finalScore}/{item.totalMarks}</Text>
                </View>
              )}
            </View>

            <Text style={[styles.className, { color: theme.textMuted }]}>{item.class?.className || item.class?.name || 'General Exam'}</Text>
          </View>
          
          {isSubmitted ? (
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: '#22c55e' }]}>
              <Ionicons name="checkmark-circle" size={12} color="#22c55e" style={{ marginRight: 4 }} />
              <Text style={[styles.statusText, { color: '#22c55e' }]}>
                {myAttempt?.status === 'GRADED' || myAttempt?.status === 'REVIEWED' ? 'GRADED' : 'DONE'}
              </Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: Colors.background, borderColor: theme.border }]}>
              <Text style={[styles.statusText, { color: isLive ? '#22c55e' : (isPast ? '#ef4444' : theme.textMuted) }]}>
                {isLive ? 'LIVE' : (isPast ? 'EXPIRED' : (item.isPublished ? 'PUBLISHED' : 'DRAFT'))}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
          <View style={styles.footerItem}>
            <Ionicons name="time-outline" size={14} color={theme.textMuted} />
            <Text style={[styles.footerText, { color: theme.textMuted }]}>
              {item.duration} min · {item.startTime || 'TBA'}
            </Text>
          </View>
          <View style={[styles.footerItem]}>
            {isSubmitted ? (
              <>
                <Ionicons name="eye-outline" size={14} color={theme.textMuted} />
                <Text style={[styles.footerText, { color: theme.textMuted }]}>View Submission</Text>
              </>
            ) : (
              <>
                <Ionicons 
                  name={(isTeacher || state.user?.role === 'ADMIN') ? "stats-chart-outline" : "play-outline"} 
                  size={14} 
                  color={(isTeacher || state.user?.role === 'ADMIN') ? theme.textMuted : (isLive ? '#22c55e' : theme.textMuted)} 
                />
                <Text style={[
                  styles.footerText, 
                  { 
                    color: (isTeacher || state.user?.role === 'ADMIN') ? theme.textMuted : (isLive ? '#22c55e' : theme.textMuted), 
                    fontWeight: (isTeacher || state.user?.role === 'ADMIN') ? 'normal' : 'bold' 
                  }
                ]}>
                  {(isTeacher || state.user?.role === 'ADMIN') ? "View Results" : (isLive ? "Take Exam" : (isPast ? "Missed" : "Upcoming"))}
                </Text>
              </>
            )}
          </View>

          <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Exams</Text>
          {(state.user?.role === 'TEACHER') && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => router.push('/exams/add')}
            >
              <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="rgba(255,255,255,0.5)" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by exam or class..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {['ALL', 'LIVE', 'UPCOMING', 'HISTORY'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                  {tab}
                </Text>
                {activeTab === tab && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={filteredExams}
          renderItem={({ item }) => <ExamCard item={item} />}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
               <View style={styles.emptyIconBox}>
                 <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
               </View>
               <Text style={styles.emptyText}>No exams scheduled</Text>
               <Text style={styles.emptySubText}>Check back later for updates</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 64,
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginRight: 4,
    position: 'relative',
  },
  activeTab: {
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
  },
  activeTabText: {
    color: '#10b981',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -4,
    left: 4,
    right: 4,
    height: 3,
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
  listContent: {
    padding: 20,
    paddingTop: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateBox: {
    width: 56,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  className: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  upperScoreBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  upperScoreText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10b981',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});
