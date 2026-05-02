import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../src/context/AuthContext';
import apiClient from '../../src/utils/api';
import { Colors, Spacing, BorderRadius, Shadow, GRadients } from '../../constants/theme';
import { HelloWave } from '@/components/hello-wave';
import { API_CONFIG } from '../../src/config/api';

const { width } = Dimensions.get('window');

const StatCard = ({ title, value, icon, color, isLight = false, onPress }) => (
  <TouchableOpacity style={styles.statCardWrapper} onPress={onPress}>
    <View style={[styles.statCard, isLight && styles.statCardLight]}>
      <View style={styles.statHeader}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
            <Ionicons name={icon} size={24} color={color} />
          </View>
        )}
        <Text style={[styles.statValue, isLight && styles.statValueLight, { color }]}>{value}</Text>
      </View>
      <Text style={[styles.statLabel, isLight && styles.statLabelLight]}>{title}</Text>
    </View>
  </TouchableOpacity>
);

export default function DashboardScreen() {
  const router = useRouter();
  const { state, updateUser } = useContext(AuthContext);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview'); // For Student Dashboard

  const fetchDashboard = async () => {
    try {
      const role = state.user?.role?.toUpperCase();
      console.log('Fetching dashboard for role:', role);
      
      let endpoint = '/dashboard/student'; // Fallback
      if (role === 'ADMIN') endpoint = '/dashboard/admin';
      else if (role === 'TEACHER') endpoint = '/dashboard/teacher';
      else if (role === 'STUDENT') endpoint = '/dashboard/student';

      const response = await apiClient.get(endpoint);
      setDashboard(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get('/profile');
      const user = response.data.data;
      updateUser({
        profileImage: user.profileImage,
        fullName: user.profileId?.name || user.name || user.username,
      });
    } catch (error) {
      console.error('Failed to sync profile on dashboard:', error);
    }
  };

  useEffect(() => {
    if (state.token) {
      fetchDashboard();
      fetchProfile();
    }
  }, [state.token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const role = state.user?.role?.toUpperCase();
  const isAdmin = role === 'ADMIN';
  const isTeacher = role === 'TEACHER';

  // Management Dashboard (Teacher/Admin Combined)
  if (isAdmin || isTeacher) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: '#0f172a', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, paddingBottom: 120 }]}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.userNameLeft}>
                {state.user?.fullName || state.user?.username}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.avatarContainerSmall}
              onPress={() => router.push('/profile')}
            >
              {state.user?.profileImage ? (
                <Image 
                  source={{ uri: `${API_CONFIG.BASE_URL.replace('/api', '')}${state.user.profileImage}` }} 
                  style={styles.avatarImageSmall} 
                />
              ) : (
                <Ionicons name="person" size={24} color={Colors.white} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.brandContainer}>
            <View style={styles.logoBox}>
              <Ionicons name="school" size={24} color="#10b981" />
            </View>
            <Text style={styles.brandName}>Ceylon Scholars Academy</Text>
          </View>

          {isAdmin && dashboard?.stats && (
            <View style={styles.revenueCardContainer}>
              <LinearGradient
                colors={['#ffffff', '#f8fafc']}
                style={styles.revenueCard}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.revenueHeaderRow}>
                    <View>
                      <Text style={[styles.revenueLabel, { color: Colors.textMuted }]}>Total Revenue</Text>
                      <Text style={[styles.revenueValue, { color: Colors.primary }]}>
                        Rs. {dashboard.stats.totalRevenue?.toLocaleString() || '0'}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.revenueButton} onPress={() => router.push('/payments' as any)}>
                      <Ionicons name="trending-up" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.incomeOutcomeRow}>
                    <View style={styles.financeItem}>
                      <View style={[styles.financeIcon, { backgroundColor: '#10b98115' }]}>
                        <Ionicons name="arrow-down-circle" size={16} color="#10b981" />
                      </View>
                      <View>
                        <Text style={styles.financeLabel}>Income</Text>
                        <Text style={styles.financeValue}>Rs. {dashboard.stats.totalIncome?.toLocaleString() || '0'}</Text>
                      </View>
                    </View>

                    <View style={styles.financeItem}>
                      <View style={[styles.financeIcon, { backgroundColor: '#f43f5e15' }]}>
                        <Ionicons name="arrow-up-circle" size={16} color="#f43f5e" />
                      </View>
                      <View>
                        <Text style={styles.financeLabel}>Outcome</Text>
                        <Text style={styles.financeValue}>Rs. {dashboard.stats.totalOutcome?.toLocaleString() || '0'}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </View>
          )}
        </View>

        <View style={styles.contentCard}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
            }
          >
            <View style={styles.statsGrid}>
              {isAdmin ? (
                <>
                  <StatCard title="Students" value={dashboard?.stats?.totalStudents || 0} icon="people" color="#3b82f6" isLight onPress={() => router.push('/students' as any)} />
                  <StatCard title="Teachers" value={dashboard?.stats?.totalTeachers || 0} icon="school" color="#8b5cf6" isLight onPress={() => router.push('/teachers' as any)} />
                  <StatCard title="Classes" value={dashboard?.stats?.totalClasses || 0} icon="book" color="#6366f1" isLight onPress={() => router.push('/classes' as any)} />
                  <StatCard title="Exams" value={dashboard?.stats?.totalExams || 0} icon="clipboard" color="#f59e0b" isLight onPress={() => router.push('/exams' as any)} />
                </>
              ) : (
                <>
                  <StatCard title="My Classes" value={dashboard?.stats?.totalClasses || 0} icon="book" color="#6366f1" isLight onPress={() => router.push('/classes' as any)} />
                  <StatCard title="Students" value={dashboard?.stats?.totalEnrollments || 0} icon="people" color="#3b82f6" isLight onPress={() => router.push('/enrollments' as any)} />
                  <StatCard title="Completed" value={dashboard?.stats?.completedSessions || 0} icon="checkmark-circle" color="#10b981" isLight onPress={() => router.push('/attendance' as any)} />
                  <StatCard title="Today" value={dashboard?.stats?.todaySessions || 0} icon="calendar" color="#f43f5e" isLight onPress={() => router.push('/timetable' as any)} />
                </>
              )}
            </View>

            <View style={styles.actionSection}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionGrid}>
                {[
                  { label: 'Attendance', icon: 'checkbox', color: '#10b981', route: '/attendance' },
                  { label: 'Payments', icon: 'card', color: '#8b5cf6', route: '/payments' },
                  { label: 'Notices', icon: 'notifications', color: '#f43f5e', route: '/notifications' },
                  { label: 'Settings', icon: 'settings', color: '#64748b', route: '/profile' },
                ].map((action, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.actionItem}
                    onPress={() => router.push(action.route as any)}
                  >
                    <View style={[styles.actionIcon, { backgroundColor: `${action.color}12` }]}>
                      <Ionicons name={action.icon as any} size={28} color={action.color} />
                    </View>
                    <Text style={styles.actionLabel}>{action.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {isTeacher && dashboard?.classes?.length > 0 && (
              <View style={{ marginTop: Spacing.md }}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>My Classes</Text>
                  <TouchableOpacity onPress={() => router.push('/classes' as any)}>
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.lg }}>
                  <View style={{ flexDirection: 'row', paddingHorizontal: Spacing.lg }}>
                    {dashboard.classes.map((c) => (
                      <TouchableOpacity 
                        key={c._id} 
                        style={styles.horizontalClassCard}
                        onPress={() => router.push(`/classes/${c._id}` as any)}
                      >
                        <View style={styles.cardHeader}>
                          <View style={styles.subjectPill}>
                            <Text style={styles.subjectPillText}>{c.subject?.toUpperCase() || 'SUBJECT'}</Text>
                          </View>
                        </View>
                        
                        <Text style={styles.classNameText} numberOfLines={1}>{c.className}</Text>
                        <Text style={styles.gradeText}>Grade {c.grade}</Text>
                        
                        <View style={styles.cardFooter}>
                          <View style={styles.financeItem}>
                            <Ionicons name="people-outline" size={14} color={Colors.textMuted} />
                            <Text style={styles.actionLabel}>View Students</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
            
            {!isAdmin && dashboard?.upcomingSessions?.length > 0 && (
              <View style={{ marginTop: Spacing.md }}>
                <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
                {dashboard.upcomingSessions.map((session) => (
                  <TouchableOpacity key={session._id} style={styles.fullWidthClassCard}>
                    <View style={styles.fullCardContent}>
                      <View style={styles.fullCardMain}>
                        <Text style={styles.fullCardTitle}>{session.class?.className}</Text>
                        <Text style={styles.fullCardSub}>{session.class?.subject} · {session.class?.hall?.name || 'Main Hall'}</Text>
                        <View style={styles.fullCardMeta}>
                          <View style={styles.metaItem}>
                            <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
                            <Text style={styles.metaText}>{new Date(session.date).toLocaleDateString()}</Text>
                          </View>
                          <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                            <Text style={styles.metaText}>{session.startTime}</Text>
                          </View>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    );
  }

  const isStudent = role === 'STUDENT';

  // Student Dashboard Layout
  if (isStudent) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: '#0f172a', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, paddingBottom: 120 }]}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.userNameLeft}>{state.user?.fullName || state.user?.username}</Text>
            </View>
            <TouchableOpacity 
              style={styles.avatarContainerSmall}
              onPress={() => router.push('/profile')}
            >
              {state.user?.profileImage ? (
                <Image 
                  source={{ uri: `${API_CONFIG.BASE_URL.replace('/api', '')}${state.user.profileImage}` }} 
                  style={styles.avatarImageSmall} 
                />
              ) : (
                <Ionicons name="person" size={24} color={Colors.white} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.brandContainer}>
            <View style={styles.logoBox}>
              <Ionicons name="school" size={24} color="#10b981" />
            </View>
            <Text style={styles.brandName}>Ceylon Scholars Academy</Text>
          </View>
        </View>

        <View style={styles.contentCard}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
            }
          >
            <View style={styles.statsGrid}>
              <StatCard title="Enrolled" value={dashboard?.stats?.enrolledClasses || 0} icon="book" color="#6366f1" isLight onPress={() => setActiveTab('Classes')} />
              <StatCard title="Attendance" value={`${dashboard?.stats?.attendancePercentage || 0}%`} icon="checkmark-circle" color="#10b981" isLight onPress={() => setActiveTab('Stats')} />
              <StatCard title="Upcoming" value={dashboard?.stats?.upcomingExams || 0} icon="document-text" color="#f59e0b" isLight onPress={() => setActiveTab('Exams')} />
              <StatCard title="Notices" value={dashboard?.stats?.unreadNotifications || 0} icon="notifications" color="#f43f5e" isLight onPress={() => router.push('/notifications' as any)} />
            </View>

            <View style={styles.actionSection}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionGrid}>
                {[
                  { label: 'Classes', icon: 'school', color: '#6366f1', route: '/classes' },
                  { label: 'Payments', icon: 'card', color: '#8b5cf6', route: '/payments' },
                  { label: 'Exams', icon: 'document-text', color: '#f59e0b', route: '/exams' },
                  { label: 'Profile', icon: 'person', color: '#64748b', route: '/profile' },
                ].map((action, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.actionItem}
                    onPress={() => router.push(action.route as any)}
                  >
                    <View style={[styles.actionIcon, { backgroundColor: `${action.color}15`, borderColor: `${action.color}30`, borderWidth: 1 }]}>
                      <Ionicons name={action.icon as any} size={28} color={action.color} />
                    </View>
                    <Text style={styles.actionLabel}>{action.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {dashboard?.enrollments?.length > 0 && (
              <View style={{ marginTop: Spacing.md }}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>My Classes</Text>
                  <TouchableOpacity onPress={() => router.push('/classes' as any)}>
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.lg }}>
                  <View style={{ flexDirection: 'row', paddingHorizontal: Spacing.lg }}>
                    {dashboard.enrollments.slice(0, 3).map((e) => (
                      <TouchableOpacity 
                        key={e._id} 
                        style={styles.horizontalClassCard}
                        onPress={() => router.push(`/classes/${e.class?._id}` as any)}
                      >
                        <View style={styles.cardHeader}>
                          <View style={styles.subjectPill}>
                            <Text style={styles.subjectPillText}>{e.class?.subject?.toUpperCase()}</Text>
                          </View>
                        </View>
                        
                        <Text style={styles.classNameText} numberOfLines={1}>{e.class?.className}</Text>
                        <Text style={styles.gradeText}>Grade {e.class?.grade}</Text>
                        
                        <View style={styles.cardDetailRow}>
                          <Ionicons name="time-outline" size={14} color={Colors.accent} />
                          <Text style={styles.cardDetailText}>{e.class?.dayOfWeek} {e.class?.startTime}</Text>
                        </View>
                        
                        <View style={styles.cardFooter}>
                          <Text style={styles.feeText}>LKR {e.class?.monthlyFee?.toLocaleString()}</Text>
                          <View style={[styles.statusBadge, { backgroundColor: e.currentMonthPayment?.status === 'COMPLETED' ? '#10b98115' : '#ef444415' }]}>
                            <Text style={[styles.statusBadgeText, { color: e.currentMonthPayment?.status === 'COMPLETED' ? '#10b981' : '#ef4444' }]}>
                              {e.currentMonthPayment?.status === 'COMPLETED' ? 'PAID' : 'PENDING'}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    );
  }

    // Fallback UI if role is not recognized or dashboard data is missing
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.textMuted} />
        <Text style={{ marginTop: 16, color: Colors.text, fontSize: 18, fontWeight: 'bold' }}>Dashboard Unavailable</Text>
        <Text style={{ marginTop: 8, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 40 }}>
          We couldn't load your dashboard data. Please try again or contact support.
        </Text>
        <TouchableOpacity 
          style={{ marginTop: 24, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
          onPress={onRefresh}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Retry Now</Text>
        </TouchableOpacity>
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
    paddingBottom: 80, // Extra padding for overlap
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginRight: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
  },
  contentCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    marginTop: -80, // High overlap
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  userNameLeft: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 2,
  },
  roleLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10b981',
    letterSpacing: 0.5,
  },
  avatarContainerSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarImageSmall: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  mottoContainerCompact: {
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingBottom: 20,
  },
  mottoPrefixSmall: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  mottoAcademySmall: {
    fontSize: 22,
    fontWeight: '900',
    color: '#22c55e',
    marginTop: 2,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarImage: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.md - 2,
  },
  avatarText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
  revenueCardContainer: {
    marginTop: -10,
    ...Shadow.md,
  },
  revenueCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  revenueCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 140,
  },
  revenueHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 15,
    width: '100%',
  },
  incomeOutcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  financeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  financeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  financeLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  financeValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  revenueLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  revenueButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  statCardWrapper: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
    marginBottom: Spacing.md,
  },
  statCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    height: 120,
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statCardLight: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerLight: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  actionSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionItem: {
    alignItems: 'center',
    width: (width - Spacing.lg * 2) / 4,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  fullWidthClassCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  fullCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fullCardMain: {
    flex: 1,
  },
  fullCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  fullCardSub: {
    fontSize: 13,
    color: Colors.accent,
    marginVertical: 4,
    fontWeight: '600',
  },
  fullCardMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  horizontalClassCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    width: 260,
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  subjectPill: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subjectPillText: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: 'bold',
  },
  classNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  gradeText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  cardDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardDetailText: {
    fontSize: 13,
    color: Colors.text,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  feeText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  viewAllText: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: 'bold',
  },
});
