import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../../src/utils/api';
import { AuthContext } from '../../src/context/AuthContext';
import { Colors, Shadow, BorderRadius } from '../../constants/theme';

export default function RequestsListScreen() {
  const router = useRouter();
  const { state } = useContext(AuthContext);
  const isAdmin = state.user?.role === 'ADMIN';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchRequests = async () => {
    try {
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const response = await apiClient.get('/service-requests', { params });
      setRequests(response.data.data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [search, statusFilter])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRequests();
  }, [search, statusFilter]);

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Request',
      'Are you sure you want to delete this request permanently?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/service-requests/${id}`);
              fetchRequests();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete request');
            }
          }
        }
      ]
    );
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING': return { color: '#22c55e', bg: '#f0fdf4', icon: 'time', label: 'Pending' };
      case 'APPROVED': return { color: '#10b981', bg: '#ecfdf5', icon: 'checkmark-circle', label: 'Approved' };
      case 'RESOLVED': return { color: '#22c55e', bg: '#f0fdf4', icon: 'checkmark-done-circle', label: 'Resolved' };
      case 'REJECTED': return { color: '#ef4444', bg: '#fef2f2', icon: 'close-circle', label: 'Rejected' };
      default: return { color: '#64748b', bg: '#f8fafc', icon: 'help-circle', label: status };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Service Requests</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/requests/add')}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="rgba(255,255,255,0.5)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your requests..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {['ALL', 'PENDING', 'APPROVED', 'RESOLVED', 'REJECTED'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.filterChip, statusFilter === status && styles.filterChipActive]}
                onPress={() => setStatusFilter(status)}
              >
                <Text style={[styles.filterText, statusFilter === status && styles.filterTextActive]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
          <ActivityIndicator size="large" color="#22c55e" style={{ marginTop: 50 }} />
        ) : requests.length > 0 ? (
          requests.map((req: any) => {
            const status = getStatusInfo(req.status);
            const canDelete = isAdmin; // Only Admins can delete requests now

            return (
              <TouchableOpacity 
                key={req._id} 
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => router.push(`/requests/${req._id}`)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.subjectRow}>
                    <Text style={styles.subjectText} numberOfLines={1}>{req.subject}</Text>
                    {req.priority === 'HIGH' && (
                      <View style={styles.priorityBadge}>
                        <Text style={styles.priorityText}>HIGH</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.badgeRow}>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                      <Ionicons name={status.icon as any} size={14} color={status.color} />
                      <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
                    </View>
                    {canDelete && (
                      <TouchableOpacity 
                        onPress={() => handleDelete(req._id)}
                        style={styles.deleteBtn}
                      >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <Text style={styles.description} numberOfLines={2}>{req.description}</Text>

                <View style={styles.divider} />

                <View style={styles.cardFooter}>
                  <View style={styles.footerInfo}>
                    <Ionicons name="calendar-outline" size={14} color="#64748b" />
                    <Text style={styles.footerText}>{new Date(req.createdAt).toLocaleDateString()}</Text>
                  </View>
                  {(isAdmin || (state.user?.role === 'TEACHER' && req.student?._id !== state.user?._id)) ? (
                    <Text style={styles.studentName}>{req.student?.fullName || req.student?.username}</Text>
                  ) : (
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeText}>{req.type?.replace('_', ' ')}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="document-text-outline" size={64} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyText}>No service requests found</Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => router.push('/requests/add')}
            >
              <Text style={styles.emptyButtonText}>Create New Request</Text>
            </TouchableOpacity>
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
  header: {
    backgroundColor: '#0f172a',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 20,
    paddingBottom: 25,
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  filterContainer: {
    marginTop: 15,
    marginBottom: 10,
  },
  filterScroll: {
    paddingRight: 20,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginRight: 10,
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  subjectRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjectText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    flexShrink: 1,
  },
  priorityBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  priorityText: {
    fontSize: 9,
    color: '#ef4444',
    fontWeight: '900',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 15,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 15,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  studentName: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '800',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typeText: {
    color: '#000',
    fontSize: 10,
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
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 14,
    ...Shadow.sm,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});
