import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, useWindowDimensions } from 'react-native';
import { tokens } from '../styles/tokens';
import { generateCambridgeBlueprint, generateBaselinePoolSpecs } from '../firebase/functions';
import { db } from '../firebase/firestore';
import { collection, deleteDoc, doc, getDoc, getDocs, limit, limitToLast, orderBy, query, startAfter, endBefore, where, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { useNavigation } from '../navigation/NavigationContext';

type BlueprintRow = {
  id: string;
  subject: string;
  stageId: string;
  version: string;
  skillsCount: number;
  createdAt?: any;
  status?: string;
  reviewStatus?: string;
  runId?: string;
};

type PageCursor = { first: QueryDocumentSnapshot<DocumentData>; last: QueryDocumentSnapshot<DocumentData> };

type Direction = 'reset' | 'next' | 'prev';

export const BaselineGenerateScreen: React.FC = () => {
  const { navigate } = useNavigation();
  const { width } = useWindowDimensions();
  const isWide = width >= 1100;

  const [showModal, setShowModal] = React.useState(false);
  const [showFilterModal, setShowFilterModal] = React.useState(false);

  const [blueprints, setBlueprints] = React.useState<BlueprintRow[]>([]);
  const [loadingBlueprints, setLoadingBlueprints] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [pageCursors, setPageCursors] = React.useState<PageCursor[]>([]);
  const [hasNext, setHasNext] = React.useState(false);
  const pageSize = 10;

  const [subjects, setSubjects] = React.useState<Array<{ id: string; label: string }>>([]);
  const [stages, setStages] = React.useState<Array<{ id: string; label: string }>>([]);
  const [loadingConfig, setLoadingConfig] = React.useState(true);

  const [filterSubject, setFilterSubject] = React.useState('all');
  const [filterStage, setFilterStage] = React.useState('all');
  const [filterStatus, setFilterStatus] = React.useState('all');
  const [search, setSearch] = React.useState('');

  const [subject, setSubject] = React.useState('');
  const [stageId, setStageId] = React.useState('');
  const [version, setVersion] = React.useState('2026.02');
  const [seed, setSeed] = React.useState('');
  const [seedTouched, setSeedTouched] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [actionBusy, setActionBusy] = React.useState<string | null>(null);

  const [poolModalBlueprintId, setPoolModalBlueprintId] = React.useState<string | null>(null);
  const [poolModalDifficulty, setPoolModalDifficulty] = React.useState<1 | 2 | 3>(1);

  React.useEffect(() => {
    let cancelled = false;
    const loadConfig = async () => {
      try {
        const snap = await getDoc(doc(db, 'config', 'app'));
        const data = snap.data() || {};
        const subjectList = Array.isArray(data.subjects) ? data.subjects : [];
        const stageList = Array.isArray(data.grades) ? data.grades : [];

        const mappedSubjects = subjectList
          .map((item: any) => ({
            id: String(item.subjectId || item.id || item.label || '').toLowerCase(),
            label: String(item.label || item.subjectId || '').trim() || 'Subject',
          }))
          .filter((item: any) => item.id);

        const mappedStages = stageList
          .map((item: any) => ({
            id: String(item.stageId || item.id || '').trim(),
            label: String(item.label || item.stageId || '').trim() || 'Stage',
          }))
          .filter((item: any) => item.id);

        if (!cancelled) {
          setSubjects(mappedSubjects);
          setStages(mappedStages);
          if (!subject && mappedSubjects[0]) setSubject(mappedSubjects[0].id);
          if (!stageId && mappedStages[0]) setStageId(mappedStages[0].id);
          setSeedTouched(false);
          setLoadingConfig(false);
        }
      } catch (err) {
        if (!cancelled) setLoadingConfig(false);
      }
    };

    loadConfig();
    return () => {
      cancelled = true;
    };
  }, [subject, stageId]);

  React.useEffect(() => {
    const autoSeed = `${subject}:${stageId}:${version}`;
    if (!seedTouched) {
      setSeed(autoSeed);
    }
  }, [subject, stageId, version, seedTouched]);

  const buildBlueprintQuery = React.useCallback((direction: Direction) => {
    let q: any = query(collection(db, 'baselineBlueprints'), orderBy('createdAt', 'desc'));
    if (filterSubject !== 'all') q = query(q, where('subject', '==', filterSubject));
    if (filterStage !== 'all') q = query(q, where('stageId', '==', filterStage));
    if (filterStatus !== 'all') {
      const normalized = filterStatus === 'changes' ? 'changes_requested' : filterStatus;
      q = query(q, where('reviewStatus', '==', normalized));
    }

    if (direction === 'next' && pageCursors[page - 1]?.last) {
      q = query(q, startAfter(pageCursors[page - 1].last));
    }
    if (direction === 'prev' && pageCursors[page - 2]?.first) {
      q = query(q, endBefore(pageCursors[page - 2].first), limitToLast(pageSize + 1));
      return q;
    }

    q = query(q, limit(pageSize + 1));
    return q;
  }, [filterSubject, filterStage, filterStatus, page, pageCursors]);

  const fetchPage = React.useCallback(async (direction: Direction) => {
    setLoadingBlueprints(true);
    const q = buildBlueprintQuery(direction);
    const snap = await getDocs(q);
    const docs = snap.docs;
    const pageDocs = docs.slice(0, pageSize);
    setHasNext(docs.length > pageSize);

    const next: BlueprintRow[] = pageDocs.map((docSnap) => {
      const data = docSnap.data() as any;
      return {
        id: docSnap.id,
        subject: data.subject,
        stageId: data.stageId,
        version: data.version,
        skillsCount: Array.isArray(data.skills) ? data.skills.length : 0,
        createdAt: data.createdAt,
        status: data.status,
        reviewStatus: data.reviewStatus,
        runId: data.runId,
      };
    });
    setBlueprints(next);

    if (pageDocs.length) {
      const first = pageDocs[0];
      const last = pageDocs[pageDocs.length - 1];
      setPageCursors((prev) => {
        const updated = [...prev];
        if (direction === 'prev') {
          updated[page - 2] = { first, last } as any;
        } else {
          updated[page - 1] = { first, last } as any;
        }
        return updated;
      });
    }

    setLoadingBlueprints(false);
  }, [buildBlueprintQuery, page, pageSize]);

  React.useEffect(() => {
    setPage(1);
    setPageCursors([]);
    fetchPage('reset');
  }, [filterSubject, filterStage, filterStatus]);

  const handleGenerate = async () => {
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await generateCambridgeBlueprint({
        subject,
        stageId,
        version,
        seed: seed || `${subject}:${stageId}:${version}`,
      });
      setResult(res?.data || res);
    } catch (err: any) {
      setError(err?.message || 'Generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const pageRows = search.trim()
    ? blueprints.filter((row) => {
        const term = search.trim().toLowerCase();
        const hay = `${row.subject} ${row.stageId} ${row.version} ${row.id}`.toLowerCase();
        return hay.includes(term);
      })
    : blueprints;

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Baseline Generator</Text>
        <Text style={styles.subtitle}>Launch Cambridge-aligned baseline runs and review outputs.</Text>

        <View style={[styles.panel, styles.panelFull]}>
          <View style={styles.tableHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Baseline Blueprints</Text>
              <Text style={styles.cardText}>Generated blueprint registry by subject and stage.</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowFilterModal(true)}
                style={({ pressed }) => [styles.actionButton, pressed && styles.primaryButtonPressed]}
              >
                <Text style={styles.actionButtonText}>Filters</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowModal(true)}
                style={({ pressed }) => [styles.primaryButton, styles.primaryButtonInline, pressed && styles.primaryButtonPressed]}
              >
                <Text style={styles.primaryButtonText}>Generate Blueprint</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colSubject]}>Subject</Text>
            <Text style={[styles.tableHeaderText, styles.colStage]}>Stage</Text>
            <Text style={[styles.tableHeaderText, styles.colVersion]}>Version</Text>
            <Text style={[styles.tableHeaderText, styles.colSkills]}>Skills</Text>
            <Text style={[styles.tableHeaderText, styles.colStatus]}>Status</Text>
            <Text style={[styles.tableHeaderText, styles.colActions]}>Actions</Text>
          </View>
          {loadingBlueprints ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : pageRows.length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No blueprints generated yet.</Text>
            </View>
          ) : (
            pageRows.map((row) => (
              <View key={row.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colSubject]} numberOfLines={1}>{row.subject}</Text>
                <Text style={[styles.tableCell, styles.colStage]} numberOfLines={1}>{row.stageId}</Text>
                <Text style={[styles.tableCell, styles.colVersion]} numberOfLines={1}>{row.version}</Text>
                <Text style={[styles.tableCell, styles.colSkills]} numberOfLines={1}>{row.skillsCount}</Text>
                <Text style={[styles.tableCell, styles.colStatus]} numberOfLines={1}>
                  {(() => {
                    const reviewStatus = (row.reviewStatus || '').toLowerCase();
                    if (reviewStatus === 'approved') return 'approved';
                    if (reviewStatus === 'rejected') return 'rejected';
                    if (reviewStatus === 'changes' || reviewStatus === 'changes_requested') return 'changes requested';
                    return row.status || 'ready';
                  })()}
                </Text>
                <View style={[styles.tableCell, styles.colActions, styles.actionsCell]}>
                  {row.reviewStatus === 'approved' ? (
                    <Pressable
                      onPress={() => {
                        setPoolModalBlueprintId(row.id);
                        setPoolModalDifficulty(1);
                      }}
                      disabled={actionBusy === row.id}
                      style={[styles.actionButton, actionBusy === row.id && styles.primaryButtonDisabled]}
                    >
                      <Text style={styles.actionButtonText}>Generate Pools</Text>
                    </Pressable>
                  ) : row.reviewStatus === 'rejected' ? null : (
                    <Pressable
                      onPress={() => navigate('blueprintReview', { blueprintId: row.id })}
                      style={styles.actionButton}
                    >
                      <Text style={styles.actionButtonText}>Review</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={async () => {
                      setActionBusy(row.id);
                      try {
                        await deleteDoc(doc(db, 'baselineBlueprints', row.id));
                        if (pageRows.length === 1 && page > 1) {
                          setPage((prev) => Math.max(1, prev - 1));
                          fetchPage('prev');
                        } else {
                          fetchPage('reset');
                        }
                      } finally {
                        setActionBusy(null);
                      }
                    }}
                    disabled={actionBusy === row.id}
                    style={[styles.actionButton, styles.removeButton, actionBusy === row.id && styles.primaryButtonDisabled]}
                  >
                    <Text style={styles.actionButtonText}>Remove</Text>
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
      </ScrollView>

      {poolModalBlueprintId && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBackdrop} />
          <View style={[styles.panel, styles.modalCard]}>
            <View style={styles.modalHeader}>
              <Text style={styles.cardTitle}>Generate Pools</Text>
              <Pressable onPress={() => setPoolModalBlueprintId(null)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </View>
            <Text style={styles.cardText}>Select difficulty for this blueprint.</Text>
            <View style={styles.chipRow}>
              {[1, 2, 3].map((level) => {
                const active = poolModalDifficulty === level;
                return (
                  <Pressable
                    key={`modal-diff-${level}`}
                    onPress={() => setPoolModalDifficulty(level as 1 | 2 | 3)}
                    style={({ pressed }) => [
                      styles.chip,
                      active && styles.chipActive,
                      pressed && styles.chipPressed,
                    ]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{`Difficulty ${level}`}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              onPress={async () => {
                if (!poolModalBlueprintId) return;
                const targetId = poolModalBlueprintId;
                setPoolModalBlueprintId(null);
                setActionBusy(poolModalBlueprintId);
                try {
                  await generateBaselinePoolSpecs({ blueprintId: targetId, difficulty: poolModalDifficulty });
                } finally {
                  setActionBusy(null);
                }
              }}
              disabled={actionBusy === poolModalBlueprintId}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
                actionBusy === poolModalBlueprintId && styles.primaryButtonDisabled,
              ]}
            >
              <Text style={styles.primaryButtonText}>Generate Pools</Text>
            </Pressable>
          </View>
        </View>
      )}

      {showModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBackdrop} />
          <View style={[styles.panel, styles.modalCard]}>
            <View style={styles.modalHeader}>
              <Text style={styles.cardTitle}>Run Configuration</Text>
              <Pressable onPress={() => setShowModal(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </View>
            <Text style={styles.cardText}>Select subject + stage and trigger the generator.</Text>

            <Text style={styles.formLabel}>Subject</Text>
            {loadingConfig ? <Text style={styles.helpText}>Loading subjects...</Text> : null}
            <View style={styles.chipRow}>
              {subjects.map((opt) => {
                const active = subject === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    accessibilityRole="button"
                    onPress={() => setSubject(opt.id)}
                    style={({ pressed }) => [
                      styles.chip,
                      active && styles.chipActive,
                      pressed && styles.chipPressed,
                    ]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.formLabel}>Stage</Text>
            {loadingConfig ? <Text style={styles.helpText}>Loading stages...</Text> : null}
            <View style={styles.chipRow}>
              {stages.map((opt) => {
                const active = stageId === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    accessibilityRole="button"
                    onPress={() => setStageId(opt.id)}
                    style={({ pressed }) => [
                      styles.chip,
                      active && styles.chipActive,
                      pressed && styles.chipPressed,
                    ]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Version</Text>
                <TextInput
                  value={version}
                  onChangeText={setVersion}
                  placeholder="2026.02"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  style={styles.input}
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Seed</Text>
                <TextInput
                  value={seed}
                  onChangeText={(value) => { setSeedTouched(true); setSeed(value); }}
                  placeholder={`${subject}:${stageId}:${version}`}
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  style={styles.input}
                />
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                handleGenerate();
                setShowModal(false);
              }}
              disabled={loading}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
                loading && styles.primaryButtonDisabled,
              ]}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Generate</Text>}
            </Pressable>
          </View>
        </View>
      )}

      {showFilterModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBackdrop} />
          <View style={[styles.panel, styles.modalCard]}>
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
                  <Pressable onPress={() => setFilterSubject('all')} style={[styles.filterChip, filterSubject === 'all' && styles.filterChipActive]}>
                    <Text style={styles.filterChipText}>All</Text>
                  </Pressable>
                  {subjects.map((opt) => (
                    <Pressable
                      key={`fsub-${opt.id}`}
                      onPress={() => setFilterSubject(opt.id)}
                      style={[styles.filterChip, filterSubject === opt.id && styles.filterChipActive]}
                    >
                      <Text style={styles.filterChipText}>{opt.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Stage</Text>
                <View style={styles.filterChips}>
                  <Pressable onPress={() => setFilterStage('all')} style={[styles.filterChip, filterStage === 'all' && styles.filterChipActive]}>
                    <Text style={styles.filterChipText}>All</Text>
                  </Pressable>
                  {stages.map((opt) => (
                    <Pressable
                      key={`fstg-${opt.id}`}
                      onPress={() => setFilterStage(opt.id)}
                      style={[styles.filterChip, filterStage === opt.id && styles.filterChipActive]}
                    >
                      <Text style={styles.filterChipText}>{opt.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Status</Text>
                <View style={styles.filterChips}>
                  {['all', 'pending', 'approved', 'changes', 'rejected'].map((opt) => (
                    <Pressable
                      key={`fstatus-${opt}`}
                      onPress={() => setFilterStatus(opt)}
                      style={[styles.filterChip, filterStatus === opt && styles.filterChipActive]}
                    >
                      <Text style={styles.filterChipText}>{opt === 'all' ? 'All' : opt}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View style={styles.filterSearch}>
                <Text style={styles.filterLabel}>Search</Text>
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search subject, stage, version"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  style={styles.searchInput}
                />
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { flex: 1 },
  content: { padding: tokens.spacing.xl, gap: tokens.spacing.lg, paddingBottom: 64 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  panel: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  panelFull: { width: '100%' },
  resultCard: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cardText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 6 },
  headerActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  filterRow: { marginTop: 12, gap: 12 },
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
  filterSearch: { gap: 6 },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
  },
  formLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, textTransform: 'uppercase', marginTop: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  chipActive: {
    borderColor: 'rgba(124,92,255,0.6)',
    backgroundColor: 'rgba(124,92,255,0.2)',
  },
  chipPressed: { transform: [{ scale: 0.98 }] },
  chipText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  chipTextActive: { color: '#fff', fontWeight: '800' },
  formRow: { flexDirection: 'row', gap: tokens.spacing.lg, marginTop: tokens.spacing.md, flexWrap: 'wrap' },
  formField: { flex: 1, minWidth: 160 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    marginTop: 6,
  },
  primaryButton: {
    marginTop: 18,
    backgroundColor: 'rgba(124,92,255,0.35)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(124,92,255,0.55)',
  },
  primaryButtonPressed: { transform: [{ scale: 0.98 }] },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  primaryButtonInline: { marginTop: 0, paddingHorizontal: 16, paddingVertical: 10 },
  errorText: { color: '#ffb4b4', fontSize: 11, marginTop: 10 },
  tableHeader: { flexDirection: 'row', marginTop: 12, marginBottom: 6 },
  tableHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tableHeaderText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', flex: 1 },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  tableCell: { color: '#fff', fontSize: 11, flex: 1, paddingRight: 6 },
  colSubject: { flex: 1.1 },
  colStage: { flex: 0.8 },
  colVersion: { flex: 0.9 },
  colSkills: { flex: 0.6 },
  colStatus: { flex: 0.8 },
  colActions: { flex: 1.4 },
  loadingRow: { paddingVertical: 12, alignItems: 'center' },
  emptyRow: { paddingVertical: 12, alignItems: 'center' },
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
  actionsCell: { flexDirection: 'row', gap: 6, justifyContent: 'flex-end' },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  removeButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.25)',
    borderColor: 'rgba(231, 76, 60, 0.5)',
  },
  actionButtonText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
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
  helpText: {}
});
