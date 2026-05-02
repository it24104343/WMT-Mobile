import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../../src/utils/api';
import { AuthContext } from '../../src/context/AuthContext';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { API_CONFIG } from '../../src/config/api';

export default function ProfileScreen() {
  const { state, signOut, updateUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    phone: '',
  });

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get('/profile');
      const userData = response.data.data;
      setProfile(userData);
      setEditData({
        name: userData.profileId?.name || userData.name || userData.username || '',
        phone: userData.profileId?.phone || userData.phone || '',
        email: userData.email || '',
        username: userData.username || '',
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const options = ['Upload New Photo', 'Cancel'];
    if (user.profileImage) {
      options.splice(1, 0, 'Remove Current Photo');
    }

    Alert.alert(
      'Profile Photo',
      'Change or remove your profile picture',
      options.map(option => ({
        text: option,
        style: option === 'Cancel' ? 'cancel' : (option === 'Remove Current Photo' ? 'destructive' : 'default'),
        onPress: async () => {
          if (option === 'Upload New Photo') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Denied', 'We need camera roll permissions to upload a profile picture.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.5,
            });
            if (!result.canceled) {
              handleImageUpload(result.assets[0].uri);
            }
          } else if (option === 'Remove Current Photo') {
            handleRemoveImage();
          }
        }
      }))
    );
  };

  const handleImageUpload = async (uri: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : `image`;

      formData.append('profileImage', {
        uri,
        name: filename,
        type,
      } as any);

      await apiClient.post('/profile/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const userDataResponse = await apiClient.get('/profile');
      const updatedUser = userDataResponse.data.data;
      updateUser({ 
        profileImage: updatedUser.profileImage,
        fullName: updatedUser.profileId?.name 
      });
      fetchProfile();
      Alert.alert('Success', 'Profile image updated successfully');
    } catch (error) {
      console.error('Image upload failed:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      setUploading(true);
      await apiClient.delete('/profile/image');
      fetchProfile();
      updateUser({ profileImage: null });
      Alert.alert('Success', 'Profile image removed');
    } catch (error) {
      console.error('Image removal failed:', error);
      Alert.alert('Error', 'Failed to remove image');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      await apiClient.put('/profile', {
        name: editData.name,
        phone: editData.phone,
        email: editData.email,
        username: editData.username,
      });
      await fetchProfile();
      updateUser({ 
        fullName: editData.name,
        username: editData.username
      });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Profile update failed:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await apiClient.delete('/profile');
              signOut();
            } catch (error) {
              console.error('Delete account failed:', error);
              Alert.alert('Error', 'Failed to delete account');
              setLoading(false);
            }
          }
        },
      ]
    );
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  const user = profile || {};
  const details = user.profileId || {};
  const isTeacher = user.role === 'TEACHER';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { backgroundColor: '#0f172a', borderBottomLeftRadius: 40, borderBottomRightRadius: 40, paddingBottom: 80, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }]}>
        <View>
          <Text style={styles.headerTitle}>My Profile</Text>
          <Text style={{ color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
            {isEditing ? 'Editing Profile' : 'Account Overview'}
          </Text>
        </View>
        
        <View style={styles.profilePicWrapper}>
          <TouchableOpacity 
            style={styles.headerAvatarContainer} 
            onPress={pickImage}
            onLongPress={user.profileImage ? handleRemoveImage : undefined}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : user.profileImage ? (
              <Image 
                source={{ uri: `${API_CONFIG.BASE_URL.replace('/api', '')}${user.profileImage}` }} 
                style={styles.headerAvatar} 
              />
            ) : (
              <Ionicons name="person" size={32} color="#fff" />
            )}
            <View style={styles.headerEditIcon}>
              <Ionicons name="camera" size={12} color="#0f172a" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.profileCard}>
        <LinearGradient
          colors={['#1e293b', '#0f172a']}
          style={[styles.banner, { display: 'none' }]}
        >
          <View style={[styles.userInfo, { padding: 24 }]}>
            <TouchableOpacity 
              style={styles.avatarContainer} 
              onPress={pickImage}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : user.profileImage ? (
                <Image 
                  source={{ uri: `${API_CONFIG.BASE_URL.replace('/api', '')}${user.profileImage}` }} 
                  style={styles.avatar} 
                />
              ) : (
                <Ionicons name="person" size={40} color="#3b82f6" />
              )}
              <View style={styles.editIconContainer}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            <View style={styles.nameSection}>
              {isEditing ? (
                <TextInput
                  style={styles.nameInput}
                  value={editData.name}
                  onChangeText={(text) => setEditData({ ...editData, name: text })}
                  placeholder="Enter Name"
                  placeholderTextColor="#94a3b8"
                />
              ) : (
                <Text style={styles.userName}>{details.name || user.name || user.username}</Text>
              )}
              <View style={styles.badgeRow}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{user.role}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Active</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <View style={styles.divider} />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputBox}>
              <Ionicons name="person-outline" size={20} color="#22c55e" style={{ marginRight: 10 }} />
              {isEditing ? (
                <TextInput
                  style={styles.editInput}
                  value={editData.name}
                  onChangeText={(text) => setEditData({ ...editData, name: text })}
                  placeholder="Full Name"
                />
              ) : (
                <Text style={styles.inputText}>{details.name || user.name || user.username}</Text>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputBox}>
              <Ionicons name="at-outline" size={20} color="#22c55e" style={{ marginRight: 10 }} />
              {isEditing ? (
                <TextInput
                  style={styles.editInput}
                  value={editData.username}
                  onChangeText={(text) => setEditData({ ...editData, username: text })}
                  placeholder="Username"
                />
              ) : (
                <Text style={styles.inputText}>{user.username}</Text>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={20} color="#22c55e" style={{ marginRight: 10 }} />
              {isEditing ? (
                <TextInput
                  style={styles.editInput}
                  value={editData.email}
                  onChangeText={(text) => setEditData({ ...editData, email: text })}
                  placeholder="Email"
                  keyboardType="email-address"
                />
              ) : (
                <Text style={styles.inputText}>{user.email}</Text>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputBox}>
              <Ionicons name="call-outline" size={20} color="#22c55e" style={{ marginRight: 10 }} />
              {isEditing ? (
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ marginRight: 5, color: '#64748b' }}>+94</Text>
                  <TextInput
                    style={styles.editInput}
                    value={editData.phone}
                    onChangeText={(text) => setEditData({ ...editData, phone: text })}
                    placeholder="7XXXXXXXX"
                    keyboardType="phone-pad"
                  />
                </View>
              ) : (
                <Text style={styles.inputText}>{details.phone || user.phone || 'N/A'}</Text>
              )}
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.editBtn, isEditing && styles.saveBtn]} 
              onPress={() => {
                if (isEditing) {
                  handleUpdateProfile();
                } else {
                  setIsEditing(true);
                }
              }}
            >
              <Ionicons name={isEditing ? "checkmark-outline" : "create-outline"} size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.editBtnText}>{isEditing ? 'Save Changes' : 'Edit Profile'}</Text>
            </TouchableOpacity>

            {isEditing ? (
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditing(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
                <Text style={styles.deleteBtnText}>Delete Account</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
  },
  profileCard: {
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: -40,
    ...Shadow.md,
  },
  banner: {
    height: 160,
    padding: 24,
    justifyContent: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  nameSection: {
    marginLeft: 20,
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  roleText: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  statusBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ade80',
    marginRight: 6,
  },
  statusText: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailsSection: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  inputGroup: {
    flex: 1,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  tagCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  tagText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    height: 44,
    borderRadius: 8,
  },
  editBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  deleteBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: 'bold',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#22c55e',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  nameInput: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.5)',
    paddingVertical: 4,
  },
  editInput: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    padding: 0,
    fontWeight: '500',
  },
  headerAvatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  headerEditIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.sm,
  },
  profilePicWrapper: {
    alignItems: 'center',
  },
  saveBtn: {
    backgroundColor: '#22c55e',
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  cancelBtnText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
});
