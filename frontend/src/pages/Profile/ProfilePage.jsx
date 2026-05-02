import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import profileService from '../../services/profileService';
import enrollmentService from '../../services/enrollmentService';
import { toast } from 'react-toastify';
import { User, Mail, Phone, Shield, Search, Key, Trash2, Edit2, AlertCircle, Camera, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../../utils/imageUrl';

const ProfilePage = () => {
  const { user, logout, updateProfileImage } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await profileService.getProfile();
      setProfile(data.data);

      const pId = data.data.profileId || {};
      setEditForm({
        name: pId.name || '',
        email: data.data.email || '',
        phone: pId.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      if (data.data.role === 'STUDENT' && pId._id) {
        try {
          const enrollData = await enrollmentService.getStudentEnrollments(pId._id);
          setEnrollments(enrollData.data || []);
        } catch (err) {
          console.error("Failed to fetch enrollments", err);
        }
      }
    } catch (error) {
      toast.error('Failed to load profile.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      return toast.error('Please upload an image file');
    }

    // Check file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Image must be less than 5MB');
    }

    const formData = new FormData();
    formData.append('profileImage', file);

    try {
      setLoading(true);
      const res = await profileService.uploadImage(formData);
      updateProfileImage(res.data.profileImage);
      toast.success('Profile image updated successfully');
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload image');
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (editForm.phone && !/^\d{10}$/.test(editForm.phone.trim())) {
      return toast.error('Phone number must be exactly 10 digits');
    }

    if (editForm.newPassword && editForm.newPassword !== editForm.confirmPassword) {
      return toast.error("New passwords do not match.");
    }

    try {
      setSubmitting(true);
      const payload = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
      };

      if (editForm.currentPassword && editForm.newPassword) {
        payload.currentPassword = editForm.currentPassword;
        payload.newPassword = editForm.newPassword;
      }

      await profileService.updateProfile(payload);
      toast.success('Profile updated successfully');
      setIsEditModalOpen(false);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProfile = async () => {
    try {
      setSubmitting(true);
      await profileService.deleteProfile();
      toast.success('Your profile has been deleted.');
      logout();
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete profile');
    } finally {
      setSubmitting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading profile...</div>;
  }

  if (!profile) return null;

  const profileData = profile.profileId || {};

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">My Profile</h1>
          <p className="text-gray-500">Manage your account information and preferences</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Profile Header Block */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-8 py-12 text-white">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/30 shadow-inner overflow-hidden">
                {profile.profileImage ? (
                  <img src={getImageUrl(profile.profileImage)} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-8 h-8 text-white" />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
            <div>
              <h2 className="text-3xl font-bold">{profileData.name || profile.username}</h2>
              <div className="mt-2 flex items-center gap-3">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                  {profile.role}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${profile.status === 'active' ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'}`}>
                  <span className={`w-2 h-2 rounded-full ${profile.status === 'active' ? 'bg-green-400' : 'bg-red-400'}`}></span>
                  {profile.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details Box */}
        <div className="p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 border-b pb-2">Account Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Username</p>
                <div className="flex items-center gap-3 text-gray-900 bg-gray-50 p-3 rounded-lg">
                  <User className="w-5 h-5 text-primary-500" />
                  <span className="font-medium">{profile.username}</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Email Address</p>
                <div className="flex items-center gap-3 text-gray-900 bg-gray-50 p-3 rounded-lg">
                  <Mail className="w-5 h-5 text-primary-500" />
                  <span className="font-medium">{profile.email}</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Phone Number</p>
                <div className="flex items-center gap-3 text-gray-900 bg-gray-50 p-3 rounded-lg">
                  <Phone className="w-5 h-5 text-primary-500" />
                  <span className="font-medium">{profileData.phone || 'Not Provided'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {profile.role === 'STUDENT' && (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Grade</p>
                    <div className="flex items-center gap-3 text-gray-900 bg-gray-50 p-3 rounded-lg">
                      <Shield className="w-5 h-5 text-primary-500" />
                      <span className="font-medium">{profileData.grade || 'Not Assigned'}</span>
                    </div>
                  </div>
                  
                  {enrollments.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Enrolled Classes</p>
                      <div className="flex items-center gap-3 text-gray-900 bg-gray-50 p-3 rounded-lg flex-wrap">
                        {enrollments.map((en, idx) => (
                          <span key={idx} className="bg-primary-100 text-primary-700 px-2 py-1 rounded-md text-sm flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {en.class?.className || en.class?.subject || 'Class'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {profile.role === 'TEACHER' && profileData.subjects?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Subjects Taught</p>
                  <div className="flex items-center gap-3 text-gray-900 bg-gray-50 p-3 rounded-lg flex-wrap">
                    {profileData.subjects.map((sub, idx) => (
                      <span key={idx} className="bg-primary-100 text-primary-700 px-2 py-1 rounded-md text-sm">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-10 flex gap-4 border-t pt-8">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm transition-colors font-medium flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-6 py-2.5 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><Key className="w-4 h-4 text-gray-500" /> Change Password (Optional)</h4>
                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="Current Password"
                    value={editForm.currentPassword}
                    onChange={(e) => setEditForm({ ...editForm, currentPassword: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <input
                    type="password"
                    placeholder="New Password"
                    value={editForm.newPassword}
                    onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={editForm.confirmPassword}
                    onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-4 text-red-600 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Delete Account?</h2>
            </div>

            <p className="text-gray-600 mb-6 border-l-4 border-red-500 pl-3 py-1 bg-red-50/50 rounded-r-md">
              Are you absolute sure you want to delete your profile? This action is <strong>permanent</strong> and cannot be undone. All your personal data will be erased.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProfile}
                disabled={submitting}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2 shadow-sm"
              >
                {submitting ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;

