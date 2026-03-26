// __tests__/store.test.js
import { useTransactionStore, useAuthStore } from '../app/store';
import {
  formatCurrency, formatDate, formatShortDate, getCategoryMeta,
  CATEGORIES, COLORS, THEME, ALL_CATEGORIES
} from '../app/utils/constants';

// ─── Utils ────────────────────────────────────────────────────────────────────
describe('formatCurrency', () => {
  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toContain('0');
  });
  it('formats a positive number', () => {
    expect(formatCurrency(42580)).toContain('42,580');
  });
  it('includes the rupee symbol', () => {
    expect(formatCurrency(100)).toContain('₹');
  });
  it('formats negative numbers', () => {
    expect(formatCurrency(-500)).toContain('500');
  });
});

describe('formatDate', () => {
  it('formats a Date object', () => {
    const date = new Date('2024-03-15');
    const result = formatDate(date);
    expect(result).toContain('Mar');
    expect(result).toContain('2024');
  });
  it('formats an ISO string', () => {
    const result = formatDate('2024-06-20T12:00:00Z');
    expect(result).toContain('Jun');
  });
});

describe('formatShortDate', () => {
  it('formats date without year', () => {
    const date = new Date('2024-12-25');
    const result = formatShortDate(date);
    expect(result).toContain('Dec');
    expect(result).toContain('25');
  });
});

describe('getCategoryMeta', () => {
  it('returns correct icon for known category', () => {
    expect(getCategoryMeta('food').icon).toBe('🍛');
  });
  it('returns fallback for unknown category', () => {
    const meta = getCategoryMeta('unknown_xyz');
    expect(meta.icon).toBe('📦');
  });
  it('returns correct label for income category', () => {
    expect(getCategoryMeta('salary').label).toBe('Salary');
  });
  it('returns correct icon for loan category', () => {
    expect(getCategoryMeta('lent').icon).toBe('🤝');
  });
});

describe('Constants', () => {
  it('has all transaction categories', () => {
    expect(CATEGORIES.income.length).toBeGreaterThan(0);
    expect(CATEGORIES.expense.length).toBeGreaterThan(0);
    expect(CATEGORIES.loan.length).toBeGreaterThan(0);
  });
  it('ALL_CATEGORIES combines all categories', () => {
    const expectedLength = CATEGORIES.income.length + CATEGORIES.expense.length + CATEGORIES.loan.length;
    expect(ALL_CATEGORIES.length).toBe(expectedLength);
  });
  it('COLORS has required keys', () => {
    expect(COLORS.income).toBeDefined();
    expect(COLORS.expense).toBeDefined();
    expect(COLORS.loan).toBeDefined();
  });
  it('THEME.dark has required colors', () => {
    expect(THEME.dark.bg).toBeDefined();
    expect(THEME.dark.text).toBeDefined();
    expect(THEME.dark.blue).toBeDefined();
  });
});

// ─── Auth Store ──────────────────────────────────────────────────────────────
describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, loading: true, spreadsheetId: null });
  });

  it('sets user correctly', () => {
    const { setUser } = useAuthStore.getState();
    setUser({ uid: '123', email: 'test@example.com' });
    expect(useAuthStore.getState().user).toEqual({ uid: '123', email: 'test@example.com' });
  });

  it('sets loading state', () => {
    const { setLoading } = useAuthStore.getState();
    setLoading(false);
    expect(useAuthStore.getState().loading).toBe(false);
  });

  it('sets spreadsheetId', () => {
    const { setSpreadsheetId } = useAuthStore.getState();
    setSpreadsheetId('sheet123');
    expect(useAuthStore.getState().spreadsheetId).toBe('sheet123');
  });

  it('clears user on signOut', () => {
    useAuthStore.setState({ user: { uid: '123' }, spreadsheetId: 'sheet123' });
    const { signOut } = useAuthStore.getState();
    signOut();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().spreadsheetId).toBeNull();
  });
});

// ─── Transaction Store ────────────────────────────────────────────────────────
describe('useTransactionStore.getTotals', () => {
  beforeEach(() => {
    useTransactionStore.setState({
      transactions: [
        { id: '1', type: 'income', amount: 35000, description: 'Salary', category: 'salary', date: new Date().toISOString() },
        { id: '2', type: 'expense', amount: 4200, description: 'Mess', category: 'food', date: new Date().toISOString() },
        { id: '3', type: 'expense', amount: 890, description: 'Ola', category: 'transport', date: new Date().toISOString() },
        { id: '4', type: 'loan', amount: 2000, description: 'Lent', category: 'lent', date: new Date().toISOString() },
      ],
    });
  });

  it('calculates income total correctly', () => {
    const { getTotals } = useTransactionStore.getState();
    expect(getTotals().income).toBe(35000);
  });

  it('calculates expense total correctly', () => {
    const { getTotals } = useTransactionStore.getState();
    expect(getTotals().expense).toBe(5090);
  });

  it('calculates loan total correctly', () => {
    const { getTotals } = useTransactionStore.getState();
    expect(getTotals().loan).toBe(2000);
  });

  it('returns zeros for empty transactions', () => {
    useTransactionStore.setState({ transactions: [] });
    const { getTotals } = useTransactionStore.getState();
    expect(getTotals()).toEqual({ income: 0, expense: 0, loan: 0 });
  });
});

describe('useTransactionStore.getByCategory', () => {
  beforeEach(() => {
    useTransactionStore.setState({
      transactions: [
        { id: '1', type: 'expense', amount: 4200, category: 'food' },
        { id: '2', type: 'expense', amount: 890, category: 'transport' },
        { id: '3', type: 'expense', amount: 1200, category: 'food' },
        { id: '4', type: 'income', amount: 35000, category: 'salary' }, // should be excluded
      ],
    });
  });

  it('aggregates expenses by category', () => {
    const { getByCategory } = useTransactionStore.getState();
    const cats = getByCategory();
    const food = cats.find((c) => c.name === 'food');
    expect(food?.amount).toBe(5400);
  });

  it('excludes income from category breakdown', () => {
    const { getByCategory } = useTransactionStore.getState();
    const cats = getByCategory();
    const salary = cats.find((c) => c.name === 'salary');
    expect(salary).toBeUndefined();
  });

  it('sorts categories by amount descending', () => {
    const { getByCategory } = useTransactionStore.getState();
    const cats = getByCategory();
    expect(cats[0].amount).toBeGreaterThanOrEqual(cats[1].amount);
  });

  it('returns empty array for no expenses', () => {
    useTransactionStore.setState({ transactions: [{ type: 'income', amount: 1000, category: 'salary' }] });
    const { getByCategory } = useTransactionStore.getState();
    expect(getByCategory()).toEqual([]);
  });
});

describe('useTransactionStore.getMonthlyData', () => {
  it('returns 6 months of data', () => {
    useTransactionStore.setState({ transactions: [] });
    const { getMonthlyData } = useTransactionStore.getState();
    const data = getMonthlyData();
    expect(data.length).toBe(6);
  });

  it('aggregates transactions by month', () => {
    const now = new Date();
    useTransactionStore.setState({
      transactions: [
        { type: 'income', amount: 5000, date: now.toISOString() },
        { type: 'expense', amount: 2000, date: now.toISOString() },
      ],
    });
    const { getMonthlyData } = useTransactionStore.getState();
    const data = getMonthlyData();
    const currentMonth = data[data.length - 1];
    expect(currentMonth.income).toBe(5000);
    expect(currentMonth.expense).toBe(2000);
  });
});

describe('useTransactionStore.clear', () => {
  it('clears all transactions and state', () => {
    useTransactionStore.setState({
      transactions: [{ id: '1', type: 'income', amount: 100 }],
      lastSynced: new Date(),
    });
    const { clear } = useTransactionStore.getState();
    clear();
    const state = useTransactionStore.getState();
    expect(state.transactions).toEqual([]);
    expect(state.lastSynced).toBeNull();
  });
});
