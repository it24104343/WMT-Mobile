import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import apiClient from '../utils/api';

const ClassesScreen = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await apiClient.get('/classes');
      setClasses(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchClasses();
    setRefreshing(false);
  };

  const renderClassCard = ({ item }) => (
    <TouchableOpacity style={styles.classCard}>
      <View style={styles.classHeader}>
        <Text style={styles.className}>{item.name}</Text>
        <Text style={styles.classCode}>{item.code}</Text>
      </View>
      <View style={styles.classDetails}>
        <Text style={styles.detail}>📚 Grade: {item.grade || 'N/A'}</Text>
        <Text style={styles.detail}>👨‍🏫 Teacher: {item.teacher?.username || 'N/A'}</Text>
        <Text style={styles.detail}>💼 Capacity: {item.capacity || 'N/A'}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Classes</Text>
      </View>

      <FlatList
        data={classes}
        renderItem={renderClassCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No classes found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  classCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  classHeader: {
    marginBottom: 10,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  classCode: {
    fontSize: 12,
    color: '#22c55e',
    marginTop: 3,
  },
  classDetails: {
    marginTop: 10,
  },
  detail: {
    fontSize: 13,
    color: '#aaa',
    marginVertical: 3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
  },
});

export default ClassesScreen;
