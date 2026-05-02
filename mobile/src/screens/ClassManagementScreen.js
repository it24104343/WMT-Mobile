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
  Picker,
} from 'react-native';
import classService from '../services/classService';
import teacherService from '../services/teacherService';
import { Button, InputField, Card, ListItem } from '../components/CommonComponents';

const ClassManagementScreen = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  const [formData, setFormData] = useState({
    className: '',
    grade: '',
    subject: '',
    teacher: '',
    capacity: '',
    schedule: '',
    fee: '',
    mode: 'PHYSICAL',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, teachersRes] = await Promise.all([
        classService.getAllClasses(),
        teacherService.getAllTeachers(),
      ]);
      setClasses(classesRes.data || []);
      setTeachers(teachersRes.data || []);
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

  const handleAddClass = async () => {
    if (!formData.className || !formData.grade || !formData.teacher) {
      Alert.alert('Validation Error', 'Class name, grade, and teacher are required');
      return;
    }

    try {
      await classService.createClass(formData);
      Alert.alert('Success', 'Class added successfully');
      resetForm();
      setShowAddModal(false);
      await fetchData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add class');
    }
  };

  const handleEditClass = async () => {
    if (!formData.className || !formData.grade || !formData.teacher) {
      Alert.alert('Validation Error', 'Class name, grade, and teacher are required');
      return;
    }

    try {
      await classService.updateClass(selectedClass._id, formData);
      Alert.alert('Success', 'Class updated successfully');
      resetForm();
      setShowEditModal(false);
      await fetchData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update class');
    }
  };

  const handleDeleteClass = (classId) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this class?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await classService.deleteClass(classId);
            Alert.alert('Success', 'Class deleted successfully');
            await fetchData();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete class');
          }
        },
      },
    ]);
  };

  const openEditModal = (cls) => {
    setSelectedClass(cls);
    setFormData({
      className: cls.className,
      grade: cls.grade,
      subject: cls.subject || '',
      teacher: cls.teacher?._id || cls.teacher || '',
      capacity: String(cls.capacity || ''),
      schedule: cls.schedule || '',
      fee: String(cls.monthlyFee || ''),
      mode: cls.mode || 'PHYSICAL',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      className: '',
      grade: '',
      subject: '',
      teacher: '',
      capacity: '',
      schedule: '',
      fee: '',
      mode: 'PHYSICAL',
    });
  };

  const filteredClasses = classes.filter(
    (cls) =>
      cls.className?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.grade?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t._id === teacherId);
    return teacher ? teacher.name : 'Unknown';
  };

  const renderForm = () => (
    <View style={styles.formContainer}>
      <InputField
        label="Class Name *"
        placeholder="e.g., Advanced Mathematics"
        value={formData.className}
        onChangeText={(text) => setFormData({ ...formData, className: text })}
      />
      <InputField
        label="Grade *"
        placeholder="e.g., 12"
        value={formData.grade}
        onChangeText={(text) => setFormData({ ...formData, grade: text })}
      />
      <InputField
        label="Subject"
        placeholder="e.g., Mathematics"
        value={formData.subject}
        onChangeText={(text) => setFormData({ ...formData, subject: text })}
      />
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Teacher *</Text>
        <Picker
          selectedValue={formData.teacher}
          onValueChange={(value) => setFormData({ ...formData, teacher: value })}
          style={styles.picker}
        >
          <Picker.Item label="Select Teacher" value="" />
          {teachers.map((teacher) => (
            <Picker.Item key={teacher._id} label={teacher.name} value={teacher._id} />
          ))}
        </Picker>
      </View>
      <InputField
        label="Capacity"
        placeholder="e.g., 30"
        keyboardType="numeric"
        value={formData.capacity}
        onChangeText={(text) => setFormData({ ...formData, capacity: text })}
      />
      <InputField
        label="Monthly Fee"
        placeholder="e.g., 3000"
        keyboardType="numeric"
        value={formData.fee}
        onChangeText={(text) => setFormData({ ...formData, fee: text })}
      />
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Mode</Text>
        <Picker
          selectedValue={formData.mode}
          onValueChange={(value) => setFormData({ ...formData, mode: value })}
          style={styles.picker}
        >
          <Picker.Item label="Physical" value="PHYSICAL" />
          <Picker.Item label="Online" value="ONLINE" />
          <Picker.Item label="Hybrid" value="HYBRID" />
        </Picker>
      </View>
      <InputField
        label="Schedule"
        placeholder="e.g., Monday, 2:00 PM"
        value={formData.schedule}
        onChangeText={(text) => setFormData({ ...formData, schedule: text })}
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
        <Text style={styles.title}>Class Management</Text>
        <Button
          title="+ Add Class"
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
          placeholder="Search classes..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <Card>
        <Text style={styles.totalText}>Total Classes: {classes.length}</Text>
      </Card>

      <ScrollView
        style={styles.listContainer}
        refreshControl={{
          refreshing,
          onRefresh,
          tintColor: '#22c55e',
        }}
      >
        {filteredClasses.length > 0 ? (
          filteredClasses.map((cls) => (
            <ListItem
              key={cls._id}
              title={cls.className}
              subtitle={`Grade ${cls.grade} | Teacher: ${getTeacherName(cls.teacher?._id || cls.teacher)} | Fee: Rs.${cls.monthlyFee || 0}`}
              actionButtons={
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    onPress={() => openEditModal(cls)}
                    style={styles.actionBtn}
                  >
                    <Text style={styles.actionBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteClass(cls._id)}
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
            <Text style={styles.emptyStateText}>No classes found</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Class</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {renderForm()}
              <Button
                title="Add Class"
                onPress={handleAddClass}
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
              <Text style={styles.modalTitle}>Edit Class</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {renderForm()}
              <Button
                title="Update Class"
                onPress={handleEditClass}
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

export default ClassManagementScreen;
