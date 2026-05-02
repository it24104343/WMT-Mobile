import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Dimensions,
  Platform,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../src/utils/api';
import { AuthContext } from '../../src/context/AuthContext';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';

const { width } = Dimensions.get('window');

const GRADES = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Grade 13'];
const SUBJECTS = ['Maths', 'Science', 'English', 'Sinhala', 'History', 'ICT', 'Business', 'Accounting'];

export default function MyClassesScreen() {
  const router = useRouter();
  const { state } = useContext(AuthContext);
  const isAdmin = state.user?.role === 'ADMIN';
  const isTeacher = state.user?.role === 'TEACHER';
  const isStudent = state.user?.role === 'STUDENT';
  const isAdminOrTeacher = isAdmin || isTeacher;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pickerModal, setPickerModal] = useState({
    visible: false,
    title: '',
    options: [],
    onSelect: (val: string) => {},
  });
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState('');
  
  // Filter States
  const [selectedGrade, setSelectedGrade] = useState('All Grades');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedMonth, setSelectedMonth] = useState('All Months');
  const [showOnlyEnrolled, setShowOnlyEnrolled] = useState(isStudent);

  const fetchClasses = async () => {
    try {
      const params: any = {};
      if (isTeacher) params.teacher = state.user.profileId;
      if (isStudent && showOnlyEnrolled) params.student = state.user.profileId;
      
      const response = await apiClient.get('/classes', { params });
      setClasses(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [showOnlyEnrolled]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchClasses();
  };

  const getTargetMonthOptions = () => {
    const options = ['All Months'];
    const now = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    for (let i = -1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      options.push(`${months[d.getMonth()]} ${d.getFullYear()}`);
    }
    return options;
  };

  const monthOptions = getTargetMonthOptions();

  const filteredClasses = classes.filter((c: any) => {
    const className = (c.className || '').toLowerCase();
    const subject = (c.subject || '').toLowerCase();
    const searchLower = search.toLowerCase();

    const matchesSearch = className.includes(searchLower) || subject.includes(searchLower);
    const matchesGrade = selectedGrade === 'All Grades' || c.grade === selectedGrade;
    const matchesSubject = selectedSubject === 'All Subjects' || c.subject === selectedSubject;
    const targetMonthYear = c.targetMonth && c.targetYear ? `${c.targetMonth} ${c.targetYear}` : '';
    const matchesMonth = selectedMonth === 'All Months' || targetMonthYear === selectedMonth;
    
    return matchesSearch && matchesGrade && matchesSubject && matchesMonth;
  });

  const showPicker = (title: string, options: string[], currentVal: string, onSelect: (val: string) => void) => {
    setPickerModal({
      visible: true,
      title,
      options,
      onSelect,
    });
  };

  const FilterChip = ({ label, selected, onPress }: { label: string, selected: boolean, onPress: () => void }) => (
    <TouchableOpacity 
      style={[styles.filterChip, selected && styles.filterChipActive]} 
      onPress={onPress}
    >
      <Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>{label}</Text>
      <Ionicons 
        name="chevron-down" 
        size={14} 
        color={selected ? '#22c55e' : 'rgba(255,255,255,0.5)'} 
        style={{ marginLeft: 6 }} 
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <ExpoLinearGradient colors={['#0f172a', '#1e293b']} style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Classes</Text>
          {isAdmin && (
            <TouchableOpacity 
              style={styles.addClassBtn}
              onPress={() => router.push('/classes/add')}
            >
              <Ionicons name="add" size={24} color="#fff" />
              <Text style={styles.addClassText}>Add Class</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search classes or codes..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filter Chips */}
        <View style={styles.filtersWrapper}>
          {isStudent && (
            <View style={styles.toggleContainer}>
              <TouchableOpacity 
                style={[styles.toggleBtn, showOnlyEnrolled && styles.toggleBtnActive]} 
                onPress={() => setShowOnlyEnrolled(true)}
              >
                <Text style={[styles.toggleText, showOnlyEnrolled && styles.toggleTextActive]}>My Classes</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleBtn, !showOnlyEnrolled && styles.toggleBtnActive]} 
                onPress={() => setShowOnlyEnrolled(false)}
              >
                <Text style={[styles.toggleText, !showOnlyEnrolled && styles.toggleTextActive]}>All Classes</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.filtersScroll}
            contentContainerStyle={styles.filtersContent}
          >
            <FilterChip 
              label={selectedGrade} 
              selected={selectedGrade !== 'All Grades'} 
              onPress={() => showPicker('Select Grade', ['All Grades', ...GRADES], selectedGrade, setSelectedGrade)} 
            />
            
            <FilterChip 
              label={selectedSubject} 
              selected={selectedSubject !== 'All Subjects'} 
              onPress={() => showPicker('Select Subject', ['All Subjects', ...SUBJECTS], selectedSubject, setSelectedSubject)} 
            />
            
            <FilterChip 
              label={selectedMonth} 
              selected={selectedMonth !== 'All Months'} 
              onPress={() => showPicker('Select Month', monthOptions, selectedMonth, setSelectedMonth)} 
            />
          </ScrollView>
        </View>
      </ExpoLinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#22c55e" style={{ marginTop: 50 }} />
        ) : filteredClasses.length > 0 ? (
          <View style={styles.grid}>
            {filteredClasses.map((item: any) => {
              const enrolled = item.enrolledCount || item.students?.length || 0;
              const capacity = item.capacity || 1;
              const progress = Math.min(100, (enrolled / capacity) * 100);
              const isFull = enrolled >= capacity;

              return (
                <TouchableOpacity 
                  key={item._id || item.id} 
                  style={styles.classCard}
                  activeOpacity={0.7}
                  onPress={() => {
                    const classId = item._id || item.id;
                    if (classId) {
                      router.push(`/classes/${classId}`);
                    } else {
                      Alert.alert('Error', 'Class ID not found');
                    }
                  }}
                >
                  <View style={styles.cardTopRow}>
                      <View style={styles.hatIconContainer}>
                        <Ionicons name="school" size={22} color="#10b981" />
                      </View>
                      <View style={styles.gradeBadge}>
                        <Text style={styles.gradeText}>{item.grade}</Text>
                      </View>
                  </View>

                  <Text style={styles.classNameText} numberOfLines={2}>
                    {item.className || `${item.subject || 'Subject'} - ${item.grade || 'Grade'}`}
                  </Text>

                  <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                      <Ionicons name="time" size={12} color="#64748b" />
                      <Text style={styles.infoText}>{item.dayOfWeek?.substring(0, 3) || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Ionicons name="people" size={12} color="#64748b" />
                      <Text style={styles.infoText}>{enrolled}/{capacity}</Text>
                    </View>
                  </View>

                  <View style={styles.progressSection}>
                    <View style={styles.progressBg}>
                      <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: isFull ? '#ef4444' : '#10b981' }]} />
                    </View>
                    <View style={styles.progressLabels}>
                        <Text style={styles.enrollmentText}>{enrolled}/{capacity}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="school-outline" size={80} color="#cbd5e1" />
            <Text style={styles.emptyText}>No classes found matching your filters</Text>
            <TouchableOpacity 
              style={styles.resetBtn}
              onPress={() => {
                setSearch('');
                setSelectedGrade('All Grades');
                setSelectedSubject('All Subjects');
                setSelectedMonth('All Months');
              }}
            >
              <Text style={styles.resetBtnText}>Clear All Filters</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Picker Modal */}
      <Modal
        visible={pickerModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerModal({ ...pickerModal, visible: false })}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setPickerModal({ ...pickerModal, visible: false })}
        >
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{pickerModal.title}</Text>
            </View>
            <FlatList
              data={pickerModal.options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.optionItem}
                  onPress={() => {
                    pickerModal.onSelect(item);
                    setPickerModal({ ...pickerModal, visible: false });
                  }}
                >
                  <Text style={styles.optionText}>{item}</Text>
                  {(item === selectedGrade || item === selectedSubject || item === selectedMonth) && (
                    <Ionicons name="checkmark" size={20} color="#10b981" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
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
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    ...Shadow.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  addClassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 4,
    ...Shadow.sm,
  },
  addClassText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    height: 50,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    marginLeft: 12,
  },
  filtersScroll: {
    marginBottom: 5,
  },
  filtersContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  filtersWrapper: {
    gap: 15,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#22c55e',
  },
  toggleText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: 'bold',
  },
  toggleTextActive: {
    color: '#fff',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10b981',
  },
  filterChipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#10b981',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  classCard: {
    width: (width - 44) / 2,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  hatIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  gradeBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
  },
  classNameText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    height: 40,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
  },
  progressSection: {
    marginTop: 'auto',
  },
  progressBg: {
    height: 6,
    backgroundColor: '#0f172a',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  enrollmentText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
  },
  fullLabel: {
    position: 'absolute',
    top: 8,
    right: -20,
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 2,
    transform: [{ rotate: '45deg' }],
  },
  fullLabelText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  resetBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  resetBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 24,
    maxHeight: '60%',
    overflow: 'hidden',
  },
  pickerHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  optionItem: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  optionText: {
    fontSize: 16,
    color: '#334155',
  },
});
