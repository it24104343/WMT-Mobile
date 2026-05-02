import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  UserCheck, Search, Download, Edit2, Trash2, Filter,
  Shield, ShieldAlert, ShieldBan, Plus
} from 'lucide-react';
import userService from '../../services/userService';
import {
  LoadingOverlay, ErrorMessage, Pagination, ConfirmDialog, Modal, EmptyState, Spinner
} from '../../components/UI';

const ROLE_TABS = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'PAPER_PANEL', label: 'Paper Panel' }
];

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });

  // Search & Filters
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  // Form modal
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formTab, setFormTab] = useState('STUDENT');
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '',
    grade: '', parentName: '', parentPhone: '',
    subjects: '', status: 'active'
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Action dialogs
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, user: null });
  const [statusDialog, setStatusDialog] = useState({ isOpen: false, user: null, newStatus: '' });

  useEffect(() => { fetchUsers(); }, [page, activeSearch, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers({
        page, limit: 10,
        search: activeSearch || undefined,
        role: roleFilter || undefined
      });
      setUsers(response.data);
      setPagination(response.pagination);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally { setLoading(false); }
  };

  const handleSearchSubmit = () => {
    setActiveSearch(searchInput);
    setPage(1);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') handleSearchSubmit();
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await userService.exportUsers({ 
        role: roleFilter || undefined,
        search: activeSearch || undefined
      });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `users_export_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click(); link.remove();
      toast.success('Export downloaded');
    } catch { toast.error('Failed to export'); }
    finally { setExporting(false); }
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormTab('STUDENT');
    setFormData({ name: '', email: '', phone: '', grade: '', parentName: '', parentPhone: '', subjects: '', status: 'active' });
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({ name: user.profileId?.name || '', email: user.email, phone: '', grade: '', parentName: '', parentPhone: '', subjects: '', status: user.status || 'active' });
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingUser(null); setFormErrors({}); };

  // Real-time name validation
  const handleNameChange = (value) => {
    setFormData(p => ({ ...p, name: value }));
    if (value && !/^[A-Za-z\s.'-]*$/.test(value)) {
      setFormErrors(p => ({ ...p, name: 'Name must contain only English letters, spaces, and basic punctuation (. \' -)' }));
    } else {
      setFormErrors(p => { const { name, ...rest } = p; return rest; });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!editingUser) {
      if (!formData.name.trim()) errors.name = 'Name is required';
      else if (!/^[A-Za-z\s.'-]+$/.test(formData.name)) errors.name = 'Name must contain only English letters';
    }
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) errors.email = 'Invalid email format';

    if (formData.phone && !/^\d{10}$/.test(formData.phone.trim())) {
      errors.phone = 'Phone number must be exactly 10 digits';
    }

    if (!editingUser && formTab === 'STUDENT') {
      if (!formData.grade.trim()) errors.grade = 'Grade is required';
      if (formData.parentPhone && !/^\d{10}$/.test(formData.parentPhone.trim())) {
        errors.parentPhone = 'Parent phone must be exactly 10 digits';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setSaving(true);
      if (editingUser) {
        await userService.updateUser(editingUser._id, { email: formData.email, status: formData.status });
        toast.success('User updated');
      } else {
        const payload = {
          name: formData.name, email: formData.email, role: formTab, phone: formData.phone
        };
        if (formTab === 'STUDENT') {
          payload.grade = formData.grade;
          payload.parentName = formData.parentName;
          payload.parentPhone = formData.parentPhone;
        }
        await userService.createUser(payload);
        toast.success('User created — credentials sent via email');
      }
      closeModal(); fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save user'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteDialog.user) return;
    try {
      await userService.deleteUser(deleteDialog.user._id);
      toast.success('User deleted'); fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  const handleStatusChange = async () => {
    if (!statusDialog.user || !statusDialog.newStatus) return;
    try {
      await userService.updateUser(statusDialog.user._id, { status: statusDialog.newStatus });
      toast.success(`User set to ${statusDialog.newStatus}`); fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading && users.length === 0) return <LoadingOverlay message="Loading users..." />;
  if (error && users.length === 0) return <ErrorMessage message={error} onRetry={fetchUsers} />;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage all system accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} disabled={exporting} className="btn btn-secondary flex items-center gap-2">
            {exporting ? <Spinner size="sm" /> : <Download className="w-5 h-5" />} Export CSV
          </button>
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus className="w-5 h-5" /> Add User
          </button>
        </div>
      </div>

      {/* Filters — search on enter/click only */}
      <div className="card mb-6 p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search by username or email..."
            className="form-input pr-10 w-full"
          />
          <button
            onClick={handleSearchSubmit}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
            title="Search"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2 min-w-[200px]">
          <Filter className="w-5 h-5 text-gray-400" />
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="form-input w-full">
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="STUDENT">Student</option>
            <option value="PAPER_PANEL">Paper Panel</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {users.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No users found"
            description={activeSearch ? 'Try adjusting your search criteria' : 'Get started by adding your first user'}
            action={!activeSearch && <button onClick={openAddModal} className="btn btn-primary"><Plus className="w-5 h-5" /> Add User</button>}
          />
        </div>
      ) : (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>User Info</th>
                  <th>Role</th>
                  <th>Linked Profile</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          u.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' :
                          u.role === 'TEACHER' ? 'bg-blue-100 text-blue-600' :
                          u.role === 'PAPER_PANEL' ? 'bg-amber-100 text-amber-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          <UserCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-50">{u.username}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'TEACHER' ? 'bg-blue-100 text-blue-700' :
                        u.role === 'PAPER_PANEL' ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      }`}>{u.role}</span>
                    </td>
                    <td>
                      {u.profileId ? (
                        <div>
                          <p className="font-medium text-sm text-gray-800">{u.profileId.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{u.profileModel}</p>
                        </div>
                      ) : <span className="text-gray-400 italic text-sm">Standalone Account</span>}
                    </td>
                    <td>
                      <span className={`flex items-center gap-1 text-sm font-medium ${
                        u.status === 'active' ? 'text-green-600' :
                        u.status === 'inactive' ? 'text-gray-500' : 'text-red-600'
                      }`}>
                        {u.status === 'active' && <Shield className="w-4 h-4" />}
                        {u.status === 'inactive' && <ShieldAlert className="w-4 h-4" />}
                        {u.status === 'blocked' && <ShieldBan className="w-4 h-4" />}
                        {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        {u.status === 'active' ? (
                          <button onClick={() => setStatusDialog({ isOpen: true, user: u, newStatus: 'blocked' })}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Block">
                            <ShieldBan className="w-4 h-4" />
                          </button>
                        ) : (
                          <button onClick={() => setStatusDialog({ isOpen: true, user: u, newStatus: 'active' })}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Reactivate">
                            <Shield className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => openEditModal(u)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteDialog({ isOpen: true, user: u })} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title={editingUser ? 'Edit User' : 'Create New User'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role tabs (only for create) */}
          {!editingUser && (
            <div className="flex border-b border-gray-200 mb-4">
              {ROLE_TABS.map(tab => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => { setFormTab(tab.value); setFormErrors({}); }}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    formTab === tab.value
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Common fields */}
          {!editingUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={`form-input w-full ${formErrors.name ? 'border-red-500' : ''}`}
                placeholder="John Doe"
              />
              {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 text-left mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
              className={`form-input w-full ${formErrors.email ? 'border-red-500' : ''}`}
              placeholder="user@example.com"
            />
            {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
          </div>

          {!editingUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 text-left mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                className={`form-input w-full ${formErrors.phone ? 'border-red-500' : ''}`}
                placeholder="07X XXX XXXX"
              />
              {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
            </div>
          )}

          {/* Student-specific fields */}
          {!editingUser && formTab === 'STUDENT' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-left mb-1">
                  Grade <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.grade}
                  onChange={(e) => setFormData(p => ({ ...p, grade: e.target.value }))}
                  className={`form-input w-full ${formErrors.grade ? 'border-red-500' : ''}`}
                  placeholder="e.g., 10, 11, A/L"
                />
                {formErrors.grade && <p className="text-red-500 text-xs mt-1">{formErrors.grade}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-left mb-1">Parent Name</label>
                <input
                  type="text"
                  value={formData.parentName}
                  onChange={(e) => setFormData(p => ({ ...p, parentName: e.target.value }))}
                  className="form-input w-full"
                  placeholder="Parent / Guardian name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 text-left mb-1">Parent Phone</label>
                <input
                  type="text"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData(p => ({ ...p, parentPhone: e.target.value }))}
                  className="form-input w-full"
                  placeholder="07X XXX XXXX"
                />
              </div>
            </>
          )}

          {/* Teacher fields removed */}

          {/* Paper Panel has no extra fields */}
          {!editingUser && formTab === 'PAPER_PANEL' && (
            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
              Paper Panel accounts only need the common fields above. They will be assigned to classes from the Paper Panel management page.
            </div>
          )}

          {/* Edit mode: status */}
          {editingUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 text-left mb-1">Account Status</label>
              <select value={formData.status} onChange={(e) => setFormData(p => ({ ...p, status: e.target.value }))} className="form-input w-full">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          )}

          <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-lg flex items-start gap-2 border border-blue-100">
            <UserCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <p>
              {editingUser
                ? "Updating will modify this user's authentication details."
                : "A username and temporary password will be generated and emailed to the user. They must reset their password on first login."}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? <><Spinner size="sm" /> Saving...</> : editingUser ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, user: null })}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Permanently delete "${deleteDialog.user?.username}"? This cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
      />

      <ConfirmDialog
        isOpen={statusDialog.isOpen}
        onClose={() => setStatusDialog({ isOpen: false, user: null, newStatus: '' })}
        onConfirm={handleStatusChange}
        title="Change Status"
        message={`Set ${statusDialog.user?.username} to '${statusDialog.newStatus}'?`}
        confirmText={`Set as ${statusDialog.newStatus}`}
        confirmVariant={statusDialog.newStatus === 'blocked' ? 'danger' : 'primary'}
      />
    </div>
  );
};

export default UserList;





