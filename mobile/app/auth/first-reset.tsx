import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../../src/context/AuthContext';
import apiClient from '../../src/utils/api';
import { Colors, Spacing, BorderRadius, GRadients } from '../../constants/theme';

export default function FirstLoginReset() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { state, signOut, updateUser } = useContext(AuthContext);
  const router = useRouter();

  const handleReset = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/first-login-reset', { newPassword });
      
      if (response.data.success) {
        Alert.alert('Success', 'Password updated successfully! Welcome aboard.');
        // Update local state to reflect that it's no longer the first login
        updateUser({ isFirstLogin: false });
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.background} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={48} color={Colors.dark.primary} />
          </View>
          <Text style={styles.title}>Secure Your Account</Text>
          <Text style={styles.subtitle}>
            Welcome! Since this is your first time logging in, please set a new password for your security.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              placeholderTextColor={Colors.dark.textMuted}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="shield-outline" size={20} color={Colors.dark.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              placeholderTextColor={Colors.dark.textMuted}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <TouchableOpacity onPress={handleReset} disabled={loading} activeOpacity={0.8}>
            <LinearGradient
              colors={GRadients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Update Password</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => signOut()} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Cancel and Sign Out</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { ...StyleSheet.absoluteFillObject },
  keyboardView: { flex: 1, justifyContent: 'center', padding: 25 },
  header: { alignItems: 'center', marginBottom: 30 },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 15, color: Colors.dark.textMuted, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  form: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    borderRadius: BorderRadius.md,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 56,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#fff', fontSize: 16 },
  button: { height: 56, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  logoutBtn: { marginTop: 20, alignItems: 'center' },
  logoutText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },
});
