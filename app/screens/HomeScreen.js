// app/screens/HomeScreen.js
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, RefreshControl,
} from 'react-native';
import { useTransactionStore } from '../store';
import { useAuthStore } from '../store';
import { THEME, formatCurrency, formatShortDate, getCategoryMeta, COLORS } from '../utils/constants';
import AddTransactionModal from '../components/AddTransactionModal';

const T = THEME.dark;

const FILTER_TABS = ['All', 'Income', 'Expense', 'Loan'];

export default function HomeScreen({ navigation }) {
  const { user, spreadsheetId } = useAuthStore();
  const { transactions, syncing, lastSynced, getTotals } = useTransactionStore();
  const [activeTab, setActiveTab] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('expense');
  const [refreshing, setRefreshing] = useState(false);

  const totals = getTotals();
  const balance = totals.income - totals.expense;

  const displayName = user?.displayName?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const filtered = activeTab === 'All'
    ? transactions
    : transactions.filter((t) => t.type === activeTab.toLowerCase());

  const openModal = (type) => { setModalType(type); setModalVisible(true); };

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.text2} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}, {displayName}</Text>
            <View style={styles.syncRow}>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </Text>
              <View style={[styles.syncBadge, syncing && styles.syncBadgeSyncing]}>
                <View style={[styles.syncDot, syncing && styles.syncDotSyncing]} />
                <Text style={styles.syncText}>{syncing ? 'Syncing...' : 'Synced'}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.avatarText}>
              {user?.displayName?.[0]?.toUpperCase() || 'U'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
          <View style={styles.balanceMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>INCOME</Text>
              <Text style={[styles.metaValue, { color: T.green }]}>+{formatCurrency(totals.income)}</Text>
            </View>
            <View style={[styles.metaDivider]} />
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>EXPENSES</Text>
              <Text style={[styles.metaValue, { color: T.red }]}>−{formatCurrency(totals.expense)}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>LOANS</Text>
              <Text style={[styles.metaValue, { color: T.amber }]}>{formatCurrency(totals.loan)}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {[
            { type: 'income', icon: '💰', label: 'Income' },
            { type: 'expense', icon: '💸', label: 'Expense' },
            { type: 'loan', icon: '🤝', label: 'Loan' },
          ].map(({ type, icon, label }) => (
            <TouchableOpacity
              key={type}
              style={styles.qaBtn}
              onPress={() => openModal(type)}
            >
              <View style={[styles.qaIcon, { backgroundColor: COLORS[`${type}Light`] }]}>
                <Text style={{ fontSize: 20 }}>{icon}</Text>
              </View>
              <Text style={styles.qaLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.qaBtn}
            onPress={() => navigation.navigate('Analytics')}
          >
            <View style={[styles.qaIcon, { backgroundColor: '#4e8df522' }]}>
              <Text style={{ fontSize: 20 }}>📊</Text>
            </View>
            <Text style={styles.qaLabel}>Analytics</Text>
          </TouchableOpacity>
        </View>

        {/* Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          <View style={styles.tabs}>
            {FILTER_TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Transaction list */}
        <View style={styles.txnList}>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No transactions yet.</Text>
              <Text style={styles.emptySubtext}>Tap + to add your first entry.</Text>
            </View>
          ) : (
            filtered.slice(0, 10).map((txn) => <TransactionRow key={txn.id} txn={txn} />)
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => openModal('expense')}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <AddTransactionModal
        visible={modalVisible}
        initialType={modalType}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

function TransactionRow({ txn }) {
  const meta = getCategoryMeta(txn.category);
  const isCredit = txn.type === 'income';
  const isLoan = txn.type === 'loan';

  return (
    <View style={styles.txnRow}>
      <View style={[styles.txnIcon, {
        backgroundColor: isCredit ? COLORS.incomeLight : isLoan ? COLORS.loanLight : COLORS.expenseLight,
      }]}>
        <Text style={{ fontSize: 20 }}>{meta.icon}</Text>
      </View>
      <View style={styles.txnInfo}>
        <Text style={styles.txnName} numberOfLines={1}>{txn.description}</Text>
        <Text style={styles.txnCat}>{meta.label}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.txnAmount, {
          color: isCredit ? T.green : isLoan ? T.amber : T.red,
        }]}>
          {isCredit ? '+' : '−'}{formatCurrency(txn.amount)}
        </Text>
        <Text style={styles.txnDate}>{formatShortDate(txn.date || txn.createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  greeting: { fontSize: 20, fontWeight: '700', color: T.text, letterSpacing: -0.3 },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  dateText: { fontSize: 13, color: T.text2 },
  syncBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#22d19015', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
  },
  syncBadgeSyncing: { backgroundColor: '#4e8df515' },
  syncDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: T.green },
  syncDotSyncing: { backgroundColor: T.blue },
  syncText: { fontSize: 11, color: T.green, fontWeight: '500' },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: T.blue, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  balanceCard: {
    marginHorizontal: 16, marginVertical: 12,
    backgroundColor: T.bg3, borderRadius: 18, borderWidth: 1, borderColor: T.border2,
    padding: 22,
  },
  balanceLabel: { fontSize: 11, color: T.text2, letterSpacing: 1, marginBottom: 6 },
  balanceAmount: { fontSize: 36, fontWeight: '300', color: T.text, letterSpacing: -1 },
  balanceMeta: {
    flexDirection: 'row', marginTop: 16, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: T.border,
  },
  metaItem: { flex: 1, alignItems: 'center' },
  metaLabel: { fontSize: 10, color: T.text3, letterSpacing: 0.5 },
  metaValue: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  metaDivider: { width: 1, backgroundColor: T.border },

  quickActions: {
    flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16,
  },
  qaBtn: {
    flex: 1, backgroundColor: T.bg3, borderRadius: 14,
    borderWidth: 1, borderColor: T.border,
    paddingVertical: 12, alignItems: 'center', gap: 6,
  },
  qaIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  qaLabel: { fontSize: 11, color: T.text2 },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: T.text },
  seeAll: { fontSize: 13, color: T.blue },

  tabsScroll: { marginBottom: 12 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: T.bg3, borderWidth: 1, borderColor: T.border,
  },
  tabActive: { backgroundColor: '#4e8df522', borderColor: T.blue },
  tabText: { fontSize: 13, color: T.text2 },
  tabTextActive: { color: T.blue, fontWeight: '500' },

  txnList: { paddingHorizontal: 16, paddingBottom: 100 },
  txnRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: T.bg3, borderRadius: 14, borderWidth: 1,
    borderColor: T.border, padding: 14, marginBottom: 8,
  },
  txnIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txnInfo: { flex: 1 },
  txnName: { fontSize: 14, fontWeight: '500', color: T.text },
  txnCat: { fontSize: 12, color: T.text3, marginTop: 2 },
  txnAmount: { fontSize: 14, fontWeight: '600' },
  txnDate: { fontSize: 11, color: T.text3, marginTop: 2 },

  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 15, color: T.text2, fontWeight: '500' },
  emptySubtext: { fontSize: 13, color: T.text3, marginTop: 4 },

  fab: {
    position: 'absolute', bottom: 28, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: T.blue, alignItems: 'center', justifyContent: 'center',
    shadowColor: T.blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: { fontSize: 28, color: '#fff', lineHeight: 32 },
});
