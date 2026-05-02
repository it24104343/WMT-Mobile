import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../utils/api';

const DashboardScreen = () => {
  const { state, signOut } = useContext(AuthContext);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await apiClient.get('/dashboard/admin');
      setDashboard(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.welcome}>Welcome, {state.user?.username}!</Text>
      </View>

      {dashboard && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{dashboard.totalStudents || 0}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{dashboard.totalClasses || 0}</Text>
            <Text style={styles.statLabel}>Classes</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{dashboard.totalTeachers || 0}</Text>
            <Text style={styles.statLabel}>Teachers</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>${dashboard.totalRevenue || 0}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
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
    marginBottom: 5,
  },
  welcome: {
    fontSize: 16,
    color: '#aaa',
  },
  statsContainer: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#22c55e',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#aaa',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    marginHorizontal: 20,
    marginBottom: 40,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DashboardScreen;
