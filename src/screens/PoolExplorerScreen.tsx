import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { collectionGroup, onSnapshot, query } from 'firebase/firestore';
import { tokens } from '../styles/tokens';
import { db } from '../firebase/firestore';
import { useNavigation } from '../navigation/NavigationContext';
import { startBaselineGeneration } from '../firebase/functions';

type PoolRow = {
  id: string;
  skillId: string;
  subject: string;
  stageId: string;
  templates: number;
  counts?: { perDifficulty?: number };
  templateIds?: string[];
  reviewStatus?: 'pending' | 'approved' | 'changes' | 'rejected';
  reviewNotes?: string;
  reviewedAt?: any;
  reviewedBy?: string;
  poolPath: string;
};

export const PoolExplorerScreen: React.FC = () => {
  const [rows, setRows] = React.useState<PoolRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'pending' | 'approved' | 'changes' | 'rejected'>('all');
  const { navigate } = useNavigation();
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [viewMode, setViewMode] = React.useState<'compact' | 'comfortable'>('comfortable');
  const [regenDifficulty, setRegenDifficulty] = React.useState<1 | 2 | 3>(1);
  const [regenLoading, setRegenLoading] = React.useState<string | null>(null);
  const [regenError, setRegenError] = React.useState('');

  React.useEffect(() => {
    const poolQuery = query(collectionGroup(db, 'skills'));
    const unsub = onSnapshot(poolQuery, (snap) => {
      const next: PoolRow[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (!data?.skillId) return;
        const templateIds = Array.isArray(data.templates)
          ? data.templates.map((t: any) => t?.templateId).filter(Boolean)
          : [];
        next.push({
          id: docSnap.id,
          skillId: data.skillId,
          subject: data.subject,
          stageId: data.stageId,
          templates: Array.isArray(data.templates) ? data.templates.length : 0,
          counts: data.counts,
          templateIds,
          reviewStatus: data.reviewStatus || 'pending',
          reviewNotes: data.reviewNotes || '',
          reviewedAt: data.reviewedAt || null,
          reviewedBy: data.reviewedBy || null,
          poolPath: docSnap.ref.path,
        });
      });
      setRows(next);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredRows = statusFilter === 'all'
    ? rows
    : rows.filter((row) => (row.reviewStatus || 'pending') === statusFilter);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

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
      <Text style={styles.title}>Pool Explorer</Text>
      <Text style={styles.subtitle}>Inspect template pools and skill coverage.</Text>

      <View style={styles.card}>
        <View style={styles.filtersRow}>
          {(['all', 'pending', 'approved', 'changes', 'rejected'] as const).map((status) => (
            <Pressable
              key={status}
              onPress={() => setStatusFilter(status)}
              style={[styles.filterChip, statusFilter === status && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, statusFilter === status && styles.filterChipTextActive]}>
                {status === 'all' ? 'All' : status}
              </Text>
            </Pressable>
          ))}
          <View style={styles.viewModeWrap}>
            <Pressable
              onPress={() => setViewMode('compact')}
              style={[styles.viewChip, viewMode === 'compact' && styles.viewChipActive]}
            >
              <Text style={[styles.viewChipText, viewMode === 'compact' && styles.viewChipTextActive]}>Compact</Text>
            </Pressable>
            <Pressable
              onPress={() => setViewMode('comfortable')}
              style={[styles.viewChip, viewMode === 'comfortable' && styles.viewChipActive]}
            >
              <Text style={[styles.viewChipText, viewMode === 'comfortable' && styles.viewChipTextActive]}>Comfort</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.subRow}>
          <Text style={styles.subRowLabel}>Regenerate difficulty:</Text>
          {[1, 2, 3].map((level) => (
            <Pressable
              key={`regen-${level}`}
              onPress={() => setRegenDifficulty(level as 1 | 2 | 3)}
              style={[styles.filterChip, regenDifficulty === level && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, regenDifficulty === level && styles.filterChipTextActive]}>
                {level}
              </Text>
            </Pressable>
          ))}
          {regenError ? <Text style={styles.errorText}>{regenError}</Text> : null}
        </View>
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
        ) : filteredRows.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No pool specs found.</Text>
          </View>
        ) : (
          pagedRows.map((row) => (
            <View
              key={`${row.subject}-${row.stageId}-${row.skillId}`}
              style={[styles.tableRow, viewMode === 'compact' && styles.tableRowCompact]}
            >
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
                  onPress={async () => {
                    setRegenError('');
                    setRegenLoading(row.skillId);
                    try {
                      await startBaselineGeneration({
                        subject: row.subject,
                        stageId: row.stageId,
                        version: '2026.02',
                        seed: `${row.subject}:${row.stageId}:2026.02`,
                        difficulty: regenDifficulty,
                      });
                    } catch (err: any) {
                      setRegenError(err?.message || 'Regeneration failed.');
                    } finally {
                      setRegenLoading(null);
                    }
                  }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionButtonText}>
                    {regenLoading === row.skillId ? 'Working…' : 'Regenerate'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>
      {!loading && filteredRows.length > 0 && (
        <View style={styles.pagination}>
          <Pressable
            onPress={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={safePage === 1}
            style={[styles.pageButton, safePage === 1 && styles.pageButtonDisabled]}
          >
            <Text style={styles.pageButtonText}>Prev</Text>
          </Pressable>
          <Text style={styles.pageInfo}>Page {safePage} of {totalPages}</Text>
          <Pressable
            onPress={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={safePage === totalPages}
            style={[styles.pageButton, safePage === totalPages && styles.pageButtonDisabled]}
          >
            <Text style={styles.pageButtonText}>Next</Text>
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
  filtersRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  filterChipActive: { backgroundColor: 'rgba(122, 92, 255, 0.25)', borderColor: 'rgba(122, 92, 255, 0.6)' },
  filterChipText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, textTransform: 'capitalize' },
  filterChipTextActive: { color: '#fff', fontWeight: '700' },
  viewModeWrap: { flexDirection: 'row', gap: 6, marginLeft: 'auto' },
  viewChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  viewChipActive: { backgroundColor: 'rgba(124,92,255,0.3)', borderColor: 'rgba(124,92,255,0.6)' },
  viewChipText: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
  viewChipTextActive: { color: '#fff', fontWeight: '700' },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  subRowLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginRight: 6 },
  tableHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
  tableHeaderText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', flex: 1 },
  tableHeaderAction: { textAlign: 'right' },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center' },
  tableRowCompact: { paddingVertical: 6 },
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
  errorText: { color: '#ffb4b4', fontSize: 11 },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 },
  pageButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  pageButtonDisabled: { opacity: 0.4 },
  pageButtonText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  pageInfo: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
});
