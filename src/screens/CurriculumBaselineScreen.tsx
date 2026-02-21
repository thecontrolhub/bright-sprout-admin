import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, TextInput } from 'react-native';
import { collectionGroup, getDocs, limit, limitToLast, orderBy, query, startAfter, endBefore, where, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
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

type PageCursor = { first: QueryDocumentSnapshot<DocumentData>; last: QueryDocumentSnapshot<DocumentData> };

type Direction = 'reset' | 'next' | 'prev';

export const CurriculumBaselineScreen: React.FC = () => {
  const [rows, setRows] = React.useState<PoolRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { navigate } = useNavigation();

  const [subjectFilter, setSubjectFilter] = React.useState('all');
  const [stageFilter, setStageFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const pageSize = 12;
  const [pageCursors, setPageCursors] = React.useState<PageCursor[]>([]);
  const [hasNext, setHasNext] = React.useState(false);
  const [showFilterModal, setShowFilterModal] = React.useState(false);

  const buildPoolQuery = React.useCallback((direction: Direction) => {
    let q: any = query(collectionGroup(db, 'skills'), orderBy('skillId'));
    if (subjectFilter !== 'all') q = query(q, where('subject', '==', subjectFilter));
    if (stageFilter !== 'all') q = query(q, where('stageId', '==', stageFilter));
    if (statusFilter !== 'all') q = query(q, where('reviewStatus', '==', statusFilter));

    if (direction === 'next' && pageCursors[page - 1]?.last) {
      q = query(q, startAfter(pageCursors[page - 1].last));
    }
    if (direction === 'prev' && pageCursors[page - 2]?.first) {
      q = query(q, endBefore(pageCursors[page - 2].first), limitToLast(pageSize + 1));
      return q;
    }

    q = query(q, limit(pageSize + 1));
    return q;
  }, [subjectFilter, stageFilter, statusFilter, page, pageCursors]);

  const fetchPage = React.useCallback(async (direction: Direction) => {
    setLoading(true);
    const q = buildPoolQuery(direction);
    const snap = await getDocs(q);
    const docs = snap.docs;
    const pageDocs = docs.slice(0, pageSize);
    setHasNext(docs.length > pageSize);

    const next: PoolRow[] = [];
    pageDocs.forEach((docSnap) => {
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

    if (pageDocs.length) {
      const first = pageDocs[0];
      const last = pageDocs[pageDocs.length - 1];
      setPageCursors((prev) => {
        const updated = [...prev];
        if (direction === 'prev') {
          updated[page - 2] = { first, last };
        } else {
          updated[page - 1] = { first, last };
        }
        return updated;
      });
    }

    setRows(next);
    setLoading(false);
  }, [buildPoolQuery, page, pageSize]);

  React.useEffect(() => {
    setPage(1);
    setPageCursors([]);
    fetchPage('reset');
  }, [subjectFilter, stageFilter, statusFilter]);

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

  const pageRows = search.trim()
    ? rows.filter((row) => {
        const term = search.trim().toLowerCase();
        const hay = `${row.skillId} ${row.subject} ${row.stageId}`.toLowerCase();
        return hay.includes(term);
      })
    : rows;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Curriculum - Baseline</Text>
      <Text style={styles.subtitle}>Review generated baseline items and approve pools for use.</Text>

      <View style={styles.card}>
        <View style={styles.tableHeaderRow}>
          <View>
            <Text style={styles.cardTitle}>Baseline Pools</Text>
            <Text style={styles.cardText}>Filter and review generated pools.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowFilterModal(true)}
            style={({ pressed }) => [styles.actionButton, pressed && styles.primaryButtonPressed]}
          >
            <Text style={styles.actionButtonText}>Filters</Text>
          </Pressable>
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
        ) : pageRows.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No baseline pools found.</Text>
          </View>
        ) : (
          pageRows.map((row) => (
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
                  onPress={() => navigate('poolReview', { poolPath: row.poolPath })}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionButtonText}>Review</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
        <View style={styles.paginationRow}>
          <Text style={styles.paginationText}>Page {page}</Text>
          <View style={styles.paginationButtons}>
            <Pressable
              onPress={() => {
                if (page <= 1) return;
                setPage((prev) => Math.max(1, prev - 1));
                fetchPage('prev');
              }}
              disabled={page <= 1}
              style={[styles.pageButton, page <= 1 && styles.pageButtonDisabled]}
            >
              <Text style={styles.pageButtonText}>Prev</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (!hasNext) return;
                setPage((prev) => prev + 1);
                fetchPage('next');
              }}
              disabled={!hasNext}
              style={[styles.pageButton, !hasNext && styles.pageButtonDisabled]}
            >
              <Text style={styles.pageButtonText}>Next</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {showFilterModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBackdrop} />
          <View style={[styles.card, styles.modalCard]}>
            <View style={styles.modalHeader}>
              <Text style={styles.cardTitle}>Filters</Text>
              <Pressable onPress={() => setShowFilterModal(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </View>
            <View style={styles.filterRow}>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Subject</Text>
                <View style={styles.filterChips}>
                  {['all', 'literacy', 'maths', 'science'].map((subject) => (
                    <Pressable
                      key={`fsub-${subject}`}
                      onPress={() => setSubjectFilter(subject)}
                      style={[styles.filterChip, subjectFilter === subject && styles.filterChipActive]}
                    >
                      <Text style={styles.filterChipText}>{subject}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Stage</Text>
                <View style={styles.filterChips}>
                  {['all', 'early', 'stage1', 'stage2', 'stage3', 'stage4', 'stage5', 'stage6'].map((stage) => (
                    <Pressable
                      key={`fstg-${stage}`}
                      onPress={() => setStageFilter(stage)}
                      style={[styles.filterChip, stageFilter === stage && styles.filterChipActive]}
                    >
                      <Text style={styles.filterChipText}>{stage}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Status</Text>
                <View style={styles.filterChips}>
                  {['all', 'pending', 'approved', 'changes', 'rejected'].map((status) => (
                    <Pressable
                      key={`fstatus-${status}`}
                      onPress={() => setStatusFilter(status)}
                      style={[styles.filterChip, statusFilter === status && styles.filterChipActive]}
                    >
                      <Text style={styles.filterChipText}>{status}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Search</Text>
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search skill id"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  style={styles.searchInput}
                />
              </View>
            </View>
          </View>
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
  tableHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cardText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 6 },
  filterRow: { gap: 12, marginBottom: 12 },
  filterGroup: { gap: 6 },
  filterLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 10, textTransform: 'uppercase' },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  filterChipActive: {
    borderColor: 'rgba(124,92,255,0.6)',
    backgroundColor: 'rgba(124,92,255,0.2)',
  },
  filterChipText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  searchInput: {
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.08)',
    fontSize: 11,
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
  paginationRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paginationText: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  paginationButtons: { flexDirection: 'row', gap: 8 },
  pageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  pageButtonDisabled: { opacity: 0.4 },
  pageButtonText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 10,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 6, 24, 0.85)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 720,
    backgroundColor: 'rgba(30, 18, 52, 0.98)',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalClose: { paddingHorizontal: 10, paddingVertical: 6 },
  modalCloseText: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  primaryButtonPressed: { transform: [{ scale: 0.98 }] },
});
