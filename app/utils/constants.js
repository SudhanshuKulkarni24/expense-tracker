// app/utils/constants.js

export const CURRENCY = {
  symbol: '₹',
  code: 'INR',
  locale: 'en-IN',
};

export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
  LOAN: 'loan',
};

export const CATEGORIES = {
  income: [
    { id: 'salary', label: 'Salary', icon: '💼' },
    { id: 'freelance', label: 'Freelance', icon: '💻' },
    { id: 'business', label: 'Business', icon: '🏢' },
    { id: 'investment', label: 'Investment', icon: '📈' },
    { id: 'gift', label: 'Gift', icon: '🎁' },
    { id: 'other_income', label: 'Other', icon: '📦' },
  ],
  expense: [
    { id: 'food', label: 'Food & Dining', icon: '🍛' },
    { id: 'transport', label: 'Transport', icon: '🚗' },
    { id: 'shopping', label: 'Shopping', icon: '🛍️' },
    { id: 'bills', label: 'Bills & Utilities', icon: '💡' },
    { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
    { id: 'health', label: 'Health', icon: '💊' },
    { id: 'education', label: 'Education', icon: '📚' },
    { id: 'travel', label: 'Travel', icon: '✈️' },
    { id: 'other_expense', label: 'Other', icon: '📦' },
  ],
  loan: [
    { id: 'lent', label: 'Lent to someone', icon: '🤝' },
    { id: 'borrowed', label: 'Borrowed', icon: '💰' },
    { id: 'repaid', label: 'Repaid', icon: '✅' },
    { id: 'received_back', label: 'Received back', icon: '🔄' },
  ],
};

export const ALL_CATEGORIES = [
  ...CATEGORIES.income,
  ...CATEGORIES.expense,
  ...CATEGORIES.loan,
];

export const getCategoryMeta = (id) =>
  ALL_CATEGORIES.find((c) => c.id === id) || { label: id, icon: '📦' };

export const COLORS = {
  income: '#22d190',
  expense: '#ff5f6d',
  loan: '#f5a623',
  incomeLight: '#22d19022',
  expenseLight: '#ff5f6d22',
  loanLight: '#f5a62322',
};

// ─── Theme ───────────────────────────────────────────────────────────────────
export const THEME = {
  dark: {
    bg: '#0f1117',
    bg2: '#181c27',
    bg3: '#1e2333',
    bg4: '#252b3d',
    border: '#ffffff18',
    border2: '#ffffff28',
    text: '#e8eaf0',
    text2: '#9aa0b4',
    text3: '#616880',
    blue: '#4e8df5',
    green: '#22d190',
    red: '#ff5f6d',
    amber: '#f5a623',
    purple: '#a78bfa',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function formatCurrency(amount) {
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date) {
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatShortDate(date) {
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
