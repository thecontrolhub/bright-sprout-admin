import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { collection, collectionGroup, onSnapshot, query } from 'firebase/firestore';
import { tokens } from '../styles/tokens';
import { db } from '../firebase/firestore';
import { useNavigation } from '../navigation/NavigationContext';

type PoolRow = {
  id: string;
  skillId: string;
  subject: string;
  stageId: string;
  version?: string;
  templates: number;
  reviewStatus?: 'pending' | 'approved' | 'changes' | 'rejected';
  poolPath: string;
};

export const CurriculumBaselineScreen: React.FC = () => {
  const [rows, setRows] = React.useState<PoolRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<Record<string, any[]>>({});
  const { navigate } = useNavigation();

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
          version: data.version,
          templates: Array.isArray(data.templates) ? data.templates.length : 0,
          reviewStatus: data.reviewStatus || 'pending',
          poolPath: docSnap.ref.path,
        });
      });
      setRows(next);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  React.useEffect(() => {
    if (!expanded) return;
    const row = rows.find((r) => r.skillId === expanded);
    if (!row?.subject || !row?.stageId || !row?.version) return;
    const poolDocId = `${row.subject}_${row.stageId}_${row.version}`;
    const itemsRef = collection(db, 'baselineItems', poolDocId, 'skills', row.skillId, 'items');
    const unsub = onSnapshot(itemsRef, (snap) => {
      const next: any[] = [];
      snap.forEach((docSnap) => next.push({ id: docSnap.id, ...docSnap.data() }));
      setItems((prev) => ({ ...prev, [row.skillId]: next }));
    });
    return () => unsub();
  }, [expanded, rows]);

  const statusStyle = React.useCallback((status?: PoolRow['reviewStatus']) => {
    switch (status) {
      case 'approved':
        return styles.status_approved;
      case 'changes':
        return styles.status_changes;
      case 'rejected':
        return styles.status_rejected;
      default:
        return styles.status_pending;
    }
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Curriculum · Baseline</Text>
      <Text style={styles.subtitle}>Review generated baseline items and approve pools for use.</Text>

      <View style={styles.card}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colSkill]}>Skill</Text>
          <Text style={[styles.tableHeaderText, styles.colSubject]}>Subject</Text>
          <Text style={[styles.tableHeaderText, styles.colStage]}>Stage</Text>
          <Text style={[styles.tableHeaderText, styles.colTemplates]}>Templates</Text>
          <Text style={styles.tableHeaderText}>Status</Text>
          <Text style={[styles.tableHeaderText, styles.tableHeaderAction]}>Actions</Text>
        </View>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : rows.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No baseline pools found.</Text>
          </View>
        ) : (
          rows.map((row) => (
            <View key={`${row.subject}-${row.stageId}-${row.skillId}`} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colSkill]} numberOfLines={1}>{row.skillId}</Text>
              <Text style={[styles.tableCell, styles.colSubject]} numberOfLines={1}>{row.subject}</Text>
              <Text style={[styles.tableCell, styles.colStage]} numberOfLines={1}>{row.stageId}</Text>
              <Text style={[styles.tableCell, styles.colTemplates]} numberOfLines={1}>{row.templates}</Text>
              <View style={styles.statusCell}>
                <Text style={[styles.statusPill, statusStyle(row.reviewStatus)]}>
                  {(row.reviewStatus || 'pending').toUpperCase()}
                </Text>
              </View>
              <View style={styles.actionCell}>
                <Pressable
                  onPress={() => setExpanded((prev) => (prev === row.skillId ? null : row.skillId))}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionButtonText}>{expanded === row.skillId ? 'Hide' : 'View Items'}</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>

      {expanded && (
        <View style={styles.itemsCard}>
          <Text style={styles.sectionTitle}>Baseline Items · {expanded}</Text>
          {(items[expanded] || []).length === 0 ? (
            <Text style={styles.emptyText}>No items generated for this skill.</Text>
          ) : (
            (items[expanded] || []).slice(0, 20).map((item) => (
              <View key={item.itemId} style={styles.itemRowCard}>
                <Text style={styles.itemPrompt}>{item.prompt?.text || item.prompt?.audioText || '—'}</Text>
                <View style={styles.itemMetaRow}>
                  <Text style={styles.itemMeta}>Template: {item.templateId}</Text>
                  <Text style={styles.itemMeta}>Difficulty: {item.difficulty}</Text>
                </View>
                <Text style={styles.itemMeta}>Answer: {String(item.correctAnswer)}</Text>
                <Text style={styles.itemMeta}>Choices: {(item.choices || []).join(', ')}</Text>
              </View>
            ))
          )}
          <Pressable
            onPress={() => {
              const row = rows.find((r) => r.skillId === expanded);
              if (row) navigate('poolReview', { poolPath: row.poolPath });
            }}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>Open full review</Text>
          </Pressable>
        </View>
      )}
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
  tableHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
  tableHeaderText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', flex: 1 },
  tableHeaderAction: { textAlign: 'right' },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center' },
  tableCell: { color: '#fff', fontSize: 11, flex: 1, paddingRight: 6 },
  colSkill: { flex: 2.4 },
  colSubject: { flex: 1 },
  colStage: { flex: 0.8 },
  colTemplates: { flex: 0.8 },
  statusCell: { flex: 1, justifyContent: 'center' },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  status_pending: { backgroundColor: 'rgba(255,255,255,0.2)' },
  status_approved: { backgroundColor: 'rgba(46, 204, 113, 0.5)' },
  status_changes: { backgroundColor: 'rgba(241, 196, 15, 0.5)' },
  status_rejected: { backgroundColor: 'rgba(231, 76, 60, 0.5)' },
  actionCell: { flex: 1, alignItems: 'flex-end', justifyContent: 'center' },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(122, 92, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(122, 92, 255, 0.6)',
  },
  actionButtonText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  loadingRow: { paddingVertical: 16, alignItems: 'center' },
  emptyRow: { paddingVertical: 16, alignItems: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  itemsCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 8 },
  itemRowCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  itemPrompt: { color: '#fff', fontSize: 12, marginBottom: 6 },
  itemMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  itemMeta: { color: 'rgba(255,255,255,0.65)', fontSize: 10 },
  linkButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  linkText: { color: '#d6ccff', fontSize: 11, fontWeight: '700' },
});
