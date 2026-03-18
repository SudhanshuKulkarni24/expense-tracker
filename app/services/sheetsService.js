// app/services/sheetsService.js
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../../firebase/config';

const functions = getFunctions(app);

// ─── Create a Google Sheet for a new user ───────────────────────────────────
export async function createUserSheet(displayName) {
  const fn = httpsCallable(functions, 'createUserSheet');
  const result = await fn({ displayName });
  return result.data; // { success, spreadsheetId, url }
}

// ─── Sync a single transaction ───────────────────────────────────────────────
export async function syncTransaction(transaction) {
  const fn = httpsCallable(functions, 'syncTransaction');
  const result = await fn({ transaction });
  return result.data;
}

// ─── Bulk sync all transactions ──────────────────────────────────────────────
export async function bulkSyncTransactions(transactions) {
  const fn = httpsCallable(functions, 'bulkSyncTransactions');
  const result = await fn({ transactions });
  return result.data;
}

// ─── Build the Google Sheets URL ─────────────────────────────────────────────
export function getSheetUrl(spreadsheetId) {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
}
