import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Picker,
} from 'react-native';
import notificationService from '../services/notificationService';
import classService from '../services/classService';
import { Button, InputField, Card } from '../components/CommonComponents';

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetClass: '',
    priority: 'NORMAL',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [notificationsRes, classesRes] = await Promise.all([
        notificationService.getAllNotifications(),
        classService.getAllClasses(),
      ]);
      setNotifications(notificationsRes.data || []);
      setClasses(classesRes.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch notifications');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleCreateNotification = async () => {
    if (!formData.title || !formData.message) {
      Alert.alert('Validation Error', 'Title and message are required');
      return;
    }

    try {
      await notificationService.createNotification({
        ...formData,
        targetClass: formData.targetClass || undefined,
      });
      Alert.alert('Success', 'Notification sent successfully');
      resetForm();
      setShowAddModal(false);
      await fetchData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send notification');
    }
  };

  const handleDeleteNotification = (notificationId) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this notification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await notificationService.deleteNotification(notificationId);
            Alert.alert('Success', 'Notification deleted successfully');
            await fetchData();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete notification');
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      targetClass: '',
      priority: 'NORMAL',
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH':
        return '#ef4444';
      case 'NORMAL':
        return '#22c55e';
      case 'LOW':
        return '#6b7280';
      default:
        return '#22c55e';
    }
  };

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
        <Text style={styles.title}>Notifications</Text>
        <Button
          title="+ Send Notification"
          onPress={() => {
            resetForm();
            setShowAddModal(true);
          }}
          size="sm"
        />
      </View>

      <Card style={styles.statsCard}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{notifications.length}</Text>
            <Text style={styles.statLabel}>Total Notifications</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {notifications.filter(n => !n.isRead).length}
            </Text>
            <Text style={styles.statLabel}>Unread</Text>
          </View>
        </View>
      </Card>

      <ScrollView
        style={styles.listContainer}
        refreshControl={{
          refreshing,
          onRefresh,
          tintColor: '#22c55e',
        }}
      >
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <Card
              key={notification._id}
              style={[
                styles.notificationCard,
                !notification.isRead && styles.unreadCard,
              ]}
            >
              <View style={styles.notificationHeader}>
                <View style={styles.notificationMeta}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <View style={styles.metaRow}>
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityColor(notification.priority) },
                      ]}
                    >
                      <Text style={styles.priorityText}>{notification.priority}</Text>
                    </View>
                    {notification.targetClass && (
                      <Text style={styles.metaText}>
                        Class: {notification.targetClass?.className || 'N/A'}
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteNotification(notification._id)}
                  style={styles.deleteBtn}
                >
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              <Text style={styles.notificationDate}>
                {new Date(notification.createdAt).toLocaleDateString()}
              </Text>
            </Card>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No notifications yet</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Notification</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <InputField
                label="Title *"
                placeholder="Notification title"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
              />
              <InputField
                label="Message *"
                placeholder="Notification message"
                value={formData.message}
                onChangeText={(text) => setFormData({ ...formData, message: text })}
                multiline
              />
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Target Class (Optional)</Text>
                <Picker
                  selectedValue={formData.targetClass}
                  onValueChange={(value) =>
                    setFormData({ ...formData, targetClass: value })
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="All Students" value="" />
                  {classes.map((cls) => (
                    <Picker.Item
                      key={cls._id}
                      label={cls.className}
                      value={cls._id}
                    />
                  ))}
                </Picker>
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Priority</Text>
                <Picker
                  selectedValue={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value })
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="Low" value="LOW" />
                  <Picker.Item label="Normal" value="NORMAL" />
                  <Picker.Item label="High" value="HIGH" />
                </Picker>
              </View>
              <Button
                title="Send Notification"
                onPress={handleCreateNotification}
                style={{ marginBottom: 20 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#22c55e',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#aaa',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  notificationCard: {
    borderLeftColor: '#22c55e',
  },
  unreadCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderLeftColor: '#22c55e',
    borderLeftWidth: 4,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  notificationMeta: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  metaText: {
    fontSize: 11,
    color: '#aaa',
  },
  deleteBtn: {
    padding: 8,
  },
  deleteBtnText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationDate: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#aaa',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '95%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomColor: '#3a3a5e',
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    fontSize: 24,
    color: '#999',
    fontWeight: '600',
  },
  modalBody: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  picker: {
    backgroundColor: '#16213e',
    color: '#fff',
    borderColor: '#3a3a5e',
    borderWidth: 1,
    borderRadius: 8,
  },
});

export default NotificationsScreen;
