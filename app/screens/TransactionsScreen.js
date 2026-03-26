// app/screens/TransactionsScreen.js
import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView,
  TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { useTransactionStore, useAuthStore } from '../store';
import { THEME, formatCurrency, formatShortDate, getCategoryMeta, COLORS } from '../utils/constants';
import AddTransactionModal from '../components/AddTransactionModal';

const T = THEME.dark;

export default function TransactionsScreen() {
  const { user } = useAuthStore();
  const { transactions, deleteTransaction } = useTransactionStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [editTransaction, setEditTransaction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchType = typeFilter === 'all' || t.type === typeFilter;
      const matchSearch =
        !search ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch;
    });
  }, [transactions, typeFilter, search]);

  const handleEdit = (txn) => {
    setEditTransaction(txn);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditTransaction(null);
  };

  const handleDelete = (txn) => {
    Alert.alert(
      'Delete transaction',
      `Are you sure you want to delete "${txn.description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => deleteTransaction(user.uid, txn.id),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>All transactions</Text>

      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Search transactions..."
        placeholderTextColor={T.text3}
      />

      <View style={styles.tabs}>
        {['all', 'income', 'expense', 'loan'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, typeFilter === t && styles.tabActive]}
            onPress={() => setTypeFilter(t)}
          >
            <Text style={[styles.tabText, typeFilter === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No transactions found.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const meta = getCategoryMeta(item.category);
          const isCredit = item.type === 'income';
          const isLoan = item.type === 'loan';
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => handleEdit(item)}
              onLongPress={() => handleDelete(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.icon, {
                backgroundColor: isCredit ? COLORS.incomeLight : isLoan ? COLORS.loanLight : COLORS.expenseLight,
              }]}>
                <Text style={{ fontSize: 20 }}>{meta.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>{item.description}</Text>
                <Text style={styles.cat}>{meta.label} · {formatShortDate(item.date || item.createdAt)}</Text>
              </View>
              <Text style={[styles.amount, {
                color: isCredit ? T.green : isLoan ? T.amber : T.red,
              }]}>
                {isCredit ? '+' : '−'}{formatCurrency(item.amount)}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <AddTransactionModal
        visible={modalVisible}
        initialType={editTransaction?.type || 'expense'}
        editTransaction={editTransaction}
        onClose={closeModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  title: {
    fontSize: 24, fontWeight: '700', color: T.text,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, letterSpacing: -0.4,
  },
  searchInput: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: T.bg3, borderRadius: 12, borderWidth: 1, borderColor: T.border,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: T.text,
  },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 14 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: T.bg3, borderWidth: 1, borderColor: T.border,
  },
  tabActive: { backgroundColor: '#4e8df522', borderColor: T.blue },
  tabText: { fontSize: 12, color: T.text2 },
  tabTextActive: { color: T.blue, fontWeight: '500' },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: T.bg3, borderRadius: 14, borderWidth: 1,
    borderColor: T.border, padding: 14, marginBottom: 8,
  },
  icon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 14, fontWeight: '500', color: T.text },
  cat: { fontSize: 12, color: T.text3, marginTop: 2 },
  amount: { fontSize: 14, fontWeight: '600' },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyText: { fontSize: 15, color: T.text2 },
});
