import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, useWindowDimensions } from 'react-native';
import { tokens } from '../styles/tokens';
import { generateCambridgeBlueprint, generateBaselinePoolSpecs } from '../firebase/functions';
import { db } from '../firebase/firestore';
import { collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore';
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

export const BaselineGenerateScreen: React.FC = () => {
  const { navigate } = useNavigation();
  const { width } = useWindowDimensions();
  const isWide = width >= 1100;
  const [showModal, setShowModal] = React.useState(false);
  const [blueprints, setBlueprints] = React.useState<BlueprintRow[]>([]);
  const [loadingBlueprints, setLoadingBlueprints] = React.useState(true);
  const [subjects, setSubjects] = React.useState<Array<{ id: string; label: string }>>([]);
  const [stages, setStages] = React.useState<Array<{ id: string; label: string }>>([]);
  const [loadingConfig, setLoadingConfig] = React.useState(true);

  const [subject, setSubject] = React.useState('');
  const [stageId, setStageId] = React.useState('');
  const [version, setVersion] = React.useState('2026.02');
  const [seed, setSeed] = React.useState('');
  const [seedTouched, setSeedTouched] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState<any>(null);
  const [actionBusy, setActionBusy] = React.useState<string | null>(null);
  const [poolDifficulty, setPoolDifficulty] = React.useState<1 | 2 | 3>(1);
  const [poolModalBlueprintId, setPoolModalBlueprintId] = React.useState<string | null>(null);
  const [poolModalDifficulty, setPoolModalDifficulty] = React.useState<1 | 2 | 3>(1);

  
  React.useEffect(() => {
    let cancelled = false;
    const loadConfig = async () => {
      try {
        const snap = await getDoc(doc(db, 'config', 'app'));
        const data = snap.data() || {};
        const subjectList = Array.isArray(data.subjects) ? data.subjects : [];
        const stageList = Array.isArray(data.grades)
          ? data.grades
          : [];

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
    const blueprintsQuery = query(collection(db, 'baselineBlueprints'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(blueprintsQuery, (snap) => {
      const next: BlueprintRow[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as any;
        next.push({
          id: docSnap.id,
          subject: data.subject,
          stageId: data.stageId,
          version: data.version,
          skillsCount: Array.isArray(data.skills) ? data.skills.length : 0,
          createdAt: data.createdAt,
          status: data.status,
          reviewStatus: data.reviewStatus,
          runId: data.runId,
        });
      });
      setBlueprints(next);
      setLoadingBlueprints(false);
    });
    return () => unsub();
  }, []);

  React.useEffect(() => {
    const autoSeed = `${subject}:${stageId}:${version}`;
    if (!seedTouched) {
      setSeed(autoSeed);
    }
  }, [subject, stageId, version, seedTouched]);

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
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowModal(true)}
              style={({ pressed }) => [styles.primaryButton, styles.primaryButtonInline, pressed && styles.primaryButtonPressed]}
            >
              <Text style={styles.primaryButtonText}>Generate Blueprint</Text>
            </Pressable>
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
          ) : blueprints.length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No blueprints generated yet.</Text>
            </View>
          ) : (
            blueprints.map((row) => (
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
                        setPoolModalDifficulty(poolDifficulty);
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
  poolRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  poolLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
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
});
