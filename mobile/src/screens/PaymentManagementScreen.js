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
import paymentService from '../services/paymentService';
import studentService from '../services/studentService';
import { Button, InputField, Card, ListItem, StatusBadge } from '../components/CommonComponents';

const PaymentManagementScreen = () => {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const [formData, setFormData] = useState({
    student: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    status: 'PENDING',
    type: 'MONTHLY_FEE',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, studentsRes] = await Promise.all([
        paymentService.getAllPayments(),
        studentService.getAllStudents(),
      ]);
      setPayments(paymentsRes.data || []);
      setStudents(studentsRes.data || []);
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

  const handleAddPayment = async () => {
    if (!formData.student || !formData.amount) {
      Alert.alert('Validation Error', 'Student and amount are required');
      return;
    }

    try {
      await paymentService.createPayment({
        ...formData,
        studentId: formData.student,
        amount: parseFloat(formData.amount),
      });
      Alert.alert('Success', 'Payment recorded successfully');
      resetForm();
      setShowAddModal(false);
      await fetchData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to record payment');
    }
  };

  const handleEditPayment = async () => {
    if (!formData.student || !formData.amount) {
      Alert.alert('Validation Error', 'Student and amount are required');
      return;
    }

    try {
      await paymentService.updatePayment(selectedPayment._id, {
        ...formData,
        studentId: formData.student,
        amount: parseFloat(formData.amount),
      });
      Alert.alert('Success', 'Payment updated successfully');
      resetForm();
      setShowEditModal(false);
      await fetchData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update payment');
    }
  };

  const handleDeletePayment = (paymentId) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this payment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await paymentService.deletePayment(paymentId);
            Alert.alert('Success', 'Payment deleted successfully');
            await fetchData();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete payment');
          }
        },
      },
    ]);
  };

  const openEditModal = (payment) => {
    setSelectedPayment(payment);
    setFormData({
      student: payment.student?._id || payment.studentId || '',
      amount: String(payment.amount || ''),
      date: payment.date?.split('T')[0] || new Date().toISOString().split('T')[0],
      status: payment.status || 'PENDING',
      type: payment.type || 'MONTHLY_FEE',
      notes: payment.notes || '',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      student: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      type: 'MONTHLY_FEE',
      notes: '',
    });
  };

  const filteredPayments = payments.filter(
    (payment) =>
      payment.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.student?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStudentName = (studentId) => {
    const student = students.find(s => s._id === studentId);
    return student ? student.name : 'Unknown';
  };

  const getTotalRevenue = () => {
    return payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  };

  const getPendingAmount = () => {
    return payments
      .filter(p => p.status === 'PENDING')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  };

  const renderForm = () => (
    <View style={styles.formContainer}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Student *</Text>
        <Picker
          selectedValue={formData.student}
          onValueChange={(value) => setFormData({ ...formData, student: value })}
          style={styles.picker}
        >
          <Picker.Item label="Select Student" value="" />
          {students.map((student) => (
            <Picker.Item key={student._id} label={student.name} value={student._id} />
          ))}
        </Picker>
      </View>
      <InputField
        label="Amount *"
        placeholder="e.g., 3000"
        keyboardType="numeric"
        value={formData.amount}
        onChangeText={(text) => setFormData({ ...formData, amount: text })}
      />
      <InputField
        label="Date"
        placeholder="YYYY-MM-DD"
        value={formData.date}
        onChangeText={(text) => setFormData({ ...formData, date: text })}
      />
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Status</Text>
        <Picker
          selectedValue={formData.status}
          onValueChange={(value) => setFormData({ ...formData, status: value })}
          style={styles.picker}
        >
          <Picker.Item label="Pending" value="PENDING" />
          <Picker.Item label="Paid" value="PAID" />
          <Picker.Item label="Failed" value="FAILED" />
        </Picker>
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Type</Text>
        <Picker
          selectedValue={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value })}
          style={styles.picker}
        >
          <Picker.Item label="Monthly Fee" value="MONTHLY_FEE" />
          <Picker.Item label="Registration Fee" value="REGISTRATION_FEE" />
          <Picker.Item label="Other" value="OTHER" />
        </Picker>
      </View>
      <InputField
        label="Notes"
        placeholder="Payment notes..."
        value={formData.notes}
        onChangeText={(text) => setFormData({ ...formData, notes: text })}
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
        <Text style={styles.title}>Payment Management</Text>
        <Button
          title="+ Record Payment"
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
          placeholder="Search payments..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Statistics Cards */}
      <ScrollView horizontal style={styles.statsScroll} showsHorizontalScrollIndicator={false}>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Total Revenue</Text>
          <Text style={styles.statValue}>Rs.{getTotalRevenue()}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Pending Amount</Text>
          <Text style={styles.statValue}>Rs.{getPendingAmount()}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Total Payments</Text>
          <Text style={styles.statValue}>{payments.length}</Text>
        </Card>
      </ScrollView>

      <ScrollView
        style={styles.listContainer}
        refreshControl={{
          refreshing,
          onRefresh,
          tintColor: '#22c55e',
        }}
      >
        {filteredPayments.length > 0 ? (
          filteredPayments.map((payment) => (
            <ListItem
              key={payment._id}
              title={getStudentName(payment.student?._id || payment.studentId)}
              subtitle={`Rs.${payment.amount} | ${payment.date} | ${payment.type}`}
              actionButtons={
                <View style={styles.actionButtonsContainer}>
                  <StatusBadge status={payment.status?.toLowerCase() || 'pending'} />
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      onPress={() => openEditModal(payment)}
                      style={styles.actionBtn}
                    >
                      <Text style={styles.actionBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeletePayment(payment._id)}
                      style={[styles.actionBtn, styles.dangerBtn]}
                    >
                      <Text style={styles.actionBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              }
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No payments found</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Payment</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {renderForm()}
              <Button
                title="Record Payment"
                onPress={handleAddPayment}
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
              <Text style={styles.modalTitle}>Edit Payment</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {renderForm()}
              <Button
                title="Update Payment"
                onPress={handleEditPayment}
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
  statsScroll: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    marginRight: 12,
    minWidth: 150,
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22c55e',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  actionButtonsContainer: {
    alignItems: 'flex-end',
    gap: 8,
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

export default PaymentManagementScreen;
