// app/components/ConfirmDialog.js
import React from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
} from 'react-native';
import { THEME } from '../utils/constants';

const T = THEME.dark;

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmStyle = 'default', // 'default' | 'destructive'
  onConfirm,
  onCancel,
}) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                confirmStyle === 'destructive' && styles.destructiveBtn,
              ]}
              onPress={onConfirm}
            >
              <Text style={[
                styles.confirmText,
                confirmStyle === 'destructive' && styles.destructiveText,
              ]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: T.bg2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border2,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: T.text,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: T.text2,
    lineHeight: 20,
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: T.bg3,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '500',
    color: T.text2,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: T.blue,
    alignItems: 'center',
  },
  destructiveBtn: {
    backgroundColor: '#ff5f6d',
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  destructiveText: {
    color: '#fff',
  },
});
