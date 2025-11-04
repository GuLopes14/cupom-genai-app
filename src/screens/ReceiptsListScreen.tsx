import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import firestoreService from '../services/firestore';
import { Receipt, monthKey } from '../types';

export default function ReceiptsListScreen() {
  const [items, setItems] = useState<Receipt[]>([]);
  const [month, setMonth] = useState<string>(monthKey(new Date()));
  const [category, setCategory] = useState<string | undefined>();

  // Helpers de mês
  const currentMonth = monthKey(new Date());
  const addMonths = (mKey: string, delta: number) => {
    const [y, m] = mKey.split('-').map(Number);
    const d = new Date(y, (m - 1) + delta, 1);
    return monthKey(d);
  };
  const prevMonth = () => setMonth(addMonths(month, -1));
  const nextMonth = () => setMonth(addMonths(month, 1));
  const isCurrent = month === currentMonth;
  const monthLabel = useMemo(() => {
    const d = new Date(Number(month.slice(0, 4)), Number(month.slice(5)) - 1, 1);
    return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [month]);

  const load = useCallback(async () => {
    const rows = await firestoreService.listReceipts({ month, category });
    setItems(rows);
  }, [month, category]);

  // Recarrega quando a aba/tela entra em foco
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  const total = useMemo(() => items.reduce((s: number, r: Receipt) => s + (r.total || 0), 0), [items]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registros — {monthLabel}</Text>
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
        <TouchableOpacity style={styles.chip} onPress={() => setCategory(undefined)}>
          <Text>Todas categorias</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i: Receipt) => i.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshing={refreshing}
        onRefresh={onRefresh}
        renderItem={({ item }: { item: Receipt }) => (
          <View style={styles.card}>
            <Text style={styles.merchant}>{item.merchant}</Text>
            <Text>R$ {item.total.toFixed(2)} • {item.category}</Text>
            <Text style={styles.date}>{new Date(item.dateTime).toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ marginTop: 16 }}>Sem registros.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { marginBottom: 8 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'center', justifyContent: 'space-between' },
  chip: { backgroundColor: '#eee', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20 },
  chipDisabled: { opacity: 0.5 },
  chipDisabledText: { color: '#666' },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 10 },
  merchant: { fontWeight: '700', marginBottom: 4 },
  date: { fontSize: 12, color: '#666' },
});
