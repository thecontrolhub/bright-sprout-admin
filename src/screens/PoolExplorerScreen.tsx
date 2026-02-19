import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { collectionGroup, onSnapshot, query } from 'firebase/firestore';
import { tokens } from '../styles/tokens';
import { db } from '../firebase/firestore';

type PoolRow = {
  id: string;
  skillId: string;
  subject: string;
  stageId: string;
  templates: number;
  counts?: { perDifficulty?: number };
};

export const PoolExplorerScreen: React.FC = () => {
  const [rows, setRows] = React.useState<PoolRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const poolQuery = query(collectionGroup(db, 'skills'));
    const unsub = onSnapshot(poolQuery, (snap) => {
      const next: PoolRow[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (!data?.skillId) return;
        next.push({
          id: docSnap.id,
          skillId: data.skillId,
          subject: data.subject,
          stageId: data.stageId,
          templates: Array.isArray(data.templates) ? data.templates.length : 0,
          counts: data.counts,
        });
      });
      setRows(next);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Pool Explorer</Text>
      <Text style={styles.subtitle}>Inspect template pools and skill coverage.</Text>

      <View style={styles.card}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Skill</Text>
          <Text style={styles.tableHeaderText}>Subject</Text>
          <Text style={styles.tableHeaderText}>Stage</Text>
          <Text style={styles.tableHeaderText}>Templates</Text>
        </View>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : rows.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No pool specs found.</Text>
          </View>
        ) : (
          rows.map((row) => (
            <View key={`${row.subject}-${row.stageId}-${row.skillId}`} style={styles.tableRow}>
              <Text style={styles.tableCell}>{row.skillId}</Text>
              <Text style={styles.tableCell}>{row.subject}</Text>
              <Text style={styles.tableCell}>{row.stageId}</Text>
              <Text style={styles.tableCell}>{row.templates}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: tokens.spacing.xl, gap: tokens.spacing.lg, paddingBottom: 64 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  tableHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  tableHeaderText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', flex: 1 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  tableCell: { color: '#fff', fontSize: 11, flex: 1 },
  loadingRow: { paddingVertical: 16, alignItems: 'center' },
  emptyRow: { paddingVertical: 16, alignItems: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
});
