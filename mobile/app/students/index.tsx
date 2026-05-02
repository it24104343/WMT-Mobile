import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../../src/utils/api';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';

export default function StudentListScreen() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchStudents = async () => {
    try {
      const response = await apiClient.get('/students');
      setStudents(response.data.data);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStudents();
  };

  const filteredStudents = students.filter(student => 
    student.name?.toLowerCase().includes(search.toLowerCase()) ||
    student.studentId?.toLowerCase().includes(search.toLowerCase())
  );

  const StudentCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/students/${item._id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.name?.substring(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.studentId}>{item.studentId}</Text>
        </View>
        <View style={styles.gradeBadge}>
          <Text style={styles.gradeText}>Grade {item.grade}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.detailItem}>
          <Ionicons name="book-outline" size={14} color={Colors.dark.textMuted} />
          <Text style={styles.detailText}>{item.enrolledClasses?.length || 0} Classes</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="call-outline" size={14} color={Colors.dark.textMuted} />
          <Text style={styles.detailText}>{item.contactNo || 'No Contact'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Students</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/students/add')}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.dark.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search students..."
            placeholderTextColor={Colors.dark.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.dark.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredStudents}
          renderItem={({ item }) => <StudentCard item={item} />}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={Colors.dark.border} />
              <Text style={styles.emptyText}>No students found</Text>
            </View>
          }
        />
      )}
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 16,
  },
  listContent: {
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    color: Colors.dark.primary,
    fontWeight: 'bold',
    fontSize: 18,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  studentId: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  gradeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gradeText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: Spacing.md,
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: Colors.dark.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: Colors.dark.textMuted,
    marginTop: Spacing.md,
    fontSize: 16,
  },
});
