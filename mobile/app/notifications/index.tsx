import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../../src/utils/api';
import { Colors, Spacing, BorderRadius, Shadow, GRadients } from '../../constants/theme';

const { width } = Dimensions.get('window');

const TARGET_ROLES = [
  { label: 'Everyone', value: 'ALL', icon: 'people' },
  { label: 'Students', value: 'STUDENT', icon: 'school' },
  { label: 'Teachers', value: 'TEACHER', icon: 'briefcase' },
];

export default function NotificationsScreen() {
  const router = useRouter();
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
      <View style={[styles.header, { backgroundColor: '#0f172a' }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Notifications</Text>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: '#22c55e' }]}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="megaphone" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          {['ALL', 'STUDENT', 'TEACHER'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && { backgroundColor: '#22c55e', borderColor: '#22c55e' }]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'ALL' ? 'All' : f === 'STUDENT' ? 'Students' : 'Teachers'}
              </Text>
            </TouchableOpacity>
          ))}
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
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loaderText}>Syncing messages...</Text>
          </View>
        ) : filteredNotifs.length > 0 ? (
          filteredNotifs.map((notif: any, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.notifCard}
              onPress={() => router.push(`/notifications/${notif._id}`)}
            >
              <View style={[styles.notifIcon, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                <Ionicons 
                  name={notif.targetRole === 'TEACHER' ? 'briefcase' : 'school'} 
                  size={20} 
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
                  <View style={[styles.targetBadge, { borderColor: 'rgba(34, 197, 94, 0.2)', backgroundColor: 'rgba(34, 197, 94, 0.05)' }]}>
                    <Text style={[styles.targetText, { color: '#22c55e' }]}>{notif.targetRole || 'EVERYONE'}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="notifications-off-outline" size={48} color="#475569" />
            </View>
            <Text style={styles.emptyText}>Inbox is empty</Text>
            <Text style={styles.emptySub}>No notifications match your current filter.</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
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
              <Text style={styles.modalTitle}>Broadcast Message</Text>
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
                placeholder="Important: Exam Results..."
                placeholderTextColor="#64748b"
                value={form.title}
                onChangeText={(val) => setForm({ ...form, title: val })}
              />

              <Text style={styles.inputLabel}>Message Content</Text>
              <TextInput
                style={[styles.modalInput, { height: 120, textAlignVertical: 'top' }]}
                placeholder="Write your message here..."
                placeholderTextColor="#64748b"
                multiline
                value={form.message}
                onChangeText={(val) => setForm({ ...form, message: val })}
              />

                <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={loading}>
                  <View style={[styles.sendGradient, { backgroundColor: '#22c55e' }]}>
                  {loading ? <ActivityIndicator color="#fff" /> : (
                    <>
                      <Ionicons name="paper-plane" size={20} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.sendBtnText}>Broadcast Now</Text>
                    </>
                  )}
                  </View>
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loaderContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  loaderText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadow.sm,
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
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
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  notifTime: {
    fontSize: 11,
    color: '#64748b',
  },
  notifMessage: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  notifFooter: {
    marginTop: 12,
    flexDirection: 'row',
  },
  targetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  targetText: {
    fontSize: 10,
    color: '#3b82f6',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    color: '#1e293b',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptySub: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  inputLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 10,
    fontWeight: '600',
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
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  targetBtnActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  targetBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    color: '#1e293b',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 16,
  },
  sendBtn: {
    ...Shadow.md,
  },
  sendGradient: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
