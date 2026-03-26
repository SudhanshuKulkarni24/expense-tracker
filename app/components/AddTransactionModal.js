// app/components/AddTransactionModal.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTransactionStore, useAuthStore } from '../store';
import { THEME, CATEGORIES, COLORS } from '../utils/constants';

const T = THEME.dark;

export default function AddTransactionModal({
  visible,
  initialType = 'expense',
  editTransaction = null,
  onClose,
}) {
  const { user } = useAuthStore();
  const { addTransaction, updateTransaction, deleteTransaction } = useTransactionStore();

  const [type, setType] = useState(initialType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = !!editTransaction;

  // Pre-fill form when editing
  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type || 'expense');
      setAmount(String(editTransaction.amount || ''));
      setDescription(editTransaction.description || '');
      setCategory(editTransaction.category || '');
    } else {
      setType(initialType);
      setAmount('');
      setDescription('');
      setCategory('');
    }
  }, [editTransaction, initialType, visible]);

  const categories = CATEGORIES[type] || [];

  const handleTypeChange = (t) => {
    setType(t);
    setCategory('');
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setCategory('');
    setType(initialType);
  };

  const handleSubmit = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      Alert.alert('Invalid amount', 'Please enter a valid number.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Description required', 'Please add a short description.');
      return;
    }
    if (!category) {
      Alert.alert('Category required', 'Please select a category.');
      return;
    }

    setLoading(true);
    try {
      const txnData = {
        type,
        amount: parseFloat(amount),
        description: description.trim(),
        category,
      };

      if (isEditing) {
        await updateTransaction(user.uid, editTransaction.id, txnData);
      } else {
        await addTransaction(user.uid, {
          ...txnData,
          date: new Date().toISOString(),
        });
      }

      resetForm();
      onClose();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save transaction.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteTransaction(user.uid, editTransaction.id);
              resetForm();
              onClose();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete transaction.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const typeColor = type === 'income' ? T.green : type === 'loan' ? T.amber : T.red;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.dismiss} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.title}>
              {isEditing ? 'Edit transaction' : 'Add transaction'}
            </Text>

            {/* Type selector */}
            <View style={styles.typeRow}>
              {['income', 'expense', 'loan'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeBtn,
                    type === t && { borderColor: COLORS[t], backgroundColor: COLORS[`${t}Light`] },
                  ]}
                  onPress={() => handleTypeChange(t)}
                >
                  <Text style={[
                    styles.typeBtnText,
                    type === t && { color: COLORS[t] },
                  ]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Amount */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>AMOUNT</Text>
              <View style={styles.amountRow}>
                <Text style={[styles.currencyPrefix, { color: typeColor }]}>₹</Text>
                <TextInput
                  style={[styles.amountInput, { color: typeColor }]}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={T.text3}
                  autoFocus={!isEditing}
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>DESCRIPTION</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="What's this for?"
                placeholderTextColor={T.text3}
              />
            </View>

            {/* Category grid */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>CATEGORY</Text>
              <View style={styles.catGrid}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catChip,
                      category === cat.id && { borderColor: typeColor, backgroundColor: `${typeColor}15` },
                    ]}
                    onPress={() => setCategory(cat.id)}
                  >
                    <Text style={styles.catIcon}>{cat.icon}</Text>
                    <Text style={[
                      styles.catLabel,
                      category === cat.id && { color: typeColor },
                    ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonRow}>
              {isEditing && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={handleDelete}
                  disabled={loading}
                >
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { backgroundColor: typeColor },
                  loading && styles.submitBtnDisabled,
                  isEditing && { flex: 1 },
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>
                    {isEditing ? 'Save changes' : `Add ${type}`} ✓
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  dismiss: { flex: 1 },
  sheet: {
    backgroundColor: T.bg2, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    borderTopWidth: 1, borderColor: T.border2, padding: 24, paddingBottom: 36,
  },
  handle: {
    width: 40, height: 4, backgroundColor: T.bg4, borderRadius: 2,
    alignSelf: 'center', marginBottom: 20,
  },
  title: { fontSize: 20, fontWeight: '700', color: T.text, marginBottom: 20 },

  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  typeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: T.border, alignItems: 'center',
  },
  typeBtnText: { fontSize: 14, fontWeight: '500', color: T.text2 },

  formGroup: { marginBottom: 18 },
  label: { fontSize: 11, color: T.text2, letterSpacing: 1, marginBottom: 8 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  currencyPrefix: { fontSize: 28, fontWeight: '300' },
  amountInput: {
    flex: 1, fontSize: 36, fontWeight: '300',
    backgroundColor: T.bg3, borderRadius: 12, borderWidth: 1, borderColor: T.border,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  input: {
    backgroundColor: T.bg3, borderRadius: 12, borderWidth: 1, borderColor: T.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: T.text,
  },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: T.bg3, borderRadius: 20, borderWidth: 1, borderColor: T.border,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  catIcon: { fontSize: 14 },
  catLabel: { fontSize: 12, color: T.text2, fontWeight: '400' },

  buttonRow: {
    flexDirection: 'row', gap: 10, marginTop: 4,
  },
  deleteBtn: {
    borderRadius: 14, paddingVertical: 16, paddingHorizontal: 20,
    backgroundColor: '#ff5f6d15', borderWidth: 1, borderColor: '#ff5f6d40',
    alignItems: 'center',
  },
  deleteBtnText: { fontSize: 16, fontWeight: '600', color: T.red },
  submitBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
