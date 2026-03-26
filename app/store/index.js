// app/store/index.js
import { create } from 'zustand';
import {
  collection, addDoc, getDocs, deleteDoc, updateDoc,
  doc, query, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/config';

// ─── Auth Store ─────────────────────────────────────────────────────────────
export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  spreadsheetId: null,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setSpreadsheetId: (id) => set({ spreadsheetId: id }),
  signOut: () => set({ user: null, spreadsheetId: null }),
}));

// ─── Transaction Store ───────────────────────────────────────────────────────
export const useTransactionStore = create((set, get) => ({
  transactions: [],
  loading: false,
  syncing: false,
  lastSynced: null,
  unsubscribe: null,

  // Subscribe to real-time updates from Firestore
  subscribe: (uid) => {
    const { unsubscribe: prev } = get();
    if (prev) prev(); // clean up old listener

    const q = query(
      collection(db, 'users', uid, 'transactions'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const transactions = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      set({ transactions, loading: false });
    });

    set({ unsubscribe: unsub, loading: true });
    return unsub;
  },

  // Add a transaction to Firestore
  addTransaction: async (uid, txn) => {
    set({ syncing: true });
    try {
      const colRef = collection(db, 'users', uid, 'transactions');
      const docRef = await addDoc(colRef, {
        ...txn,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      // Update document with its own ID for Firebase Functions to use
      await updateDoc(docRef, { id: docRef.id });
      set({ lastSynced: new Date(), syncing: false });
      return docRef.id;
    } catch (err) {
      set({ syncing: false });
      throw err;
    }
  },

  // Delete a transaction
  deleteTransaction: async (uid, txnId) => {
    set({ syncing: true });
    try {
      await deleteDoc(doc(db, 'users', uid, 'transactions', txnId));
      set({ lastSynced: new Date(), syncing: false });
    } catch (err) {
      set({ syncing: false });
      throw err;
    }
  },

  // Computed: totals
  getTotals: () => {
    const { transactions } = get();
    return transactions.reduce(
      (acc, t) => {
        if (t.type === 'income') acc.income += t.amount;
        else if (t.type === 'expense') acc.expense += t.amount;
        else if (t.type === 'loan') acc.loan += t.amount;
        return acc;
      },
      { income: 0, expense: 0, loan: 0 }
    );
  },

  // Computed: by category
  getByCategory: () => {
    const { transactions } = get();
    const map = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  },

  // Computed: monthly data (last 6 months)
  getMonthlyData: () => {
    const { transactions } = get();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({
        label: d.toLocaleString('default', { month: 'short' }),
        month: d.getMonth(),
        year: d.getFullYear(),
        income: 0,
        expense: 0,
      });
    }

    transactions.forEach((t) => {
      const date = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      const m = months.find(
        (mo) => mo.month === date.getMonth() && mo.year === date.getFullYear()
      );
      if (!m) return;
      if (t.type === 'income') m.income += t.amount;
      else if (t.type === 'expense') m.expense += t.amount;
    });

    return months;
  },

  clear: () => {
    const { unsubscribe } = get();
    if (unsubscribe) unsubscribe();
    set({ transactions: [], unsubscribe: null, lastSynced: null });
  },
}));
