import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../../src/utils/api';
import { AuthContext } from '../../src/context/AuthContext';
import { Colors, Spacing, BorderRadius, Shadow, GRadients } from '../../constants/theme';

const { width } = Dimensions.get('window');

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'PENDING', color: '#b45309' },
  { label: 'Approved', value: 'APPROVED', color: '#10b981' },
  { label: 'Resolved', value: 'RESOLVED', color: '#22c55e' },
  { label: 'Rejected', value: 'REJECTED', color: '#ef4444' },
];

export default function RequestDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { state } = useContext(AuthContext);
  const isAdmin = state.user?.role === 'ADMIN';
  const isTeacher = state.user?.role === 'TEACHER';
  const isOwner = request?.student?._id === state.user?._id || request?.student === state.user?._id;

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [request, setRequest] = useState<any>(null);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    adminNotes: '',
  });

  const fetchRequest = async () => {
    try {
      const response = await apiClient.get(`/service-requests/${id}`);
      const data = response.data.data;
      setRequest(data);
      setUpdateForm({
        status: data.status,
        adminNotes: data.adminNotes || '',
      });
    } catch (error) {
      console.error('Failed to fetch request:', error);
      Alert.alert('Error', 'Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await apiClient.put(`/service-requests/${id}`, updateForm);
      Alert.alert('Success', 'Request updated successfully');
      fetchRequest();
    } catch (error) {
      console.error('Update request error:', error);
      Alert.alert('Error', 'Failed to update request');
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !request) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    const opt = STATUS_OPTIONS.find(o => o.value === status);
    return opt ? opt.color : '#64748b';
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Request Details</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '15' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>{request.status}</Text>
            </View>
            <Text style={styles.dateText}>{new Date(request.createdAt).toLocaleDateString()}</Text>
          </View>

          <Text style={styles.subjectText}>{request.subject}</Text>
          
          <View style={styles.tagsRow}>
            <View style={styles.typeBadge}>
              <Ionicons name="pricetag-outline" size={12} color="#64748b" style={{marginRight: 4}} />
              <Text style={styles.typeText}>{request.type?.replace('_', ' ')}</Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: 'rgba(34, 197, 94, 0.05)', borderColor: 'rgba(34, 197, 94, 0.2)' }]}>
              <Ionicons name="person-outline" size={12} color="#22c55e" style={{marginRight: 4}} />
              <Text style={[styles.typeText, { color: '#22c55e' }]}>To: {request.recipient || 'ADMIN'}</Text>
            </View>
            {request.priority === 'HIGH' && (
              <View style={[styles.priorityBadge, { backgroundColor: '#ef4444' }]}>
                <Text style={styles.priorityBadgeText}>HIGH</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.descriptionText}>{request.description}</Text>

          {request.requestDate && (
            <View style={styles.infoBox}>
              <Ionicons name="calendar" size={18} color="#3b82f6" />
              <Text style={styles.infoBoxText}>Requested for: <Text style={{fontWeight: '700'}}>{new Date(request.requestDate).toLocaleDateString()}</Text></Text>
            </View>
          )}

          {request.class && (
            <View style={[styles.infoBox, { backgroundColor: 'rgba(34, 197, 94, 0.08)', borderColor: 'rgba(34, 197, 94, 0.1)' }]}>
              <Ionicons name="book" size={18} color="#22c55e" />
              <Text style={[styles.infoBoxText, { color: '#166534' }]}>Class: <Text style={{fontWeight: '700'}}>{request.class.className}</Text></Text>
            </View>
          )}

          {(isAdmin || isTeacher) && (
            <View style={styles.studentSection}>
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>Requested By</Text>
              <View style={styles.studentRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{request.student?.username?.substring(0, 1).toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.studentName}>{request.student?.fullName || request.student?.username}</Text>
                  <Text style={styles.studentId}>{request.student?.studentId || 'N/A'}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Admin/Teacher Reply Section */}
        {!isOwner && (isAdmin || isTeacher) && (isAdmin || (isTeacher && (request.targetTeacher === state.user?.profileId || (request.recipient === 'TEACHER' && !request.targetTeacher)))) && (
          <View style={[styles.mainCard, { marginTop: 20 }]}>
            <Text style={styles.cardTitle}>Update Status & Response</Text>
            
            <Text style={styles.inputLabel}>Set Status</Text>
            <View style={styles.statusGrid}>
              {STATUS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.statusBtn,
                    updateForm.status === opt.value && { borderColor: opt.color, backgroundColor: opt.color + '10' }
                  ]}
                  onPress={() => setUpdateForm({ ...updateForm, status: opt.value })}
                >
                  <Text style={[styles.statusBtnText, updateForm.status === opt.value && { color: opt.color }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Response / Reply</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Enter your response to the student..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
              value={updateForm.adminNotes}
              onChangeText={(val) => setUpdateForm({ ...updateForm, adminNotes: val })}
            />

            <TouchableOpacity 
              style={styles.updateBtn} 
              onPress={handleUpdate}
              disabled={updating}
            >
              <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.updateGradient}>
                {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.updateText}>Update Request</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Student View Admin Response */}
        {!isAdmin && request.adminNotes && (
          <View style={[styles.mainCard, { marginTop: 20, borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.02)' }]}>
            <View style={styles.responseHeader}>
              <View style={styles.responseIcon}>
                <Ionicons name="chatbubble-ellipses" size={20} color="#22c55e" />
              </View>
              <Text style={styles.responseTitle}>Staff Response</Text>
            </View>
            <Text style={styles.adminNotes}>{request.adminNotes}</Text>
            {request.resolvedBy && (
              <View style={styles.resolvedInfo}>
                <Text style={styles.resolvedBy}>Processed by {request.resolvedBy.username}</Text>
                <Ionicons name="shield-checkmark" size={14} color="#22c55e" />
              </View>
            )}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    backgroundColor: '#0f172a',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    ...Shadow.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 25,
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  subjectText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  typeBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typeText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    justifyContent: 'center',
  },
  priorityBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 20,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
    marginBottom: 12,
  },
  infoBoxText: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
  },
  studentSection: {
    marginTop: 10,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatarText: {
    color: '#22c55e',
    fontWeight: '800',
    fontSize: 18,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  studentId: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 12,
    marginTop: 5,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statusBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  statusBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  textArea: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    color: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    height: 120,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  updateBtn: {
    marginTop: 25,
    ...Shadow.md,
  },
  updateGradient: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  responseIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
  },
  responseTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: '#166534',
  },
  adminNotes: {
    fontSize: 15,
    color: '#1e293b',
    lineHeight: 24,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  resolvedInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginTop: 20,
      gap: 6,
  },
  resolvedBy: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
});
