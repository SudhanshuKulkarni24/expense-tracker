// firebase/functions/index.js
// Deploy with: firebase deploy --only functions

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { google } = require('googleapis');

admin.initializeApp();

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// ─── Helper: get authenticated Sheets client ───────────────────────────────
async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: functions.config().sheets.service_account_email,
      private_key: functions.config().sheets.private_key.replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
  });
  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

// ─── Helper: ensure header row exists ──────────────────────────────────────
async function ensureHeaders(sheets, spreadsheetId) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Transactions!A1:H1',
  });
  if (!res.data.values || res.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Transactions!A1:H1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [['ID', 'Date', 'Type', 'Category', 'Description', 'Amount (₹)', 'Created At', 'User ID']],
      },
    });
  }
}

// ─── Create a new Google Sheet for a user ──────────────────────────────────
exports.createUserSheet = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');

  const { displayName } = data;
  const uid = context.auth.uid;

  try {
    const sheets = await getSheetsClient();
    const drive = google.drive({ version: 'v3', auth: sheets.context._options.auth });

    // Create a new spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: `Expense Tracker — ${displayName}` },
        sheets: [
          { properties: { title: 'Transactions', sheetId: 0 } },
          { properties: { title: 'Summary', sheetId: 1 } },
        ],
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;

    // Set up headers and formatting
    await ensureHeaders(sheets, spreadsheetId);

    // Format header row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.18, green: 0.27, blue: 0.95 },
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          {
            updateSheetProperties: {
              properties: { sheetId: 0, gridProperties: { frozenRowCount: 1 } },
              fields: 'gridProperties.frozenRowCount',
            },
          },
        ],
      },
    });

    // Share the sheet with the user (editor access)
    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        type: 'user',
        role: 'writer',
        emailAddress: context.auth.token.email,
      },
    });

    // Save spreadsheetId to user's Firestore doc
    await admin.firestore().collection('users').doc(uid).set(
      { spreadsheetId, sheetCreatedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );

    return { success: true, spreadsheetId, url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}` };
  } catch (err) {
    console.error('createUserSheet error:', err);
    throw new functions.https.HttpsError('internal', err.message);
  }
});

// ─── Sync a single transaction to Google Sheets ────────────────────────────
exports.syncTransaction = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');

  const uid = context.auth.uid;
  const { transaction } = data;

  try {
    // Get user's spreadsheetId
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const { spreadsheetId } = userDoc.data();

    if (!spreadsheetId) {
      throw new functions.https.HttpsError('failed-precondition', 'No sheet linked. Call createUserSheet first.');
    }

    const sheets = await getSheetsClient();
    await ensureHeaders(sheets, spreadsheetId);

    const row = [
      transaction.id,
      transaction.date,
      transaction.type,
      transaction.category,
      transaction.description,
      transaction.amount,
      new Date().toISOString(),
      uid,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Transactions!A:H',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] },
    });

    return { success: true };
  } catch (err) {
    console.error('syncTransaction error:', err);
    throw new functions.https.HttpsError('internal', err.message);
  }
});

// ─── Bulk sync all transactions ─────────────────────────────────────────────
exports.bulkSyncTransactions = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');

  const uid = context.auth.uid;
  const { transactions } = data;

  try {
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const { spreadsheetId } = userDoc.data();

    if (!spreadsheetId) {
      throw new functions.https.HttpsError('failed-precondition', 'No sheet linked.');
    }

    const sheets = await getSheetsClient();

    // Clear existing data (keep header)
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: 'Transactions!A2:H',
    });

    if (transactions.length === 0) return { success: true, count: 0 };

    const rows = transactions.map(t => [
      t.id, t.date, t.type, t.category, t.description, t.amount,
      new Date().toISOString(), uid,
    ]);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Transactions!A2:H${rows.length + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows },
    });

    return { success: true, count: rows.length };
  } catch (err) {
    console.error('bulkSyncTransactions error:', err);
    throw new functions.https.HttpsError('internal', err.message);
  }
});

// ─── Auto-sync on Firestore write (background trigger) ─────────────────────
exports.onTransactionWrite = functions.firestore
  .document('users/{userId}/transactions/{txnId}')
  .onWrite(async (change, context) => {
    const uid = context.params.userId;
    const txn = change.after.exists ? change.after.data() : null;
    if (!txn) return null; // deleted — handle separately if needed

    try {
      const userDoc = await admin.firestore().collection('users').doc(uid).get();
      const userData = userDoc.data();
      if (!userData?.spreadsheetId) return null;

      const sheets = await getSheetsClient();
      await ensureHeaders(sheets, userData.spreadsheetId);

      const row = [
        txn.id, txn.date, txn.type, txn.category,
        txn.description, txn.amount, new Date().toISOString(), uid,
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: userData.spreadsheetId,
        range: 'Transactions!A:H',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [row] },
      });
    } catch (err) {
      console.error('onTransactionWrite sync error:', err);
    }

    return null;
  });
