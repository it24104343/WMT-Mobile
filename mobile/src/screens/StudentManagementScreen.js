import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import studentService from '../services/studentService';
import classService from '../services/classService';
import {
  Button,
  InputField,
  Card,
  ListItem,
  StatusBadge,
} from '../components/CommonComponents';

const StudentManagementScreen = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    grade: '',
    parentName: '',
    parentPhone: '',
    dob: '',
    class: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, classesRes] = await Promise.all([
        studentService.getAllStudents(),
        classService.getAllClasses(),
      ]);
      setStudents(studentsRes.data || []);
      setClasses(classesRes.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch data');
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

  const handleAddStudent = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert('Validation Error', 'Name and email are required');
      return;
    }

    try {
      await studentService.createStudent(formData);
      Alert.alert('Success', 'Student added successfully');
      resetForm();
      setShowAddModal(false);
      await fetchData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add student');
    }
  };

  const handleEditStudent = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert('Validation Error', 'Name and email are required');
      return;
    }

    try {
      await studentService.updateStudent(selectedStudent._id, formData);
      Alert.alert('Success', 'Student updated successfully');
      resetForm();
      setShowEditModal(false);
      await fetchData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update student');
    }
  };

  const handleDeleteStudent = (studentId) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this student?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await studentService.deleteStudent(studentId);
            Alert.alert('Success', 'Student deleted successfully');
            await fetchData();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete student');
          }
        },
      },
    ]);
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      phone: student.phone || '',
      grade: student.grade || '',
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
      dob: student.dob || '',
      class: student.class || '',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      grade: '',
      parentName: '',
      parentPhone: '',
      dob: '',
      class: '',
    });
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderForm = () => (
    <View style={styles.formContainer}>
      <InputField
        label="Name *"
        placeholder="Student name"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
      />
      <InputField
        label="Email *"
        placeholder="student@email.com"
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
        label="Grade"
        placeholder="e.g., 10, 11, 12"
        value={formData.grade}
        onChangeText={(text) => setFormData({ ...formData, grade: text })}
      />
      <InputField
        label="Parent Name"
        placeholder="Parent/Guardian name"
        value={formData.parentName}
        onChangeText={(text) => setFormData({ ...formData, parentName: text })}
      />
      <InputField
        label="Parent Phone"
        placeholder="+94771234567"
        keyboardType="phone-pad"
        value={formData.parentPhone}
        onChangeText={(text) => setFormData({ ...formData, parentPhone: text })}
      />
      <InputField
        label="Date of Birth"
        placeholder="YYYY-MM-DD"
        value={formData.dob}
        onChangeText={(text) => setFormData({ ...formData, dob: text })}
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Student Management</Text>
        <Button
          title="+ Add Student"
          onPress={() => {
            resetForm();
            setShowAddModal(true);
          }}
          size="sm"
        />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search students..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stats */}
      <Card>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{students.length}</Text>
            <Text style={styles.statLabel}>Total Students</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{classes.length}</Text>
            <Text style={styles.statLabel}>Total Classes</Text>
          </View>
        </View>
      </Card>

      {/* Students List */}
      <ScrollView
        style={styles.listContainer}
        onMomentumScrollEnd={() => {
          // Can add pagination here
        }}
        refreshControl={{
          refreshing,
          onRefresh,
          tintColor: '#22c55e',
        }}
      >
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <ListItem
              key={student._id}
              title={student.name}
              subtitle={`${student.email} | Grade: ${student.grade || 'N/A'}`}
              onPress={() => {
                // Can navigate to student detail screen
              }}
              actionButtons={
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    onPress={() => openEditModal(student)}
                    style={styles.actionBtn}
                  >
                    <Text style={styles.actionBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteStudent(student._id)}
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
            <Text style={styles.emptyStateText}>No students found</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Student</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {renderForm()}
              <Button
                title="Add Student"
                onPress={handleAddStudent}
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
              <Text style={styles.modalTitle}>Edit Student</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {renderForm()}
              <Button
                title="Update Student"
                onPress={handleEditStudent}
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#22c55e',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#aaa',
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

export default StudentManagementScreen;
