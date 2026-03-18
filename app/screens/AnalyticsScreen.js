// app/screens/AnalyticsScreen.js
import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, Dimensions,
} from 'react-native';
import { useTransactionStore } from '../store';
import { THEME, formatCurrency, COLORS } from '../utils/constants';

const T = THEME.dark;
const W = Dimensions.get('window').width - 32;

export default function AnalyticsScreen() {
  const { getTotals, getByCategory, getMonthlyData } = useTransactionStore();

  const totals = getTotals();
  const byCategory = getByCategory();
  const monthly = getMonthlyData();

  const maxMonthly = useMemo(
    () => Math.max(...monthly.flatMap((m) => [m.income, m.expense]), 1),
    [monthly]
  );

  const maxCat = useMemo(
    () => Math.max(...byCategory.map((c) => c.amount), 1),
    [byCategory]
  );

  const savingsRate = totals.income > 0
    ? Math.round(((totals.income - totals.expense) / totals.income) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.screenTitle}>Analytics</Text>

        {/* Summary cards */}
        <View style={styles.cardRow}>
          <StatCard label="Net Balance" value={formatCurrency(totals.income - totals.expense)} color={T.green} />
          <StatCard label="Savings Rate" value={`${savingsRate}%`} color={T.blue} />
        </View>
        <View style={styles.cardRow}>
          <StatCard label="Total In" value={formatCurrency(totals.income)} color={T.green} />
          <StatCard label="Total Out" value={formatCurrency(totals.expense)} color={T.red} />
        </View>

        {/* Monthly chart */}
        <SectionTitle>Monthly overview</SectionTitle>
        <View style={styles.chart}>
          {monthly.map((m, i) => {
            const incH = Math.round((m.income / maxMonthly) * 120);
            const expH = Math.round((m.expense / maxMonthly) * 120);
            return (
              <View key={i} style={styles.barGroup}>
                <View style={styles.barPair}>
                  {m.income > 0 && (
                    <View style={[styles.bar, { height: incH, backgroundColor: T.green }]} />
                  )}
                  {m.expense > 0 && (
                    <View style={[styles.bar, { height: expH, backgroundColor: T.red }]} />
                  )}
                </View>
                <Text style={styles.barLabel}>{m.label}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: T.green }]} />
            <Text style={styles.legendText}>Income</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: T.red }]} />
            <Text style={styles.legendText}>Expense</Text>
          </View>
        </View>

        {/* Category breakdown */}
        {byCategory.length > 0 && (
          <>
            <SectionTitle>Spending by category</SectionTitle>
            <View style={styles.catList}>
              {byCategory.map((cat, i) => {
                const pct = Math.round((cat.amount / maxCat) * 100);
                return (
                  <View key={i} style={styles.catRow}>
                    <Text style={styles.catLabel}>{cat.name}</Text>
                    <View style={styles.catBarBg}>
                      <View style={[styles.catBar, { width: `${pct}%` }]} />
                    </View>
                    <Text style={styles.catValue}>{formatCurrency(cat.amount)}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Expense ratio */}
        {totals.income > 0 && (
          <>
            <SectionTitle>Budget health</SectionTitle>
            <View style={styles.ratioCard}>
              <View style={styles.ratioBg}>
                <View style={[styles.ratioFill, {
                  width: `${Math.min(100, Math.round((totals.expense / totals.income) * 100))}%`,
                  backgroundColor: totals.expense > totals.income ? T.red : T.green,
                }]} />
              </View>
              <View style={styles.ratioRow}>
                <Text style={styles.ratioText}>
                  {Math.round((totals.expense / totals.income) * 100)}% of income spent
                </Text>
                <Text style={[styles.ratioStatus, {
                  color: totals.expense > totals.income * 0.8 ? T.red : T.green,
                }]}>
                  {totals.expense > totals.income ? 'Over budget' :
                    totals.expense > totals.income * 0.8 ? 'Caution' : 'On track'}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, color }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function SectionTitle({ children }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  screenTitle: {
    fontSize: 24, fontWeight: '700', color: T.text,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, letterSpacing: -0.4,
  },

  cardRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 10 },
  statCard: {
    flex: 1, backgroundColor: T.bg3, borderRadius: 14, borderWidth: 1,
    borderColor: T.border, padding: 16,
  },
  statLabel: { fontSize: 11, color: T.text2, letterSpacing: 0.5, marginBottom: 6 },
  statValue: { fontSize: 20, fontWeight: '700' },

  sectionTitle: {
    fontSize: 15, fontWeight: '600', color: T.text,
    paddingHorizontal: 20, marginTop: 24, marginBottom: 14,
  },

  chart: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end',
    paddingHorizontal: 16, height: 150, backgroundColor: T.bg3,
    marginHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: T.border,
    paddingVertical: 16,
  },
  barGroup: { alignItems: 'center', gap: 6 },
  barPair: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 120 },
  bar: { width: 12, borderRadius: 4 },
  barLabel: { fontSize: 11, color: T.text3 },

  legend: { flexDirection: 'row', gap: 20, paddingHorizontal: 20, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: T.text2 },

  catList: { paddingHorizontal: 16 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  catLabel: { fontSize: 13, color: T.text2, width: 80 },
  catBarBg: { flex: 1, backgroundColor: T.bg3, borderRadius: 4, height: 20, overflow: 'hidden' },
  catBar: { height: '100%', backgroundColor: T.red, borderRadius: 4 },
  catValue: { fontSize: 13, color: T.text, fontWeight: '500', width: 70, textAlign: 'right' },

  ratioCard: {
    marginHorizontal: 16, backgroundColor: T.bg3, borderRadius: 14,
    borderWidth: 1, borderColor: T.border, padding: 16,
  },
  ratioBg: {
    backgroundColor: T.bg4, borderRadius: 6, height: 12, marginBottom: 12, overflow: 'hidden',
  },
  ratioFill: { height: '100%', borderRadius: 6 },
  ratioRow: { flexDirection: 'row', justifyContent: 'space-between' },
  ratioText: { fontSize: 13, color: T.text2 },
  ratioStatus: { fontSize: 13, fontWeight: '600' },
});
