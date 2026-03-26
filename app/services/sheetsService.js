// app/services/sheetsService.js
// Client-side Google Sheets integration using user's OAuth token

// ─── Create a Google Sheet for a new user ───────────────────────────────
export async function createUserSheet(displayName, accessToken) {
  const sheetTitle = `Expense Tracker — ${displayName}`;

  // Create spreadsheet
  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title: sheetTitle },
      sheets: [
        { properties: { title: 'Transactions', sheetId: 0 } },
        { properties: { title: 'Summary', sheetId: 1 } },
      ],
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Failed to create sheet: ${error}`);
  }

  const spreadsheet = await createResponse.json();
  const spreadsheetId = spreadsheet.spreadsheetId;

  // Add headers
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Transactions!A1:H1?valueInputOption=RAW`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [['ID', 'Date', 'Type', 'Category', 'Description', 'Amount (₹)', 'Created At', 'User ID']],
    }),
  });

  // Format header row (blue background, white text, frozen)
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
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
    }),
  });

  return {
    success: true,
    spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    title: sheetTitle,
  };
}

// ─── Share sheet with a user ─────────────────────────────────────────────
export async function shareSheetWithUser(spreadsheetId, email, accessToken) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}/permissions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'user',
      role: 'writer',
      emailAddress: email,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to share sheet: ${error}`);
  }

  return { success: true };
}

// ─── Sync a single transaction to Google Sheets ────────────────────────────
export async function syncTransaction(spreadsheetId, transaction, uid, accessToken) {
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

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Transactions!A:H:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to sync transaction: ${error}`);
  }

  return { success: true };
}

// ─── Bulk sync all transactions ─────────────────────────────────────────
export async function bulkSyncTransactions(spreadsheetId, transactions, uid, accessToken) {
  // Clear existing data (keep header)
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Transactions!A2:H:clear`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }
  );

  if (transactions.length === 0) return { success: true, count: 0 };

  const rows = transactions.map(t => [
    t.id, t.date, t.type, t.category, t.description, t.amount,
    new Date().toISOString(), uid,
  ]);

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Transactions!A2:H${rows.length + 1}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: rows }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to bulk sync: ${error}`);
  }

  return { success: true, count: rows.length };
}

// ─── Build the Google Sheets URL ─────────────────────────────────────────
export function getSheetUrl(spreadsheetId) {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
}
