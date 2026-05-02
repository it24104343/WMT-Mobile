import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Bell, Plus, X, Check, CheckCheck, Trash2, Send } from 'lucide-react';
import notificationService from '../../services/notificationService';
import classService from '../../services/classService';
import { Spinner } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';

const CATEGORY_STYLES = {
  INFO: 'border-l-blue-400 bg-blue-50/30',
  WARNING: 'border-l-yellow-400 bg-yellow-50/30',
  ALERT: 'border-l-red-400 bg-red-50/30',
  REMINDER: 'border-l-purple-400 bg-purple-50/30',
  SUCCESS: 'border-l-green-400 bg-green-50/30'
};

const NotificationCenter = () => {
  const { user } = useAuth();
  const canCreate = user?.role === 'ADMIN' || user?.role === 'TEACHER';

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({ title: '', content: '', category: 'INFO', targetRole: 'ALL', targetClass: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => { fetchNotifications(); }, [showUnreadOnly, pagination.currentPage]);
  useEffect(() => { if (canCreate) fetchClasses(); }, []);

  const fetchClasses = async () => {
    try { const r = await classService.getClasses({ limit: 100 }); setClasses(r.data); } catch {}
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const r = await notificationService.getNotifications({
        page: pagination.currentPage, limit: 20,
        unreadOnly: showUnreadOnly ? 'true' : undefined
      });
      setNotifications(r.data);
      setUnreadCount(r.unreadCount);
      setPagination(r.pagination);
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      toast.success('All marked as read');
      fetchNotifications();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;
    try {
      await notificationService.deleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications cleared');
    } catch { toast.error('Failed to clear notifications'); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) { toast.error('Title and content required'); return; }
    try {
      setSending(true);
      await notificationService.createNotification({
        ...form, targetClass: form.targetClass || undefined
      });
      toast.success('Notification sent');
      setShowCreate(false); setForm({ title: '', content: '', category: 'INFO', targetRole: 'ALL', targetClass: '' });
      fetchNotifications();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSending(false); }
  };

  const timeAgo = (date) => {
    const diff = (Date.now() - new Date(date).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={`btn ${showUnreadOnly ? 'btn-primary' : 'btn-secondary'} text-sm`}>
            {showUnreadOnly ? 'Show All' : 'Unread Only'}
          </button>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="btn btn-secondary text-sm">
              <CheckCheck className="w-4 h-4" /> Mark All Read
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={handleDeleteAll} className="btn btn-secondary text-sm text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          )}
          {canCreate && (
            <button onClick={() => setShowCreate(true)} className="btn btn-primary text-sm">
              <Send className="w-4 h-4" /> Send Notification
            </button>
          )}
        </div>
      </div>

      {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> :
      notifications.length === 0 ? (
        <div className="card text-center py-12">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-50">{showUnreadOnly ? 'No unread notifications' : 'No notifications'}</h3>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n._id}
              className={`card border-l-4 ${CATEGORY_STYLES[n.category] || CATEGORY_STYLES.INFO} ${!n.isRead ? 'ring-1 ring-primary-200' : 'opacity-75'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 cursor-pointer" onClick={() => !n.isRead && handleMarkRead(n._id)}>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-medium ${!n.isRead ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</h3>
                    {!n.isRead && <span className="w-2 h-2 bg-primary-500 rounded-full" />}
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{n.type}</span>
                  </div>
                  <p className="text-sm text-gray-600">{n.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{timeAgo(n.createdAt)}</span>
                    {n.createdBy?.username && <span>by {n.createdBy.username}</span>}
                    {n.targetClass?.className && <span>Class: {n.targetClass.className}</span>}
                    <span>To: {n.targetRole}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-3">
                  {!n.isRead && (
                    <button onClick={() => handleMarkRead(n._id)} className="p-1 text-gray-400 hover:text-green-600 rounded" title="Mark Read">
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(n._id)} className="p-1 text-gray-400 hover:text-red-500 rounded" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
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

      {/* Send Notification Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Send Notification</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSend} className="p-6 space-y-4">
              <div>
                <label className="form-label">Title <span className="text-red-500">*</span></label>
                <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="form-input" placeholder="Payment Reminder..." />
              </div>
              <div>
                <label className="form-label">Content <span className="text-red-500">*</span></label>
                <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} className="form-input" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="form-input">
                    <option value="INFO">Info</option><option value="WARNING">Warning</option>
                    <option value="ALERT">Alert</option><option value="REMINDER">Reminder</option>
                    <option value="SUCCESS">Success</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Target</label>
                  <select value={form.targetRole} onChange={e => setForm(p => ({ ...p, targetRole: e.target.value }))} className="form-input">
                    <option value="ALL">Everyone</option><option value="STUDENT">Students</option>
                    <option value="TEACHER">Teachers</option><option value="PAPER_PANEL">Paper Panel</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Class (optional)</label>
                <select value={form.targetClass} onChange={e => setForm(p => ({ ...p, targetClass: e.target.value }))} className="form-input">
                  <option value="">All Classes</option>
                  {classes.map(c => <option key={c._id} value={c._id}>{c.className}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={sending} className="btn btn-primary disabled:opacity-50">
                  {sending ? <><Spinner size="sm" /> Sending...</> : <><Send className="w-4 h-4" /> Send</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;


