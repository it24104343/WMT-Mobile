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
import attendanceService from '../services/attendanceService';
import examService from '../services/examService';
import classService from '../services/classService';
import studentService from '../services/studentService';
import { Button, InputField, Card, ListItem } from '../components/CommonComponents';

const AttendanceExamScreen = () => {
  const [activeTab, setActiveTab] = useState('attendance');
  const [attendance, setAttendance] = useState([]);
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [attendanceForm, setAttendanceForm] = useState({
    class: '',
    date: new Date().toISOString().split('T')[0],
    students: [],
  });

  const [examForm, setExamForm] = useState({
    title: '',
    class: '',
    date: new Date().toISOString().split('T')[0],
    totalMarks: '100',
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, studentsRes] = await Promise.all([
        classService.getAllClasses(),
        studentService.getAllStudents(),
      ]);
      setClasses(classesRes.data || []);
      setStudents(studentsRes.data || []);

      if (activeTab === 'attendance') {
        const attendanceRes = await attendanceService.getAllAttendance();
        setAttendance(attendanceRes.data || []);
      } else {
        const examsRes = await examService.getAllExams();
        setExams(examsRes.data || []);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    if (!attendanceForm.class || attendanceForm.students.length === 0) {
      Alert.alert('Validation Error', 'Please select class and students');
      return;
    }

    try {
      await attendanceService.markAttendance({
        class: attendanceForm.class,
        date: attendanceForm.date,
        students: attendanceForm.students,
      });
      Alert.alert('Success', 'Attendance marked successfully');
      setShowAddModal(false);
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to mark attendance');
    }
  };

  const handleCreateExam = async () => {
    if (!examForm.title || !examForm.class) {
      Alert.alert('Validation Error', 'Title and class are required');
      return;
    }

    try {
      await examService.createExam({
        ...examForm,
        totalMarks: parseInt(examForm.totalMarks),
      });
      Alert.alert('Success', 'Exam created successfully');
      setShowAddModal(false);
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create exam');
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {activeTab === 'attendance' ? 'Attendance' : 'Exam & Performance'}
        </Text>
        <Button
          title={activeTab === 'attendance' ? '+ Mark Attendance' : '+ Create Exam'}
          onPress={() => setShowAddModal(true)}
          size="sm"
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'attendance' && styles.activeTab]}
          onPress={() => setActiveTab('attendance')}
        >
          <Text style={[styles.tabText, activeTab === 'attendance' && styles.activeTabText]}>
            Attendance
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'exam' && styles.activeTab]}
          onPress={() => setActiveTab('exam')}
        >
          <Text style={[styles.tabText, activeTab === 'exam' && styles.activeTabText]}>
            Exams
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.contentContainer}>
        {activeTab === 'attendance' ? (
          <>
            {attendance.length > 0 ? (
              attendance.map((record) => (
                <Card key={record._id}>
                  <Text style={styles.recordTitle}>
                    Date: {record.date ? record.date.split('T')[0] : 'N/A'}
                  </Text>
                  <Text style={styles.recordSubtitle}>
                    Class: {record.class?.className || 'Unknown'}
                  </Text>
                  <Text style={styles.recordDetail}>
                    Total Students: {record.students?.length || 0}
                  </Text>
                </Card>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No attendance records</Text>
              </View>
            )}
          </>
        ) : (
          <>
            {exams.length > 0 ? (
              exams.map((exam) => (
                <Card key={exam._id}>
                  <Text style={styles.recordTitle}>{exam.title}</Text>
                  <Text style={styles.recordSubtitle}>
                    Class: {exam.class?.className || 'Unknown'}
                  </Text>
                  <Text style={styles.recordDetail}>
                    Date: {exam.date ? exam.date.split('T')[0] : 'N/A'} | Total Marks: {exam.totalMarks}
                  </Text>
                </Card>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No exams created</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeTab === 'attendance' ? 'Mark Attendance' : 'Create Exam'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {activeTab === 'attendance' ? (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Class *</Text>
                    <Picker
                      selectedValue={attendanceForm.class}
                      onValueChange={(value) =>
                        setAttendanceForm({ ...attendanceForm, class: value })
                      }
                      style={styles.picker}
                    >
                      <Picker.Item label="Select Class" value="" />
                      {classes.map((cls) => (
                        <Picker.Item
                          key={cls._id}
                          label={cls.className}
                          value={cls._id}
                        />
                      ))}
                    </Picker>
                  </View>
                  <InputField
                    label="Date"
                    value={attendanceForm.date}
                    onChangeText={(text) =>
                      setAttendanceForm({ ...attendanceForm, date: text })
                    }
                  />
                  <Button
                    title="Mark Attendance"
                    onPress={handleMarkAttendance}
                    style={{ marginBottom: 20 }}
                  />
                </>
              ) : (
                <>
                  <InputField
                    label="Exam Title *"
                    placeholder="e.g., Mid Term Exam"
                    value={examForm.title}
                    onChangeText={(text) => setExamForm({ ...examForm, title: text })}
                  />
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Class *</Text>
                    <Picker
                      selectedValue={examForm.class}
                      onValueChange={(value) =>
                        setExamForm({ ...examForm, class: value })
                      }
                      style={styles.picker}
                    >
                      <Picker.Item label="Select Class" value="" />
                      {classes.map((cls) => (
                        <Picker.Item
                          key={cls._id}
                          label={cls.className}
                          value={cls._id}
                        />
                      ))}
                    </Picker>
                  </View>
                  <InputField
                    label="Date"
                    value={examForm.date}
                    onChangeText={(text) =>
                      setExamForm({ ...examForm, date: text })
                    }
                  />
                  <InputField
                    label="Total Marks"
                    placeholder="e.g., 100"
                    keyboardType="numeric"
                    value={examForm.totalMarks}
                    onChangeText={(text) =>
                      setExamForm({ ...examForm, totalMarks: text })
                    }
                  />
                  <Button
                    title="Create Exam"
                    onPress={handleCreateExam}
                    style={{ marginBottom: 20 }}
                  />
                </>
              )}
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomColor: '#3a3a5e',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomColor: '#22c55e',
    borderBottomWidth: 2,
  },
  tabText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#22c55e',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  recordSubtitle: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 4,
  },
  recordDetail: {
    fontSize: 12,
    color: '#666',
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

export default AttendanceExamScreen;
