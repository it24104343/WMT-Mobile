import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  DollarSign,
  Search,
  Plus,
  RefreshCw,
  X,
  Clock,
  CreditCard,
  Banknote,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Edit2,
  Trash2
} from 'lucide-react';
import paymentService from '../../services/paymentService';
import enrollmentService from '../../services/enrollmentService';
import classService from '../../services/classService';
import { Spinner, ConfirmDialog } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const PaymentList = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: '',
    page: 1
  });

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    confirmVariant: 'danger'
  });
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });

  // Record payment modal
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [classes, setClasses] = useState([]);
  const [classEnrollments, setClassEnrollments] = useState([]);
  const [recordForm, setRecordForm] = useState({
    enrollmentId: '',
    classId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: '',
    paymentMethod: 'CASH',
    notes: ''
  });
  const [recording, setRecording] = useState(false);

  // Edit payment modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    amount: '',
    paymentMethod: 'CASH',
    status: 'COMPLETED',
    notes: ''
  });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [filters.page, filters.month, filters.year, filters.status]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      let response;
      
      if (user?.role === 'STUDENT') {
        response = await paymentService.getStudentPayments(user.profileId, {
          month: filters.month || undefined,
          year: filters.year || undefined
        });
        // Student endpoint might return a different structure, let's normalize
        setPayments(response.data);
        setPagination({ currentPage: 1, totalPages: 1, totalItems: response.data.length });
      } else {
        response = await paymentService.getPayments({
          page: filters.page,
          limit: 20,
          month: filters.month || undefined,
          year: filters.year || undefined,
          status: filters.status || undefined
        });
        setPayments(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const openRecordModal = async () => {
    try {
      const classRes = await classService.getClasses({ limit: 100 });
      setClasses(classRes.data);
      setRecordForm({
        enrollmentId: '',
        classId: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        amount: '',
        paymentMethod: 'CASH',
        notes: ''
      });
      setClassEnrollments([]);
      setShowRecordModal(true);
    } catch (err) {
      toast.error('Failed to load classes');
    }
  };

  const handleClassSelect = async (classId) => {
    setRecordForm(prev => ({ ...prev, classId, enrollmentId: '' }));
    if (!classId) {
      setClassEnrollments([]);
      return;
    }
    try {
      const response = await enrollmentService.getClassEnrollments(classId);
      setClassEnrollments(response.data);
      // Set default amount from class monthly fee
      const selectedClass = classes.find(c => c._id === classId);
      if (selectedClass) {
        setRecordForm(prev => ({ ...prev, amount: selectedClass.monthlyFee?.toString() || '' }));
      }
    } catch (err) {
      toast.error('Failed to load class enrollments');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!recordForm.enrollmentId) {
      toast.error('Please select an enrollment');
      return;
    }
    try {
      setRecording(true);
      await paymentService.recordPayment({
        enrollmentId: recordForm.enrollmentId,
        month: parseInt(recordForm.month),
        year: parseInt(recordForm.year),
        amount: parseFloat(recordForm.amount) || undefined,
        paymentMethod: recordForm.paymentMethod,
        notes: recordForm.notes
      });
      toast.success('Payment recorded successfully');
      setShowRecordModal(false);
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setRecording(false);
    }
  };

  const handleRefund = (paymentId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Refund Payment',
      message: 'Are you sure you want to refund this payment?',
      confirmText: 'Refund',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await paymentService.refundPayment(paymentId);
          toast.success('Payment refunded');
          fetchPayments();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to refund');
        }
      }
    });
  };

  const getBackendUrl = (path) => {
    if (!path) return '';
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    if (base.startsWith('http')) {
      return base.replace('/api', '') + path;
    }
    if (window.location.hostname === 'localhost') {
      return `http://localhost:5000${path}`;
    }
    return path;
  };

  const handleApproveTransfer = (paymentId, action) => {
    setConfirmDialog({
      isOpen: true,
      title: `${action === 'approve' ? 'Approve' : 'Reject'} Transfer`,
      message: `Are you sure you want to ${action} this bank transfer?`,
      confirmText: action === 'approve' ? 'Approve' : 'Reject',
      confirmVariant: action === 'approve' ? 'success' : 'danger',
      onConfirm: async () => {
        try {
          await paymentService.approveBankTransfer(paymentId, action);
          toast.success(`Payment ${action === 'approve' ? 'approved' : 'rejected'}`);
          fetchPayments();
        } catch (err) {
          toast.error(err.response?.data?.message || `Failed to ${action} payment`);
        }
      }
    });
  };

  const openEditModal = (payment) => {
    setEditForm({
      id: payment._id,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      notes: payment.notes || ''
    });
    setShowEditModal(true);
  };

  const handleEditPayment = async (e) => {
    e.preventDefault();
    if (!editForm.amount || editForm.amount < 0) return toast.error('Valid amount is required');

    setEditing(true);
    try {
      await paymentService.updatePayment(editForm.id, {
        amount: editForm.amount,
        paymentMethod: editForm.paymentMethod,
        status: editForm.status,
        notes: editForm.notes
      });
      toast.success('Payment updated successfully');
      setShowEditModal(false);
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update payment');
    } finally {
      setEditing(false);
    }
  };

  const handleDeletePayment = (paymentId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Payment',
      message: 'Are you sure you want to delete this payment? This action cannot be undone.',
      confirmText: 'Delete Payment',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await paymentService.deletePayment(paymentId);
          toast.success('Payment deleted successfully');
          fetchPayments();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to delete payment');
        }
      }
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'FAILED': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'REFUNDED': return <RefreshCw className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      COMPLETED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-orange-100 text-orange-800',
      PENDING: 'bg-yellow-100 text-yellow-800'
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.PENDING}`}>
        {getStatusIcon(status)}
        {status}
      </span>
    );
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'GATEWAY': return <CreditCard className="w-4 h-4" />;
      case 'CASH': return <Banknote className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  if (loading && payments.length === 0) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Payments</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {user?.role === 'STUDENT' ? 'View your fee payment history' : 'Track and manage student fee payments'}
          </p>
        </div>
        {user?.role === 'ADMIN' && (
          <button onClick={openRecordModal} className="btn btn-primary">
            <Plus className="w-5 h-5" />
            Record Payment
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-6 overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-2 min-w-max">
            <DollarSign className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Filters:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 flex-1">
            <select
              value={filters.month}
              onChange={(e) => setFilters(f => ({ ...f, month: e.target.value, page: 1 }))}
              className="form-input w-full sm:w-auto min-w-[140px]"
            >
              <option value="">All Months</option>
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>

            <input
              type="number"
              value={filters.year}
              onChange={(e) => setFilters(f => ({ ...f, year: e.target.value, page: 1 }))}
              className="form-input w-full sm:w-24"
              min="2020"
              placeholder="Year"
            />

            <select
              value={filters.status}
              onChange={(e) => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
              className="form-input w-full sm:w-auto min-w-[130px]"
            >
              <option value="">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>

            {(filters.month !== new Date().getMonth() + 1 || filters.year != (new Date().getFullYear()) || filters.status) && (
              <button
                onClick={() => setFilters({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), status: '', page: 1 })}
                className="text-sm font-medium text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      {payments.length === 0 ? (
        <div className="card text-center py-12">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50">No payments found</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Payments will appear here once recorded</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Period</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Paid At</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id}>
                    <td>
                      {payment.paymentType === 'TEACHER_REGISTRATION' ? (
                        <>
                          <div className="font-medium text-purple-900">{payment.teacher?.name} (Teacher)</div>
                          <div className="text-xs text-purple-500">{payment.teacher?.email}</div>
                        </>
                      ) : (
                        <>
                          <div className="font-medium text-gray-900 dark:text-gray-50">{payment.student?.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{payment.student?.email}</div>
                        </>
                      )}
                    </td>
                    <td>
                      {payment.paymentType === 'TEACHER_REGISTRATION' ? (
                        <div className="font-medium">Registration Fee</div>
                      ) : (
                        <>
                          <div className="font-medium">{payment.class?.className}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{payment.class?.subject}</div>
                        </>
                      )}
                    </td>
                    <td className="text-sm">
                      {payment.paymentType === 'TEACHER_REGISTRATION' ? (
                        'One-time'
                      ) : (
                        `${MONTHS[payment.month - 1]} ${payment.year}`
                      )}
                    </td>
                    <td className="font-medium">
                      LKR {payment.amount?.toLocaleString()}
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        {getMethodIcon(payment.paymentMethod)}
                        {payment.paymentMethod}
                      </div>
                    </td>
                    <td>{getStatusBadge(payment.status)}</td>
                    <td className="text-sm text-gray-500 dark:text-gray-400">
                      {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : '-'}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        {user?.role === 'ADMIN' && (
                          <>
                            <button
                              onClick={() => openEditModal(payment)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePayment(payment._id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {payment.status === 'COMPLETED' && user?.role === 'ADMIN' && (
                          <button
                            onClick={() => handleRefund(payment._id)}
                            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                            title="Refund"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        {payment.receiptUrl && (
                          <button
                            onClick={() => window.open(getBackendUrl(payment.receiptUrl), '_blank')}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="View Receipt"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )}
                        {payment.status === 'PENDING' && payment.paymentMethod === 'BANK_TRANSFER' && user?.role === 'ADMIN' && (
                          <>
                            <button
                              onClick={() => handleApproveTransfer(payment._id, 'approve')}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleApproveTransfer(payment._id, 'reject')}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: pagination.totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setFilters(f => ({ ...f, page: i + 1 }))}
                  className={`px-3 py-1 rounded text-sm ${
                    pagination.currentPage === i + 1 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}

          <div className="text-center text-sm text-gray-500 mt-2">
            Showing {payments.length} of {pagination.totalItems} payments
          </div>
        </>
      )}

      {/* Record Payment Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Record Payment</h2>
              <button onClick={() => setShowRecordModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div>
                <label className="form-label">Class <span className="text-red-500">*</span></label>
                <select
                  value={recordForm.classId}
                  onChange={(e) => handleClassSelect(e.target.value)}
                  className="form-input"
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.className} — LKR {c.monthlyFee}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Student (Enrollment) <span className="text-red-500">*</span></label>
                <select
                  value={recordForm.enrollmentId}
                  onChange={(e) => setRecordForm(prev => ({ ...prev, enrollmentId: e.target.value }))}
                  className="form-input"
                  disabled={!recordForm.classId}
                >
                  <option value="">Select Student</option>
                  {classEnrollments.map((e) => (
                    <option key={e._id} value={e._id}>{e.student?.name} (Grade {e.student?.grade})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Month</label>
                  <select
                    value={recordForm.month}
                    onChange={(e) => setRecordForm(prev => ({ ...prev, month: e.target.value }))}
                    className="form-input"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Year</label>
                  <input
                    type="number"
                    value={recordForm.year}
                    onChange={(e) => setRecordForm(prev => ({ ...prev, year: e.target.value }))}
                    className="form-input"
                    min="2020"
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Amount (LKR)</label>
                <input
                  type="number"
                  value={recordForm.amount}
                  onChange={(e) => setRecordForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="form-input"
                  placeholder="Leave blank to use class monthly fee"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="form-label">Payment Method</label>
                <select
                  value={recordForm.paymentMethod}
                  onChange={(e) => setRecordForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="form-input"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="MANUAL">Manual Entry</option>
                </select>
              </div>
              <div>
                <label className="form-label">Notes</label>
                <textarea
                  value={recordForm.notes}
                  onChange={(e) => setRecordForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="form-input"
                  placeholder="Optional notes..."
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowRecordModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={recording} className="btn btn-primary disabled:opacity-50">
                  {recording ? <><Spinner size="sm" /> Recording...</> : <><DollarSign className="w-4 h-4" /> Record Payment</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Payment</h2>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditPayment} className="p-6 space-y-4">
              <div>
                <label className="form-label">Amount (LKR) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={editForm.amount}
                  onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="form-input"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="form-label">Payment Method</label>
                <select
                  value={editForm.paymentMethod}
                  onChange={(e) => setEditForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="form-input"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="MANUAL">Manual Entry</option>
                  <option value="GATEWAY">Gateway</option>
                </select>
              </div>
              <div>
                <label className="form-label">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  className="form-input"
                >
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>
              <div>
                <label className="form-label">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="form-input"
                  placeholder="Optional notes..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={editing} 
                  className="btn btn-primary disabled:opacity-50"
                >
                  {editing ? <><Spinner size="sm" /> Saving...</> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        {...confirmDialog}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

export default PaymentList;






