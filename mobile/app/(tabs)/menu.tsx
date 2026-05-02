import React, { useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../../src/context/AuthContext';
import { Colors, Spacing, BorderRadius, Shadow, GRadients } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function MenuScreen() {
  const router = useRouter();
  const { state, signOut } = useContext(AuthContext);

  const role = state.user?.role?.toUpperCase() || 'ADMIN';
  const isAdmin = role === 'ADMIN';

  const adminItems = [
    { icon: 'people', title: 'Students', route: '/students', color: '#3b82f6' },
    { icon: 'school', title: 'Teachers', route: '/teachers', color: '#a855f7' },
    { icon: 'book', title: 'Classes', route: '/classes', color: '#10b981' },
    { icon: 'person-add', title: 'Enrollment', route: '/enrollments', color: '#6366f1' },
    {icon: 'card', title: 'Payments', route: '/payments', color: '#22c55e' },
    { icon: 'document-text', title: 'Exams', route: '/exams', color: '#f59e0b' },
    { icon: 'checkbox', title: 'Attendance', route: '/attendance', color: '#00bcd4' },
    { icon: 'business', title: 'Halls', route: '/halls', color: '#f43f5e' },
    { icon: 'help-circle', title: 'Requests', route: '/requests', color: '#8b5cf6' },
    { icon: 'notifications', title: 'Notifications', route: '/notifications', color: '#ef4444' },
  ];

  const teacherItems = [
    { icon: 'book', title: 'My Classes', route: '/classes', color: '#10b981' },
    { icon: 'calendar', title: 'Timetable', route: '/timetable', color: '#3b82f6' },
    { icon: 'checkbox', title: 'Attendance', route: '/attendance', color: '#00bcd4' },
    { icon: 'document-text', title: 'Exams', route: '/exams', color: '#f59e0b' },
    { icon: 'business', title: 'Halls', route: '/halls', color: '#f43f5e' },
    { icon: 'notifications', title: 'Notifications', route: '/notifications', color: '#ef4444' },
    { icon: 'help-circle', title: 'Requests', route: '/requests', color: '#8b5cf6' },
  ];

  const studentItems = [
    { icon: 'book', title: 'My Classes', route: '/classes', color: '#10b981' },
    { icon: 'calendar', title: 'Timetable', route: '/timetable', color: '#3b82f6' },
    { icon: 'document-text', title: 'Exams', route: '/exams', color: '#f59e0b' },
    { icon: 'notifications', title: 'Notifications', route: '/notifications', color: '#ef4444' },
    { icon: 'help-circle', title: 'Requests', route: '/requests', color: '#8b5cf6' },
  ];

  const menuItems = role === 'ADMIN' ? adminItems : role === 'TEACHER' ? teacherItems : studentItems;

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.grid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.card}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={28} color={item.color} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.dark.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LinearGradient
            colors={GRadients.purple}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.logoutGradient}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0 (Build 2026)</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 40,
    backgroundColor: '#0f172a',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    marginTop: 4,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  grid: {
    marginBottom: Spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadow.sm,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  logoutButton: {
    marginTop: Spacing.md,
    ...Shadow.md,
  },
  logoutGradient: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionText: {
    textAlign: 'center',
    color: Colors.dark.textMuted,
    fontSize: 12,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
});
