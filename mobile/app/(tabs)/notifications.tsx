import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../../src/utils/api';
import { AuthContext } from '../../src/context/AuthContext';
import { Colors, Spacing, BorderRadius, Shadow, GRadients } from '../../constants/theme';

const { width } = Dimensions.get('window');

const TARGET_ROLES = [
  { label: 'Everyone', value: 'ALL', icon: 'people' },
  { label: 'Students', value: 'STUDENT', icon: 'school' },
  { label: 'Teachers', value: 'TEACHER', icon: 'briefcase' },
];

export default function NotificationsTab() {
  const router = useRouter();
  const { state } = useContext(AuthContext);
  const isAdmin = state.user?.role === 'ADMIN';
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [form, setForm] = useState({ title: '', message: '', target: 'ALL' });

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get('/notifications');
      setNotifications(response.data.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const handleSend = async () => {
    if (!form.title || !form.message) {
      Alert.alert('Error', 'Title and message are required');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/notifications', {
        title: form.title,
        content: form.message,
        targetRole: form.target,
      });
      setModalVisible(false);
      setForm({ title: '', message: '', target: 'ALL' });
      fetchNotifications();
      Alert.alert('Success', 'Notification broadcasted successfully');
    } catch (error: any) {
      console.error('Send notification error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifs = notifications.filter((n: any) => {
    if (filter === 'ALL') return true;
    return n.targetRole === filter;
  });

  return (
    <View style={styles.container}>
      {/* Updated Header to match Service Requests */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Notifications</Text>
          {isAdmin && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="megaphone" size={22} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          {['ALL', 'STUDENT', 'TEACHER'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'ALL' ? 'ALL' : f === 'STUDENT' ? 'STUDENTS' : 'TEACHERS'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#22c55e" />
          </View>
        ) : filteredNotifs.length > 0 ? (
          filteredNotifs.map((notif: any, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.notifCard}
              onPress={() => router.push(`/notifications/${notif._id}`)}
              activeOpacity={0.7}
            >
                <View style={[styles.notifIcon, { backgroundColor: '#22c55e10' }]}>
                <Ionicons 
                  name={notif.targetRole === 'TEACHER' ? 'briefcase' : 'school'} 
                  size={24} 
                  color="#22c55e" 
                />
              </View>
              <View style={styles.notifInfo}>
                <View style={styles.notifHeader}>
                  <Text style={styles.notifTitle} numberOfLines={1}>{notif.title}</Text>
                  <Text style={styles.notifTime}>{new Date(notif.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.notifMessage} numberOfLines={2}>{notif.content || notif.message}</Text>
                <View style={styles.notifFooter}>
                  <View style={styles.targetBadge}>
                    <Text style={styles.targetText}>{notif.targetRole || 'EVERYONE'}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="notifications-off-outline" size={60} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyText}>All caught up!</Text>
            <Text style={styles.emptySub}>No new notifications found in this category.</Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Broadcast Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeaderInner}>
              <Text style={styles.modalTitle}>Broadcast</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Target Audience</Text>
              <View style={styles.targetRow}>
                {TARGET_ROLES.map((role) => (
                  <TouchableOpacity
                    key={role.value}
                    style={[styles.targetBtn, form.target === role.value && styles.targetBtnActive]}
                    onPress={() => setForm({ ...form, target: role.value })}
                  >
                    <Ionicons 
                      name={role.icon as any} 
                      size={20} 
                      color={form.target === role.value ? '#fff' : '#64748b'} 
                    />
                    <Text style={[styles.targetBtnText, form.target === role.value && { color: '#fff' }]}>
                      {role.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Subject / Title</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Important update..."
                placeholderTextColor="#94a3b8"
                value={form.title}
                onChangeText={(val) => setForm({ ...form, title: val })}
              />

              <Text style={styles.inputLabel}>Message Content</Text>
              <TextInput
                style={[styles.modalInput, { height: 120, textAlignVertical: 'top' }]}
                placeholder="Write your message here..."
                placeholderTextColor="#94a3b8"
                multiline
                value={form.message}
                onChangeText={(val) => setForm({ ...form, message: val })}
              />

              <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={loading}>
                <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.sendGradient}>
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Ionicons name="paper-plane" size={20} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.sendBtnText}>Broadcast Now</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
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
  header: {
    backgroundColor: '#0f172a',
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    ...Shadow.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterChipActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  filterText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '800',
  },
  filterTextActive: {
    color: '#0f172a',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loaderContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadow.sm,
  },
  notifIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notifInfo: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  notifTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  notifTime: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  notifMessage: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    fontWeight: '500',
  },
  notifFooter: {
    marginTop: 12,
    flexDirection: 'row',
  },
  targetBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  targetText: {
    fontSize: 10,
    color: '#000',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...Shadow.sm,
  },
  emptyText: {
    color: '#1e293b',
    fontSize: 20,
    fontWeight: '800',
  },
  emptySub: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeaderInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
  },
  inputLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 10,
    fontWeight: '700',
  },
  targetRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  targetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  targetBtnActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  targetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
    color: '#1e293b',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    fontSize: 16,
    fontWeight: '500',
  },
  sendBtn: {
    ...Shadow.md,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 30,
  },
  sendGradient: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },
});
