# 💰 Expense Tracker

A cross-platform money tracking app built with React Native (Expo), Firebase, and Google Sheets.
Track income, expenses, and loans — with every transaction automatically backed up to your own Google Sheet.

---

## ✨ Features

- **Google Sign-In** — Secure OAuth 2.0 authentication
- **Income / Expense / Loan tracking** — With categories and descriptions
- **Real-time sync** — Firebase Firestore keeps data live across devices
- **Google Sheets backup** — Each user gets their own sheet; all transactions sync automatically
- **Analytics** — Monthly bar chart, category breakdown, savings rate, budget health
- **Search & filter** — Find any transaction instantly
- **Cross-platform** — iOS, Android, and Web (PWA) via Expo

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React Native + Expo |
| Auth | Firebase Auth + Google OAuth |
| Database | Firebase Firestore (real-time) |
| Data backup | Google Sheets API via Cloud Functions |
| State | Zustand |
| Backend | Firebase Cloud Functions (Node 20) |
| Hosting | Firebase Hosting |

---

## 🚀 Getting Started

### 1. Clone and install

```bash
git clone https://github.com/yourname/expense-tracker.git
cd expense-tracker
npm install
cd firebase/functions && npm install && cd ../..
```

### 2. Set up Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** → Sign-in methods → **Google**
4. Enable **Firestore Database** (start in production mode)
5. Enable **Realtime Database**
6. Go to Project Settings → General → Your apps → Add Web app
7. Copy the config values

### 3. Set up Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the **Google Sheets API** and **Google Drive API**
3. Create a **Service Account** (for Cloud Functions)
4. Download the service account JSON key
5. Set Firebase Function config:

```bash
firebase functions:config:set \
  sheets.service_account_email="your-sa@project.iam.gserviceaccount.com" \
  sheets.private_key="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 4. Configure environment variables

```bash
cp .env.example .env
# Fill in all values in .env
```

### 5. Deploy Firebase

```bash
# Deploy Firestore rules and indexes
firebase deploy --only firestore

# Deploy Cloud Functions
firebase deploy --only functions
```

### 6. Run the app

```bash
# Start Expo development server
npm start

# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

---

## 📁 Project Structure

```
expense-tracker/
├── App.js                          # Root entry point
├── app.json                        # Expo config
├── firebase.json                   # Firebase deploy config
├── .env.example                    # Environment variable template
│
├── app/
│   ├── components/
│   │   └── AddTransactionModal.js  # Add income/expense/loan sheet
│   ├── hooks/
│   │   └── useAuth.js              # Auth state + Google OAuth hook
│   ├── navigation/
│   │   └── AppNavigator.js         # Stack + Tab navigator
│   ├── screens/
│   │   ├── LoginScreen.js          # Google sign-in screen
│   │   ├── HomeScreen.js           # Dashboard + recent transactions
│   │   ├── TransactionsScreen.js   # Full transaction list + search
│   │   ├── AnalyticsScreen.js      # Charts and spending analysis
│   │   └── ProfileScreen.js        # User info + Sheets management
│   ├── services/
│   │   ├── authService.js          # Firebase Auth helpers
│   │   └── sheetsService.js        # Cloud Function callers
│   ├── store/
│   │   └── index.js                # Zustand stores (auth + transactions)
│   └── utils/
│       └── constants.js            # Theme, categories, currency helpers
│
├── firebase/
│   ├── config.js                   # Firebase app initialization
│   ├── firestore.rules             # Security rules
│   ├── firestore.indexes.json      # Composite indexes
│   └── functions/
│       ├── index.js                # Cloud Functions (Sheets sync)
│       └── package.json
│
└── __tests__/
    └── store.test.js               # Unit tests
```

---

## 🔐 Security

- All user data is scoped by UID in Firestore (`users/{uid}/transactions`)
- Firestore security rules prevent cross-user data access
- Google OAuth tokens are never stored locally
- Service account credentials are stored only in Firebase Function config (never in code)
- `.env` and credential files are gitignored

---

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm test -- --coverage
```

Test coverage targets (from plan.md):
- Unit tests: 80% code coverage
- Integration tests: All API endpoints
- E2E tests: Critical user flows

---

## 📦 Building for Production

### iOS (via EAS Build)
```bash
npm install -g eas-cli
eas login
eas build --platform ios
```

### Android
```bash
eas build --platform android
```

### Web
```bash
npx expo export --platform web
firebase deploy --only hosting
```

---

## 🗺️ Roadmap (from plan.md)

- [x] Phase 1: Foundation (Firebase + Auth + React Native setup)
- [x] Phase 2: Core features (Transaction form, Dashboard, List view)
- [x] Phase 3: Google Sheets integration (Sheets API, auto-sync)
- [x] Phase 4: Analytics (Charts, category breakdown, budget health)
- [ ] Phase 4 remaining: Export to CSV, Push notifications
- [ ] Phase 5: Testing & App Store submission
- [ ] Future: Offline mode, Desktop app, Multi-currency

---

## 📄 License

MIT License — see LICENSE file.

---

Built with ❤️ using React Native & Firebase
