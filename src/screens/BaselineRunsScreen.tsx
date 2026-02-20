import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { tokens } from '../styles/tokens';
import { db } from '../firebase/firestore';

type RunRow = {
  id: string;
  subject: string;
  stageId: string;
  status: string;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  counts?: { skills?: number; templates?: number; sampleItems?: number };
};

const toDateSafe = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  return null;
};

const formatDate = (date?: Date | null) => {
  if (!date) return '—';
  return date.toLocaleString();
};

const formatDuration = (start?: Date | null, end?: Date | null) => {
  if (!start || !end) return '—';
  const ms = Math.max(0, end.getTime() - start.getTime());
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
};

export const BaselineRunsScreen: React.FC = () => {
  const [runs, setRuns] = React.useState<RunRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const runsQuery = query(collection(db, 'baselineGenerationRuns'), orderBy('startedAt', 'desc'));
    const unsub = onSnapshot(runsQuery, (snap) => {
      const rows: RunRow[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        rows.push({
          id: docSnap.id,
          subject: data.subject,
          stageId: data.stageId,
          status: data.status,
          startedAt: toDateSafe(data.startedAt),
          finishedAt: toDateSafe(data.finishedAt),
          counts: data.counts,
        });
      });
      setRuns(rows);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Active Runs</Text>
      <Text style={styles.subtitle}>Monitor baseline generation status and outputs.</Text>

      <View style={styles.card}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Run</Text>
          <Text style={styles.tableHeaderText}>Subject</Text>
          <Text style={styles.tableHeaderText}>Stage</Text>
          <Text style={styles.tableHeaderText}>Status</Text>
          <Text style={styles.tableHeaderText}>Duration</Text>
        </View>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : runs.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No runs yet.</Text>
          </View>
        ) : (
          runs.map((run) => (
            <View key={run.id} style={styles.tableRow}>
              <Text style={styles.tableCell}>{run.id.slice(0, 8)}</Text>
              <Text style={styles.tableCell}>{run.subject}</Text>
              <Text style={styles.tableCell}>{run.stageId}</Text>
              <Text style={styles.tableCell}>{run.status}</Text>
              <Text style={styles.tableCell}>{formatDuration(run.startedAt, run.finishedAt)}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Runs</Text>
        <Text style={styles.cardText}>Latest runs with output counts.</Text>
        {runs.slice(0, 3).map((run) => (
          <View key={`${run.id}-summary`} style={styles.summaryRow}>
            <Text style={styles.summaryTitle}>
              {run.subject} · {run.stageId}
            </Text>
            <Text style={styles.summaryText}>
              Skills: {run.counts?.skills ?? 0} · Templates: {run.counts?.templates ?? 0} · Samples: {run.counts?.sampleItems ?? 0}
            </Text>
            <Text style={styles.summaryText}>Finished: {formatDate(run.finishedAt)}</Text>
          </View>
        ))}
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
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cardText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 6 },
  summaryRow: {
    marginTop: tokens.spacing.md,
    padding: tokens.spacing.md,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  summaryTitle: { color: '#fff', fontSize: 12, fontWeight: '700' },
  summaryText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 4 },
});
