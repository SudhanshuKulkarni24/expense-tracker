// app/screens/ProfileScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ActivityIndicator, Linking, ScrollView,
} from 'react-native';
import { useAuthStore, useTransactionStore } from '../store';
import { signOut } from '../services/authService';
import { createUserSheet, bulkSyncTransactions, getSheetUrl } from '../services/sheetsService';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { THEME, formatCurrency } from '../utils/constants';
import ConfirmDialog from '../components/ConfirmDialog';

const T = THEME.dark;

export default function ProfileScreen() {
  const { user, spreadsheetId, setSpreadsheetId, signOut: clearUser } = useAuthStore();
  const { transactions, getTotals, lastSynced, clear } = useTransactionStore();
  const [creatingSheet, setCreatingSheet] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [showSheetCreatedDialog, setShowSheetCreatedDialog] = useState(false);
  const [createdSheetUrl, setCreatedSheetUrl] = useState('');

  const totals = getTotals();
  const sheetName = `Expense Tracker — ${user?.displayName || 'User'}`;

  const handleCreateSheet = async () => {
    setCreatingSheet(true);
    try {
      const result = await createUserSheet(user.displayName);
      setSpreadsheetId(result.spreadsheetId);
      await setDoc(doc(db, 'users', user.uid), { spreadsheetId: result.spreadsheetId }, { merge: true });
      setCreatedSheetUrl(result.url);
      setShowSheetCreatedDialog(true);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setCreatingSheet(false);
    }
  };

  const handleBulkSync = async () => {
    if (!spreadsheetId) {
      alert('No sheet linked. Please create a Google Sheet first.');
      return;
    }
    setSyncing(true);
    try {
      const result = await bulkSyncTransactions(transactions);
      alert(`Sync complete! ${result.count} transactions synced to Google Sheets.`);
    } catch (err) {
      alert('Sync failed: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleSignOut = async () => {
    setShowSignOutDialog(false);
    try {
      await signOut();
      clearUser();
      clear();
    } catch (error) {
      console.error('Sign out failed:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Profile</Text>

        {/* User card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.displayName?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <View>
            <Text style={styles.name}>{user?.displayName}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{transactions.length}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: T.green }]}>{formatCurrency(totals.income)}</Text>
            <Text style={styles.statLabel}>Total income</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: T.red }]}>{formatCurrency(totals.expense)}</Text>
            <Text style={styles.statLabel}>Total spent</Text>
          </View>
        </View>

        {/* Google Sheets section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Google Sheets</Text>
          {spreadsheetId ? (
            <>
              <View style={styles.sheetRow}>
                <Text style={styles.sheetLinked}>✓ Sheet linked</Text>
                <TouchableOpacity onPress={() => Linking.openURL(getSheetUrl(spreadsheetId))}>
                  <Text style={styles.openLink}>Open →</Text>
                </TouchableOpacity>
              </View>
              {lastSynced && (
                <Text style={styles.lastSync}>
                  Last synced: {lastSynced.toLocaleTimeString('en-IN')}
                </Text>
              )}
              <TouchableOpacity style={styles.btn} onPress={handleBulkSync} disabled={syncing}>
                {syncing ? <ActivityIndicator color={T.blue} /> : (
                  <Text style={styles.btnText}>Force sync all transactions</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.sheetDesc}>
                Create a Google Sheet to automatically back up all your transactions.
              </Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateSheet} disabled={creatingSheet}>
                {creatingSheet ? <ActivityIndicator color="#fff" /> : (
                  <Text style={styles.primaryBtnText}>Create my Google Sheet</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={() => setShowSignOutDialog(true)}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Sign Out Confirmation Dialog */}
      <ConfirmDialog
        visible={showSignOutDialog}
        title="Sign out"
        message="Are you sure you want to sign out?"
        confirmText="Sign out"
        confirmStyle="destructive"
        onConfirm={handleSignOut}
        onCancel={() => setShowSignOutDialog(false)}
      />

      {/* Sheet Created Success Dialog */}
      <ConfirmDialog
        visible={showSheetCreatedDialog}
        title="Sheet Created!"
        message={`Your Google Sheet "${sheetName}" has been created and saved to your Google Drive.\n\nIt will sync automatically whenever you add transactions.`}
        confirmText="Open Sheet"
        cancelText="OK"
        onConfirm={() => {
          setShowSheetCreatedDialog(false);
          Linking.openURL(createdSheetUrl);
        }}
        onCancel={() => setShowSheetCreatedDialog(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  title: {
    fontSize: 24, fontWeight: '700', color: T.text,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, letterSpacing: -0.4,
  },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 16, backgroundColor: T.bg3, borderRadius: 16,
    borderWidth: 1, borderColor: T.border, padding: 18, marginBottom: 16,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: T.blue,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#fff' },
  name: { fontSize: 17, fontWeight: '600', color: T.text },
  email: { fontSize: 13, color: T.text2, marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 20 },
  statBox: {
    flex: 1, backgroundColor: T.bg3, borderRadius: 14, borderWidth: 1,
    borderColor: T.border, padding: 14, alignItems: 'center',
  },
  statNum: { fontSize: 16, fontWeight: '700', color: T.text },
  statLabel: { fontSize: 11, color: T.text3, marginTop: 4, textAlign: 'center' },

  section: {
    marginHorizontal: 16, backgroundColor: T.bg3, borderRadius: 16,
    borderWidth: 1, borderColor: T.border, padding: 18, marginBottom: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: T.text, marginBottom: 12 },
  sheetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sheetLinked: { fontSize: 14, color: T.green, fontWeight: '500' },
  openLink: { fontSize: 14, color: T.blue },
  lastSync: { fontSize: 12, color: T.text3, marginBottom: 12 },
  sheetDesc: { fontSize: 13, color: T.text2, lineHeight: 20, marginBottom: 14 },

  btn: {
    borderRadius: 12, paddingVertical: 12, alignItems: 'center',
    borderWidth: 1, borderColor: T.blue, backgroundColor: '#4e8df515',
  },
  btnText: { fontSize: 14, color: T.blue, fontWeight: '500' },
  primaryBtn: {
    borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: T.blue,
  },
  primaryBtnText: { fontSize: 15, color: '#fff', fontWeight: '600' },

  signOutBtn: {
    marginHorizontal: 16, paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#ff5f6d15', borderWidth: 1, borderColor: '#ff5f6d40',
    alignItems: 'center', marginBottom: 40,
  },
  signOutText: { fontSize: 15, color: T.red, fontWeight: '600' },
});
