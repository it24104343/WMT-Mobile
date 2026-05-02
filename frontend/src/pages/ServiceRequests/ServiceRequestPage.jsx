import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { HelpCircle, Plus, X, Clock, CheckCircle, XCircle, Loader, Calendar } from 'lucide-react';
import serviceRequestService from '../../services/serviceRequestService';
import { Spinner } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';

const REQUEST_TYPES_GROUPED = {
  common: [
    { value: 'CERTIFICATE', label: 'Course Certificate' },
    { value: 'ID_CARD_REISSUE', label: 'ID Card Reissue' },
    { value: 'FEE_INQUIRY', label: 'Fee Inquiry' },
    { value: 'SCHEDULE_CHANGE', label: 'Schedule Change' },
    { value: 'COMPLAINT', label: 'Complaint' },
    { value: 'LEAVE', label: 'Leave Request' },
    { value: 'OTHER', label: 'Other' }
  ]
};

const STATUS_STYLES = {
  PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  IN_PROGRESS: { color: 'bg-blue-100 text-blue-800', icon: Loader },
  APPROVED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  RESOLVED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REJECTED: { color: 'bg-red-100 text-red-800', icon: XCircle }
};

const ServiceRequestPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ type: 'OTHER', subject: '', description: '', priority: 'NORMAL', requestDate: '' });
  const [creating, setCreating] = useState(false);

  // Update modal (admin)
  const [showUpdate, setShowUpdate] = useState(null);
  const [updateForm, setUpdateForm] = useState({ status: '', adminNotes: '' });
  const [updating, setUpdating] = useState(false);

  useEffect(() => { 
    const delayDebounceFn = setTimeout(() => {
      fetchRequests();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [filterStatus, filterType, search, pagination.currentPage]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const r = await serviceRequestService.getServiceRequests({
        status: filterStatus || undefined, 
        type: filterType || undefined,
        search: search || undefined,
        page: pagination.currentPage, 
        limit: 15
      });
      setRequests(r.data);
      setPagination(r.pagination);
    } catch { toast.error('Failed to load requests'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.description) { toast.error('Subject and description required'); return; }
    if (form.type === 'LEAVE' && !form.requestDate) { toast.error('Request date required for leave requests'); return; }
    try {
      setCreating(true);
      await serviceRequestService.createServiceRequest(form);
      toast.success('Request submitted');
      setShowCreate(false); setForm({ type: 'OTHER', subject: '', description: '', priority: 'NORMAL', requestDate: '' });
      fetchRequests();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setCreating(false); }
  };

  const openUpdate = (req) => {
    setShowUpdate(req);
    setUpdateForm({ status: req.status, adminNotes: req.adminNotes || '' });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      await serviceRequestService.updateServiceRequest(showUpdate._id, updateForm);
      toast.success('Request updated');
      setShowUpdate(null);
      fetchRequests();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setUpdating(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Service Requests</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{isAdmin ? 'Manage student requests' : 'Submit and track your requests'}</p>
        </div>
        {!isAdmin && (
          <button onClick={() => setShowCreate(true)} className="btn btn-primary">
            <Plus className="w-5 h-5" /> New Request
          </button>
        )}
      </div>

      <div className="card mb-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full relative">
            <input 
              type="text" 
              placeholder="Search by Student Name or Request ID..." 
              value={search}
              onChange={e => { setSearch(e.target.value); setPagination(p => ({ ...p, currentPage: 1 })); }}
              className="form-input pl-10"
            />
            <HelpCircle className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          </div>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPagination(p => ({ ...p, currentPage: 1 })); }} className="form-input w-full md:w-auto min-w-[150px]">
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select value={filterType} onChange={e => { setFilterType(e.target.value); setPagination(p => ({ ...p, currentPage: 1 })); }} className="form-input w-full md:w-auto min-w-[150px]">
            <option value="">All Types</option>
            {REQUEST_TYPES_GROUPED.common.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> :
        requests.length === 0 ? (
          <div className="card text-center py-12">
            <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50">No service requests</h3>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => {
              const statusInfo = STATUS_STYLES[req.status] || STATUS_STYLES.PENDING;
              const StatusIcon = statusInfo.icon;
              return (
                <div key={req._id} className="card" onClick={() => isAdmin && openUpdate(req)} style={{ cursor: isAdmin ? 'pointer' : 'default' }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-gray-50">{req.subject}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" /> {req.status.replace('_', ' ')}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{req.type.replace('_', ' ')}</span>
                        {req.priority === 'HIGH' && <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">HIGH</span>}
                      </div>
                      <p className="text-sm text-gray-600">{req.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        {isAdmin && <span>by {req.student?.username || 'Unknown'}</span>}
                        <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                        {req.resolvedBy && <span>Resolved by {req.resolvedBy?.username}</span>}
                      </div>
                      {req.adminNotes && (
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium text-gray-500 dark:text-gray-400">Admin: </span>{req.adminNotes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: pagination.totalPages }, (_, i) => (
            <button key={i + 1} onClick={() => setPagination(p => ({ ...p, currentPage: i + 1 }))}
              className={`px-3 py-1 rounded text-sm ${pagination.currentPage === i + 1 ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{i + 1}</button>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">New Service Request</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Type</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="form-input">
                    {REQUEST_TYPES_GROUPED.common.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Priority</label>
                  <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className="form-input">
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Subject <span className="text-red-500">*</span></label>
                <input type="text" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} className="form-input" placeholder="Brief summary..." />
              </div>
              <div>
                <label className="form-label">Description <span className="text-red-500">*</span></label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="form-input" rows={4} placeholder="Detailed description..." />
              </div>
              {form.type === 'LEAVE' && (
                <div>
                  <label className="form-label">Request Date <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input type="date" value={form.requestDate} onChange={e => setForm(p => ({ ...p, requestDate: e.target.value }))} className="form-input pl-10" />
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={creating} className="btn btn-primary disabled:opacity-50">
                  {creating ? <><Spinner size="sm" /> Submitting...</> : <><Plus className="w-4 h-4" /> Submit</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Update Modal */}
      {showUpdate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Update Request</h2>
              <button onClick={() => setShowUpdate(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="font-medium text-sm text-gray-900 dark:text-white">{showUpdate.subject}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{showUpdate.description}</div>
              </div>
              {showUpdate.type === 'LEAVE' && showUpdate.requestDate && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Request Date</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{new Date(showUpdate.requestDate).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
              <div>
                <label className="form-label">Status</label>
                <select value={updateForm.status} onChange={e => setUpdateForm(p => ({ ...p, status: e.target.value }))} className="form-input">
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <div>
                <label className="form-label">Admin Notes</label>
                <textarea value={updateForm.adminNotes} onChange={e => setUpdateForm(p => ({ ...p, adminNotes: e.target.value }))} className="form-input" rows={3} placeholder="Response or notes..." />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowUpdate(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={updating} className="btn btn-primary disabled:opacity-50">
                  {updating ? <><Spinner size="sm" /> Updating...</> : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceRequestPage;





