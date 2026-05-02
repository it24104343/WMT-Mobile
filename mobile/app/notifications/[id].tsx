import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../../src/utils/api';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [notification, setNotification] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchNotification = async () => {
    try {
      const response = await apiClient.get(`/notifications/${id}`);
      setNotification(response.data.data);
      
      // Mark as read when opened
      if (!response.data.data.isRead) {
        await apiClient.put(`/notifications/${id}/read`);
      }
    } catch (error) {
      console.error('Failed to fetch notification details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchNotification();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!notification) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Notification not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const themeColor = '#22c55e';

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Banner Section */}
        <View style={[styles.banner, { backgroundColor: '#0f172a' }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={[styles.badge, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
              <Text style={[styles.badgeText, { color: '#22c55e' }]}>{notification.targetRole || 'EVERYONE'}</Text>
            </View>
          </View>

          <View style={styles.bannerContent}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
              <Ionicons 
                name={notification.targetRole === 'TEACHER' ? 'briefcase' : 'notifications'} 
                size={32} 
                color="#22c55e" 
              />
            </View>
            <Text style={styles.title}>{notification.title}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.metaText}>{new Date(notification.createdAt).toLocaleDateString()}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.metaText}>{new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.messageHeader}>
              <MaterialCommunityIcons name="format-quote-open" size={24} color={themeColor} />
              <Text style={styles.messageLabel}>Message Body</Text>
            </View>
            <Text style={styles.messageContent}>{notification.content}</Text>
            <View style={styles.messageFooter}>
              <MaterialCommunityIcons name="format-quote-close" size={24} color={themeColor} style={{ alignSelf: 'flex-end' }} />
            </View>
          </View>

          <View style={styles.senderInfo}>
            <View style={styles.senderAvatar}>
              <Text style={styles.avatarText}>
                {notification.createdBy?.username?.substring(0, 2).toUpperCase() || 'AD'}
              </Text>
            </View>
            <View>
              <Text style={styles.senderLabel}>Broadcasted by</Text>
              <Text style={styles.senderName}>{notification.createdBy?.username || 'Administrator'}</Text>
            </View>
          </View>
        </View>
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  banner: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  bannerContent: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    padding: 24,
    marginTop: -20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadow.md,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  messageContent: {
    fontSize: 18,
    color: '#1e293b',
    lineHeight: 28,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
  },
  messageFooter: {
    marginTop: 10,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    paddingHorizontal: 10,
    gap: 16,
  },
  senderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  avatarText: {
    color: '#22c55e',
    fontWeight: 'bold',
    fontSize: 14,
  },
  senderLabel: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  senderName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
