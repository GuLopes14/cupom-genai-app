import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import firestoreService from '../services/firestore';
import { generateInsightsFromSummary } from '../services/receiptAI';
import { Receipt, monthKey } from '../types';

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max > 0 ? Math.max(4, (value / max) * 220) : 0;
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={{ fontSize: 12 }}>{label} • R$ {value.toFixed(2)}</Text>
      <View style={{ height: 10, backgroundColor: '#eee', borderRadius: 6 }}>
        <View style={{ width, height: 10, backgroundColor: '#4285F4', borderRadius: 6 }} />
      </View>
    </View>
  );
}

export default function InsightsScreen() {
  const [month, setMonth] = useState<string>(monthKey(new Date()));
  const [rows, setRows] = useState<Receipt[]>([]);
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Helpers de navegação por mês
  const currentMonth = monthKey(new Date());
  const addMonths = (mKey: string, delta: number) => {
    const [y, m] = mKey.split('-').map(Number);
    const d = new Date(y, (m - 1) + delta, 1);
    return monthKey(d);
  };
  const prevMonth = () => setMonth(addMonths(month, -1));
  const nextMonth = () => setMonth(addMonths(month, 1));
  const isCurrent = month === currentMonth;
  const monthLabel = React.useMemo(() => {
    const d = new Date(Number(month.slice(0, 4)), Number(month.slice(5)) - 1, 1);
    return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [month]);

  useEffect(() => {
    (async () => {
      const list = await firestoreService.listReceipts({ month });
      setRows(list);
    })();
    setInsights('');
  }, [month]);

  const byCat = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const r of rows) acc[r.category] = (acc[r.category] || 0) + (r.total || 0);
    return acc;
  }, [rows]);

  const max = useMemo(() => Math.max(0, ...Object.values(byCat) as number[]), [byCat]);
  const total = useMemo(() => rows.reduce((s: number, r: Receipt) => s + (r.total || 0), 0), [rows]);

  const runInsights = async () => {
    setLoading(true);
    try {
      const summary = JSON.stringify({ month, total, byCat });
      const txt = await generateInsightsFromSummary(summary);
      setInsights(txt);
      await firestoreService.addInsight(txt, month);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Insights — {monthLabel}</Text>
      <Text style={styles.subtitle}>Total do mês: R$ {total.toFixed(2)}</Text>

      <View style={styles.filters}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.chip} onPress={prevMonth}>
            <Text>◀ Mês anterior</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, isCurrent && styles.chipDisabled]} onPress={() => !isCurrent && nextMonth()}>
            <Text style={isCurrent ? styles.chipDisabledText : undefined}>Próximo mês ▶</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chip} onPress={() => setMonth(currentMonth)}>
            <Text>Mês atual</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.chart}>
        {Object.entries(byCat).map(([k, v]) => (
          <View key={String(k)}>
            <Bar label={String(k)} value={Number(v)} max={max as number} />
          </View>
        ))}
        {Object.keys(byCat).length === 0 && <Text>Nenhum dado para o mês.</Text>}
      </View>

      <TouchableOpacity style={styles.button} onPress={runInsights} disabled={loading}>
        <Text style={styles.buttonTxt}>{loading ? 'Gerando…' : 'Gerar Insights com IA'}</Text>
      </TouchableOpacity>

      {!!insights && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Insights</Text>
          <Text>{insights}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { marginBottom: 12 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'center', justifyContent: 'space-between' },
  chip: { backgroundColor: '#eee', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20 },
  chipDisabled: { opacity: 0.5 },
  chipDisabledText: { color: '#666' },
  chart: { marginVertical: 12 },
  button: { backgroundColor: '#4285F4', padding: 12, borderRadius: 10, alignItems: 'center' },
  buttonTxt: { color: '#fff', fontWeight: '700' },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginTop: 12 },
  cardTitle: { fontWeight: '700', marginBottom: 6 },
});
