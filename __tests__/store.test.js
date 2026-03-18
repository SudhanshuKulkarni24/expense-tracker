// __tests__/store.test.js
import { useTransactionStore } from '../app/store';
import { formatCurrency, formatDate, getCategoryMeta } from '../app/utils/constants';

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
});

describe('getCategoryMeta', () => {
  it('returns correct icon for known category', () => {
    expect(getCategoryMeta('food').icon).toBe('🍛');
  });
  it('returns fallback for unknown category', () => {
    const meta = getCategoryMeta('unknown_xyz');
    expect(meta.icon).toBe('📦');
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
});
