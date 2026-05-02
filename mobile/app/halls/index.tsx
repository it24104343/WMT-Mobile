import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../../src/utils/api';
import { AuthContext } from '../../src/context/AuthContext';
import { Colors, Spacing, BorderRadius, Shadow, GRadients } from '../../constants/theme';

export default function HallsScreen() {
  const router = useRouter();
  const { state } = React.useContext(AuthContext);
  const isAdmin = state.user?.role === 'ADMIN';

  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Add Hall state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    code: '',
    capacity: '',
    resources: '',
  });

  // Availability check state
  const [checkForm, setCheckForm] = useState({
    hallId: '',
    hallName: '',
    dayOfWeek: 'Monday',
    startTime: '08:00',
    endTime: '10:00',
  });
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [showCheck, setShowCheck] = useState(false);

  const fetchHalls = async () => {
    try {
      const response = await apiClient.get('/halls');
      setHalls(response.data.data);
    } catch (error) {
      console.error('Failed to fetch halls:', error);
      Alert.alert('Error', 'Failed to load halls');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHalls();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHalls();
  };

  const handleAddHall = async () => {
    if (!addForm.name || !addForm.code || !addForm.capacity) {
      Alert.alert('Error', 'Please fill in name, code and capacity');
      return;
    }
    setAdding(true);
    try {
      await apiClient.post('/halls', {
        ...addForm,
        capacity: parseInt(addForm.capacity)
      });
      Alert.alert('Success', 'Hall added successfully');
      setAddModalVisible(false);
      setAddForm({ name: '', code: '', capacity: '', resources: '' });
      fetchHalls();
    } catch (error: any) {
      console.error('Add hall error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add hall');
    } finally {
      setAdding(false);
    }
  };

  const handleCheckAvailability = async () => {
    if (!checkForm.hallId) {
      Alert.alert('Error', 'Please select a hall first');
      return;
    }
    setChecking(true);
    setCheckResult(null);
    try {
      const response = await apiClient.post('/halls/check-availability', {
        hallId: checkForm.hallId,
        dayOfWeek: checkForm.dayOfWeek,
        startTime: checkForm.startTime,
        endTime: checkForm.endTime
      });
      setCheckResult(response.data);
    } catch (error) {
      console.error('Check hall availability error:', error);
      Alert.alert('Error', 'Failed to check hall availability');
    } finally {
      setChecking(false);
    }
  };

  const HallCard = ({ item }: { item: any }) => (
    <View style={styles.hallCard}>
      <View style={styles.hallHeader}>
        <View style={styles.hallInfo}>
          <Text style={styles.hallName}>{item.name}</Text>
          <Text style={styles.hallCode}>{item.code} | Capacity: {item.capacity}</Text>
        </View>
        <TouchableOpacity 
          style={styles.checkIconBtn}
          onPress={() => {
            setCheckForm({ ...checkForm, hallId: item._id, hallName: item.name });
            setShowCheck(true);
          }}
        >
          <Ionicons name="calendar-outline" size={20} color={Colors.dark.primary} />
          <Text style={styles.checkLinkText}>Check</Text>
        </TouchableOpacity>
      </View>
      
      {item.resources && (
        <View style={styles.resourceContainer}>
          <Ionicons name="construct-outline" size={14} color={Colors.dark.textMuted} />
          <Text style={styles.resourceText}>{item.resources}</Text>
        </View>
      )}
      
      <View style={styles.badgeRow}>
        <View style={[styles.statusBadge, { backgroundColor: item.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)' }]}>
          <Text style={[styles.statusText, { color: item.isActive ? Colors.dark.success : '#94a3b8' }]}>
            {item.isActive ? 'Active' : 'Maintenance'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Halls</Text>
          {isAdmin ? (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setAddModalVisible(true)}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.primary} />
        }
      >
        {showCheck && (
          <View style={styles.checkSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Check Availability: {checkForm.hallName}</Text>
              <TouchableOpacity onPress={() => setShowCheck(false)}>
                <Ionicons name="close" size={20} color={Colors.dark.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.dayGrid}>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayChip, checkForm.dayOfWeek === day && styles.dayChipActive]}
                  onPress={() => setCheckForm({ ...checkForm, dayOfWeek: day })}
                >
                  <Text style={[styles.dayChipText, checkForm.dayOfWeek === day && styles.dayChipTextActive]}>
                    {day.substring(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.timeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Start Time</Text>
                <TextInput
                  style={styles.input}
                  value={checkForm.startTime}
                  onChangeText={(val) => setCheckForm({ ...checkForm, startTime: val })}
                  placeholder="HH:MM"
                  placeholderTextColor="#475569"
                />
              </View>
              <View style={{ width: Spacing.md }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>End Time</Text>
                <TextInput
                  style={styles.input}
                  value={checkForm.endTime}
                  onChangeText={(val) => setCheckForm({ ...checkForm, endTime: val })}
                  placeholder="HH:MM"
                  placeholderTextColor="#475569"
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.checkBtn} 
              onPress={handleCheckAvailability}
              disabled={checking}
            >
              {checking ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.checkBtnText}>Check Availability</Text>
              )}
            </TouchableOpacity>

            {checkResult && (
              <View style={[styles.resultCard, { borderColor: checkResult.available ? Colors.dark.success : '#ef4444' }]}>
                <View style={styles.resultHeader}>
                  <Ionicons 
                    name={checkResult.available ? "checkmark-circle" : "alert-circle"} 
                    size={20} 
                    color={checkResult.available ? Colors.dark.success : "#ef4444"} 
                  />
                  <Text style={[styles.resultTitle, { color: checkResult.available ? Colors.dark.success : "#ef4444" }]}>
                    {checkResult.available ? "Hall is Available" : "Hall Conflict Detected"}
                  </Text>
                </View>
                {!checkResult.available && checkResult.conflictingClass && (
                  <View style={styles.conflictList}>
                    <Text style={styles.conflictText}>
                      • Occupied by: {checkResult.conflictingClass.className}
                    </Text>
                    <Text style={styles.conflictText}>
                      • Time: {checkResult.conflictingClass.startTime} - {checkResult.conflictingClass.endTime}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        <Text style={styles.listHeader}>Institute Halls ({halls.length})</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color={Colors.dark.primary} style={{ marginTop: 40 }} />
        ) : halls.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color={Colors.dark.border} />
            <Text style={styles.emptyText}>No halls found</Text>
          </View>
        ) : (
          halls.map((hall: any) => <HallCard key={hall._id} item={hall} />)
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Hall Modal */}
      <View>
        <ScrollView>
          <View style={{ height: 1 }} />
        </ScrollView>
      </View>
      {/* Real Modal Implementation */}
      {addModalVisible && (
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.modalOverlay}>
            <View style={styles.addModalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Hall</Text>
                <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                  <Ionicons name="close" size={24} color={Colors.dark.text} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.addModalBody}>
                <Text style={styles.label}>Hall Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={addForm.name}
                  onChangeText={(val) => setAddForm({ ...addForm, name: val })}
                  placeholder="e.g. Main Hall"
                  placeholderTextColor="#475569"
                />

                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Hall Code *</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={addForm.code}
                      onChangeText={(val) => setAddForm({ ...addForm, code: val })}
                      placeholder="e.g. H001"
                      placeholderTextColor="#475569"
                    />
                  </View>
                  <View style={{ width: Spacing.md }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Capacity *</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={addForm.capacity}
                      onChangeText={(val) => setAddForm({ ...addForm, capacity: val })}
                      placeholder="e.g. 100"
                      keyboardType="numeric"
                      placeholderTextColor="#475569"
                    />
                  </View>
                </View>

                <Text style={styles.label}>Resources (comma separated)</Text>
                <TextInput
                  style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
                  value={addForm.resources}
                  onChangeText={(val) => setAddForm({ ...addForm, resources: val })}
                  placeholder="e.g. Projector, AC, Sound System"
                  multiline
                  placeholderTextColor="#475569"
                />

                <TouchableOpacity 
                  style={[styles.submitBtn, adding && { opacity: 0.7 }]}
                  onPress={handleAddHall}
                  disabled={adding}
                >
                  {adding ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Add Hall</Text>}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.sm,
  },
  content: {
    padding: Spacing.lg,
  },
  listHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark.textMuted,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  hallCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    ...Shadow.sm,
  },
  hallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  hallInfo: {
    flex: 1,
  },
  hallName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  hallCode: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  checkIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  checkLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.primary,
  },
  resourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: 6,
    padding: 8,
    backgroundColor: Colors.dark.background,
    borderRadius: 6,
  },
  resourceText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    fontStyle: 'italic',
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    color: Colors.dark.textMuted,
    marginTop: Spacing.md,
    fontSize: 16,
  },
  
  // Check Section
  checkSection: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
    ...Shadow.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.dark.primary,
    textTransform: 'uppercase',
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.md,
  },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  dayChipActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  dayChipText: {
    fontSize: 11,
    color: Colors.dark.textMuted,
  },
  dayChipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  timeRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.dark.background,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    color: Colors.dark.text,
    fontSize: 14,
  },
  checkBtn: {
    backgroundColor: Colors.dark.primary,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  resultCard: {
    marginTop: Spacing.md,
    backgroundColor: Colors.dark.background,
    borderRadius: 8,
    padding: Spacing.md,
    borderWidth: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  conflictList: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  conflictText: {
    fontSize: 12,
    color: '#ef4444',
    marginBottom: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  addModalContainer: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  addModalBody: {
    padding: Spacing.lg,
  },
  modalInput: {
    backgroundColor: Colors.dark.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    color: Colors.dark.text,
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  submitBtn: {
    backgroundColor: Colors.dark.primary,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
  },
});
