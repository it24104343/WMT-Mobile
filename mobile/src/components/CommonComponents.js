import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  disabled = false, 
  size = 'md',
  style 
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        styles[variant],
        disabled && styles.disabled,
        styles[`size_${size}`],
        style
      ]}
    >
      <Text style={[styles.text, styles[`text_${variant}`]]}>{title}</Text>
    </TouchableOpacity>
  );
};

export const InputField = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder,
  keyboardType = 'default',
  multiline = false,
  style 
}) => {
  const { TextInput } = require('react-native');
  return (
    <View style={styles.inputContainer}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline, style]}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
};

export const Card = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

export const ListItem = ({ 
  title, 
  subtitle, 
  onPress, 
  actionButtons 
}) => {
  return (
    <TouchableOpacity style={styles.listItem} onPress={onPress}>
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.listItemSubtitle}>{subtitle}</Text>}
      </View>
      {actionButtons && <View style={styles.listItemActions}>{actionButtons}</View>}
    </TouchableOpacity>
  );
};

export const Modal = ({ visible, title, children, onClose }) => {
  const { Modal } = require('react-native');
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>{children}</View>
        </View>
      </View>
    </Modal>
  );
};

export const StatusBadge = ({ status }) => {
  const statusStyles = {
    'active': { bg: '#10b981', text: '#fff' },
    'inactive': { bg: '#6b7280', text: '#fff' },
    'pending': { bg: '#f59e0b', text: '#fff' },
    'approved': { bg: '#10b981', text: '#fff' },
    'rejected': { bg: '#ef4444', text: '#fff' },
    'paid': { bg: '#10b981', text: '#fff' },
    'unpaid': { bg: '#ef4444', text: '#fff' },
  };

  const style = statusStyles[status] || { bg: '#6b7280', text: '#fff' };

  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={{ color: style.text, fontSize: 12, fontWeight: '600' }}>
        {status}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#22c55e',
  },
  secondary: {
    backgroundColor: '#6b7280',
  },
  danger: {
    backgroundColor: '#ef4444',
  },
  disabled: {
    opacity: 0.5,
  },
  size_sm: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  size_md: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  size_lg: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  text_primary: {
    color: '#fff',
  },
  text_secondary: {
    color: '#fff',
  },
  text_danger: {
    color: '#fff',
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
  input: {
    backgroundColor: '#1a1a2e',
    borderColor: '#3a3a5e',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftColor: '#22c55e',
    borderLeftWidth: 4,
  },
  listItem: {
    backgroundColor: '#16213e',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#aaa',
  },
  listItemActions: {
    flexDirection: 'row',
    gap: 8,
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
    maxHeight: '90%',
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
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
});
