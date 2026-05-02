import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  Modal,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../../src/context/AuthContext';
import apiClient from '../../src/utils/api';
import { Colors, Spacing, BorderRadius, Shadow, GRadients } from '../../constants/theme';
import { API_CONFIG } from '../../src/config/api';

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function PaymentListScreen() {
  const router = useRouter();
  const { state } = React.useContext(AuthContext);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('History');
  const [paymentMode, setPaymentMode] = useState<string | null>(null); // null, 'STUDENT', or 'TEACHER'
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [classes, setClasses] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [classModalVisible, setClassModalVisible] = useState(false);
  const [monthModalVisible, setMonthModalVisible] = useState(false);
  const [yearModalVisible, setYearModalVisible] = useState(false);

  const fetchPayments = async () => {
    if (!paymentMode) return;
    try {
      setLoading(true);
      const role = state.user?.role?.toUpperCase();
      let endpoint = '/payments';
      const params: any = {};

      if (role === 'STUDENT') {
        endpoint = `/payments/student/${state.user.profileId}`;
      } else if (role === 'TEACHER') {
        params.teacher = state.user.profileId;
        params.paymentType = 'TEACHER_SALARY';
      } else if (role === 'ADMIN') {
        if (paymentMode === 'TEACHER') {
          params.paymentType = 'TEACHER_SALARY';
        } else {
          params.paymentType = 'CLASS_FEE';
        }
      }

      const response = await apiClient.get(endpoint, { params });
      setPayments(response.data.data);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSummary = async () => {
    if (state.user?.role !== 'ADMIN' || !paymentMode) return;
    
    try {
      setLoading(true);
      let endpoint = '';
      let params: any = { month, year };

      if (paymentMode === 'STUDENT') {
        if (!selectedClass) {
          setSummary([]);
          setLoading(false);
          return;
        }
        endpoint = `/payments/class/${selectedClass._id}/summary`;
      } else {
        endpoint = '/payments/teacher-salary/summary';
      }

      const response = await apiClient.get(endpoint, { params });
      if (paymentMode === 'STUDENT') {
        setSummary(response.data.data.students || []);
      } else {
        setSummary(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEnrollmentStatus = async (enrollmentId: string, currentStatus: boolean) => {
    try {
      await apiClient.put(`/enrollments/${enrollmentId}`, { isActive: !currentStatus });
      fetchSummary(); // Refresh summary
      Alert.alert('Success', `Student enrollment ${!currentStatus ? 'activated' : 'stopped'} successfully`);
    } catch (error) {
      console.error('Failed to toggle enrollment:', error);
      Alert.alert('Error', 'Failed to update enrollment status');
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await apiClient.get('/classes');
      setClasses(response.data.data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  useEffect(() => {
    const role = state.user?.role?.toUpperCase();
    if (role === 'STUDENT') {
      setPaymentMode('STUDENT');
    } else if (role === 'TEACHER') {
      setPaymentMode('TEACHER');
    }
    if (role === 'ADMIN') fetchClasses();
  }, []);

  useEffect(() => {
    if (paymentMode) {
      if (activeTab === 'History') fetchPayments();
      else fetchSummary();
    }
  }, [activeTab, paymentMode, selectedClass, month, year]);

  const onRefresh = () => {
    setRefreshing(true);
    if (activeTab === 'History') fetchPayments();
    else fetchSummary();
  };

  const handleDownloadReceipt = (url: string) => {
    if (!url) {
      Alert.alert('Info', 'No receipt available.');
      return;
    }
    const fullUrl = url.startsWith('http') ? url : `${API_CONFIG.BASE_URL.replace('/api', '')}${url}`;
    Linking.openURL(fullUrl).catch(() => Alert.alert('Error', 'Could not open receipt.'));
  };

  const filteredPayments = payments.filter((p: any) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const studentMatch = p.student?.name?.toLowerCase().includes(searchLower);
    const teacherMatch = p.teacher?.name?.toLowerCase().includes(searchLower);
    const receiptMatch = p.receiptNo?.toLowerCase().includes(searchLower);
    const classMatch = (p.class?.className || p.class?.name)?.toLowerCase().includes(searchLower);
    return studentMatch || teacherMatch || receiptMatch || classMatch;
  });

  const PaymentCard = ({ item }) => {
    const isCompleted = item.status === 'COMPLETED' || item.status === 'Paid';
    const getStatusColor = () => {
      if (isCompleted) return Colors.dark.success;
      if (item.status === 'PENDING' || item.status === 'Pending') return Colors.dark.primary;
      return '#ef4444';
    };

    return (
      <TouchableOpacity style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>
              {item.paymentType === 'TEACHER_SALARY' 
                ? (item.class?.className || 'General Salary')
                : (item.student?.name || (state.user?.role === 'STUDENT' ? state.user.fullName : 'Class Payment'))}
            </Text>
            <Text style={styles.receiptNo}>
              {item.paymentType === 'TEACHER_SALARY' 
                ? `Salary Payment - ${MONTHS[item.month-1]}` 
                : `${item.class?.className || 'Class Fee'} - ${MONTHS[item.month-1]}`}
            </Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amountText}>Rs. {item.amount?.toLocaleString()}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor() }]}>{item.status}</Text>
            </View>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <Ionicons name="calendar-outline" size={14} color={Colors.dark.textMuted} />
            <Text style={styles.footerText}>{new Date(item.paidAt || item.createdAt).toLocaleDateString()}</Text>
          </View>
          <View style={styles.footerItem}>
            <Ionicons name="card-outline" size={14} color={Colors.dark.textMuted} />
            <Text style={styles.footerText}>{item.paymentMethod}</Text>
          </View>
          <TouchableOpacity onPress={() => handleDownloadReceipt(item.receiptUrl)}>
            <Ionicons name="download-outline" size={16} color={Colors.dark.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (state.user?.role === 'ADMIN' && !paymentMode) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.title, { marginTop: 20 }]}>Payment Management</Text>
        </View>
        <View style={styles.selectionContent}>
          <TouchableOpacity 
            style={styles.selectionCard}
            onPress={() => setPaymentMode('STUDENT')}
          >
            <View style={[styles.selectionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Ionicons name="people" size={32} color="#3b82f6" />
            </View>
            <View style={styles.selectionText}>
              <Text style={styles.selectionTitle}>Student Fees</Text>
              <Text style={styles.selectionSub}>Manage student class payments</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.selectionCard}
            onPress={() => setPaymentMode('TEACHER')}
          >
            <View style={[styles.selectionIcon, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
              <Ionicons name="school" size={32} color="#22c55e" />
            </View>
            <View style={styles.selectionText}>
              <Text style={styles.selectionTitle}>Teacher Salary</Text>
              <Text style={styles.selectionSub}>Process and track teacher payroll</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: '#0f172a' }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            onPress={() => {
              if (state.user?.role === 'ADMIN' && paymentMode) {
                setPaymentMode(null);
              } else {
                router.back();
              }
            }} 
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {(paymentMode === 'TEACHER' || state.user?.role === 'TEACHER') ? 'Teacher Salary' : 'Student Fees'}
          </Text>
          {((paymentMode === 'TEACHER' && state.user?.role === 'ADMIN') || state.user?.role === 'STUDENT') && (
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: '#22c55e' }]}
              onPress={() => router.push({ pathname: '/payments/add', params: { type: 'CLASS_FEE' } })}
            >
              <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {state.user?.role === 'ADMIN' && (
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'History' && { backgroundColor: '#fff' }]}
              onPress={() => setActiveTab('History')}
            >
              <Text style={[styles.tabText, activeTab === 'History' && { color: '#22c55e' }]}>History</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'Summary' && { backgroundColor: '#fff' }]}
              onPress={() => setActiveTab('Summary')}
            >
              <Text style={[styles.tabText, activeTab === 'Summary' && { color: '#22c55e' }]}>Summary</Text>
            </TouchableOpacity>
          </View>
        )}

        {(() => {
          const isHistoryView = activeTab === 'History' || state.user?.role !== 'ADMIN';
          
          if (isHistoryView) {
            return (
              <View style={[styles.searchContainer, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: '#fff' }]}
                  placeholder="Search..."
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
            );
          } else {
            return (
              <View style={styles.summaryFilterContainer}>
                {paymentMode === 'STUDENT' && (
                  <TouchableOpacity 
                    style={[styles.classPicker, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }]}
                    onPress={() => setClassModalVisible(true)}
                  >
                    <Ionicons name="filter" size={20} color="#22c55e" />
                    <Text style={[styles.classPickerText, { color: '#fff' }]}>
                      {selectedClass ? selectedClass.className : 'Select Class'}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="rgba(255,255,255,0.6)" />
                  </TouchableOpacity>
                )}
                <View style={styles.periodRow}>
                  <TouchableOpacity onPress={() => setMonthModalVisible(true)} style={styles.periodBadge}>
                    <Text style={styles.periodText}>{MONTHS[month-1]}</Text>
                    <Ionicons name="chevron-down" size={14} color={Colors.dark.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setYearModalVisible(true)} style={styles.periodBadge}>
                    <Text style={styles.periodText}>{year}</Text>
                    <Ionicons name="chevron-down" size={14} color={Colors.dark.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }
        })()}
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={Colors.dark.primary} style={{ marginTop: 50 }} />
      ) : activeTab === 'Summary' ? (
        <FlatList
          data={summary}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }: any) => (
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardInfo}>
                <Text style={styles.summaryCardName}>
                  {paymentMode === 'STUDENT' ? item.student?.name : item.teacher?.name}
                </Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryCardSub}>
                    {paymentMode === 'STUDENT' ? item.student?.phone : item.teacher?.email}
                  </Text>
                  {paymentMode === 'STUDENT' && item.inFreePeriod && (
                    <View style={styles.freeBadge}>
                      <Text style={styles.freeText}>FREE PERIOD</Text>
                    </View>
                  )}
                </View>
              </View>
              
              <View style={styles.summaryActions}>
                <View style={[
                  styles.statusIconBadge, 
                  { backgroundColor: item.isPaid ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' }
                ]}>
                  <Ionicons 
                    name={item.isPaid ? "checkmark-circle" : "close-circle"} 
                    size={20} 
                    color={item.isPaid ? Colors.dark.success : '#ef4444'} 
                  />
                  <Text style={[
                    styles.statusTextMini, 
                    { color: item.isPaid ? Colors.dark.success : '#ef4444' }
                  ]}>
                    {item.isPaid ? 'PAID' : 'UNPAID'}
                  </Text>
                </View>

                {paymentMode === 'STUDENT' && (
                  <TouchableOpacity 
                    style={[styles.actionBtn, !item.isActive && styles.actionBtnActive]} 
                    onPress={() => toggleEnrollmentStatus(item.enrollment, item.isActive)}
                  >
                    <Ionicons 
                      name={item.isActive ? "stop-circle-outline" : "play-circle-outline"} 
                      size={24} 
                      color={item.isActive ? "#ef4444" : Colors.dark.success} 
                    />
                    <Text style={[styles.actionBtnText, { color: item.isActive ? "#ef4444" : Colors.dark.success }]}>
                      {item.isActive ? 'STOP' : 'START'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="analytics-outline" size={64} color={Colors.dark.border} />
              <Text style={styles.emptyText}>No data for this period</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredPayments}
          renderItem={({ item }) => <PaymentCard item={item} />}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="card-outline" size={64} color={Colors.dark.border} />
              <Text style={styles.emptyText}>No records found</Text>
            </View>
          }
        />
      )}

      <Modal visible={classModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Class</Text>
              <TouchableOpacity onPress={() => setClassModalVisible(false)} style={styles.modalClose}>
                <Ionicons name="close" size={24} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {classes.map((cls: any) => (
                <TouchableOpacity key={cls._id} style={styles.modalItem} onPress={() => { setSelectedClass(cls); setClassModalVisible(false); }}>
                  <View>
                    <Text style={styles.modalItemTitle}>{cls.className}</Text>
                    <Text style={styles.modalItemSub}>{cls.subject} | Grade {cls.grade}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Month Picker Modal */}
      <Modal visible={monthModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Month</Text>
              <TouchableOpacity onPress={() => setMonthModalVisible(false)} style={styles.modalClose}>
                <Ionicons name="close" size={24} color="#1e293b" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {MONTHS.map((m, idx) => (
                <TouchableOpacity key={m} style={styles.modalItem} onPress={() => { setMonth(idx + 1); setMonthModalVisible(false); }}>
                  <Text style={styles.modalItemTitle}>{m}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.modalItem, { borderBottomWidth: 0, marginTop: 10 }]} onPress={() => setMonthModalVisible(false)}>
                <Text style={[styles.modalItemTitle, { color: '#ef4444', textAlign: 'center' }]}>Exit Selection</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Year Picker Modal */}
      <Modal visible={yearModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Year</Text>
              <TouchableOpacity onPress={() => setYearModalVisible(false)} style={styles.modalClose}>
                <Ionicons name="close" size={24} color="#1e293b" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {['2024', '2025', '2026'].map(y => (
                <TouchableOpacity key={y} style={styles.modalItem} onPress={() => { setYear(parseInt(y)); setYearModalVisible(false); }}>
                  <Text style={styles.modalItemTitle}>{y}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.modalItem, { borderBottomWidth: 0, marginTop: 10 }]} onPress={() => setYearModalVisible(false)}>
                <Text style={[styles.modalItemTitle, { color: '#ef4444', textAlign: 'center' }]}>Exit Selection</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { 
    paddingTop: 60, 
    paddingHorizontal: 20, 
    paddingBottom: 30, 
    borderBottomLeftRadius: 40, 
    borderBottomRightRadius: 40,
    backgroundColor: '#0f172a'
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  backButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  addButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.dark.success, justifyContent: 'center', alignItems: 'center' },
  selectionContent: { padding: 20, gap: 15 },
  selectionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', ...Shadow.sm },
  selectionIcon: { width: 56, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  selectionText: { flex: 1 },
  selectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  selectionSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  tabContainer: { flexDirection: 'row', marginBottom: 15, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: Colors.dark.surface },
  tabText: { color: Colors.dark.textMuted, fontWeight: 'bold' },
  tabTextActive: { color: Colors.dark.primary },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.surface, borderRadius: 10, paddingHorizontal: 15, height: 48, borderWidth: 1, borderColor: Colors.dark.border },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: Colors.dark.text, fontSize: 16 },
  summaryFilterContainer: { gap: 10 },
  classPicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.surface, padding: 12, borderRadius: 10, gap: 10, borderWidth: 1, borderColor: Colors.dark.border },
  classPickerText: { flex: 1, color: Colors.dark.text, fontSize: 15, fontWeight: '600' },
  periodRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 10 },
  periodBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full, gap: 4 },
  periodText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  listContent: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: '#e2e8f0', ...Shadow.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  receiptNo: { fontSize: 12, color: '#64748b', marginTop: 2 },
  amountContainer: { alignItems: 'flex-end' },
  amountText: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  cardFooter: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.dark.border, paddingTop: 12, alignItems: 'center', justifyContent: 'space-between' },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12, color: Colors.dark.textMuted },
  summaryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0', ...Shadow.sm },
  summaryCardInfo: { flex: 1 },
  summaryCardName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  summaryCardSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: Colors.dark.textMuted, marginTop: 15, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: Colors.dark.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.dark.text, marginBottom: 15 },
  modalItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: Colors.dark.border },
  modalItemTitle: { fontSize: 16, color: Colors.dark.text, fontWeight: 'bold' },
  modalItemSub: { fontSize: 12, color: Colors.dark.textMuted, marginTop: 2 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalClose: { padding: 5 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  freeBadge: { backgroundColor: 'rgba(59, 130, 246, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  freeText: { color: '#3b82f6', fontSize: 10, fontWeight: 'bold' },
  summaryActions: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  statusIconBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusTextMini: { fontSize: 11, fontWeight: 'bold' },
  actionBtn: { alignItems: 'center', minWidth: 45 },
  actionBtnActive: { opacity: 0.8 },
  actionBtnText: { fontSize: 10, fontWeight: 'bold', marginTop: 2 }
});
