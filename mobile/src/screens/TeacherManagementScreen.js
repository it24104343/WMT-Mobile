import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import teacherService from '../services/teacherService';
import { Button, InputField, Card, ListItem } from '../components/CommonComponents';

const TeacherManagementScreen = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subjects: '',
    qualification: '',
    experience: '',
    address: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await teacherService.getAllTeachers();
      setTeachers(res.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch teachers');
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

  const handleAddTeacher = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert('Validation Error', 'Name and email are required');
      return;
    }

    try {
      await teacherService.createTeacher({
        ...formData,
        subjects: formData.subjects.split(',').map(s => s.trim()),
      });
      Alert.alert('Success', 'Teacher added successfully');
      resetForm();
      setShowAddModal(false);
      await fetchData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add teacher');
    }
  };

  const handleEditTeacher = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert('Validation Error', 'Name and email are required');
      return;
    }

    try {
      await teacherService.updateTeacher(selectedTeacher._id, {
        ...formData,
        subjects: formData.subjects.split(',').map(s => s.trim()),
      });
      Alert.alert('Success', 'Teacher updated successfully');
      resetForm();
      setShowEditModal(false);
      await fetchData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update teacher');
    }
  };

  const handleDeleteTeacher = (teacherId) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this teacher?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await teacherService.deleteTeacher(teacherId);
            Alert.alert('Success', 'Teacher deleted successfully');
            await fetchData();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete teacher');
          }
        },
      },
    ]);
  };

  const openEditModal = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone || '',
      subjects: (teacher.subjects || []).join(', '),
      qualification: teacher.qualification || '',
      experience: teacher.experience || '',
      address: teacher.address || '',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      subjects: '',
      qualification: '',
      experience: '',
      address: '',
    });
  };

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderForm = () => (
    <View style={styles.formContainer}>
      <InputField
        label="Name *"
        placeholder="Teacher name"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
      />
      <InputField
        label="Email *"
        placeholder="teacher@email.com"
        keyboardType="email-address"
        value={formData.email}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
      />
      <InputField
        label="Phone"
        placeholder="+94771234567"
        keyboardType="phone-pad"
        value={formData.phone}
        onChangeText={(text) => setFormData({ ...formData, phone: text })}
      />
      <InputField
        label="Subjects (comma-separated)"
        placeholder="e.g., Mathematics, Physics"
        value={formData.subjects}
        onChangeText={(text) => setFormData({ ...formData, subjects: text })}
      />
      <InputField
        label="Qualification"
        placeholder="e.g., B.Sc, M.Sc"
        value={formData.qualification}
        onChangeText={(text) => setFormData({ ...formData, qualification: text })}
      />
      <InputField
        label="Experience (years)"
        placeholder="e.g., 5"
        keyboardType="numeric"
        value={formData.experience}
        onChangeText={(text) => setFormData({ ...formData, experience: text })}
      />
      <InputField
        label="Address"
        placeholder="Teacher address"
        value={formData.address}
        onChangeText={(text) => setFormData({ ...formData, address: text })}
        multiline
      />
    </View>
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
        <Text style={styles.title}>Teacher Management</Text>
        <Button
          title="+ Add Teacher"
          onPress={() => {
            resetForm();
            setShowAddModal(true);
          }}
          size="sm"
        />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search teachers..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <Card>
        <Text style={styles.totalText}>Total Teachers: {teachers.length}</Text>
      </Card>

      <ScrollView
        style={styles.listContainer}
        refreshControl={{
          refreshing,
          onRefresh,
          tintColor: '#22c55e',
        }}
      >
        {filteredTeachers.length > 0 ? (
          filteredTeachers.map((teacher) => (
            <ListItem
              key={teacher._id}
              title={teacher.name}
              subtitle={`${teacher.email} | ${(teacher.subjects || []).join(', ') || 'No subjects'}`}
              actionButtons={
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    onPress={() => openEditModal(teacher)}
                    style={styles.actionBtn}
                  >
                    <Text style={styles.actionBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteTeacher(teacher._id)}
                    style={[styles.actionBtn, styles.dangerBtn]}
                  >
                    <Text style={styles.actionBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No teachers found</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Teacher</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {renderForm()}
              <Button
                title="Add Teacher"
                onPress={handleAddTeacher}
                style={{ marginBottom: 20 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Teacher</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {renderForm()}
              <Button
                title="Update Teacher"
                onPress={handleEditTeacher}
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
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#16213e',
    borderColor: '#3a3a5e',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  totalText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#22c55e',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  dangerBtn: {
    backgroundColor: '#ef4444',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    paddingVertical: 40,
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
  formContainer: {
    marginBottom: 20,
  },
});

export default TeacherManagementScreen;
