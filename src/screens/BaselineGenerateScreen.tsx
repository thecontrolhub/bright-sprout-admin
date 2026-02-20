import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, useWindowDimensions } from 'react-native';
import { tokens } from '../styles/tokens';
import { startBaselineGeneration } from '../firebase/functions';
import { db } from '../firebase/firestore';
import { collection, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useNavigation } from '../navigation/NavigationContext';

type BlueprintRow = {
  id: string;
  subject: string;
  stageId: string;
  version: string;
  skillsCount: number;
  createdAt?: any;
};

export const BaselineGenerateScreen: React.FC = () => {
  const { navigate } = useNavigation();
  const { width } = useWindowDimensions();
  const isWide = width >= 1100;
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
  const [difficulty, setDifficulty] = React.useState<1 | 2 | 3>(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState<any>(null);

  
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
      const res = await startBaselineGeneration({
        subject,
        stageId,
        version,
        seed: seed || `${subject}:${stageId}:${version}`,
        difficulty,
      });
      setResult(res?.data || res);
    } catch (err: any) {
      setError(err?.message || 'Generation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Baseline Generator</Text>
      <Text style={styles.subtitle}>Launch Cambridge-aligned baseline runs and review outputs.</Text>

      <View style={[styles.panelRow, isWide ? styles.panelRowWide : styles.panelRowStacked]}>
        <View style={[styles.panel, styles.panelLeft]}>
          <Text style={styles.cardTitle}>Baseline Blueprints</Text>
          <Text style={styles.cardText}>Generated blueprint registry by subject and stage.</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colSubject]}>Subject</Text>
            <Text style={[styles.tableHeaderText, styles.colStage]}>Stage</Text>
            <Text style={[styles.tableHeaderText, styles.colVersion]}>Version</Text>
            <Text style={[styles.tableHeaderText, styles.colSkills]}>Skills</Text>
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
              </View>
            ))
          )}
        </View>

        <View style={[styles.panel, styles.panelRight]}>
        <Text style={styles.cardTitle}>Run Configuration</Text>
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

        <Text style={styles.formLabel}>Difficulty</Text>
        <View style={styles.chipRow}>
          {[1, 2, 3].map((level) => {
            const active = difficulty === level;
            return (
              <Pressable
                key={`difficulty-${level}`}
                accessibilityRole="button"
                onPress={() => setDifficulty(level as 1 | 2 | 3)}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && styles.chipPressed,
                ]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>Difficulty {level}</Text>
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
          onPress={handleGenerate}
          disabled={loading}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
            loading && styles.primaryButtonDisabled,
          ]}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Generate</Text>}
        </Pressable>
        {result ? (
          <View style={styles.resultCard}>
            <Text style={styles.cardTitle}>Run Started</Text>
            <Text style={styles.cardText}>Run ID: {result.runId || result?.data?.runId || 'unknown'}</Text>
            <Text style={styles.cardText}>
              Skills: {result.counts?.skills ?? 0} · Templates: {result.counts?.templates ?? 0} · Items: {result.counts?.sampleItems ?? 0}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigate('baselineRuns')}
              style={({ pressed }) => [styles.linkButton, pressed && styles.primaryButtonPressed]}
            >
              <Text style={styles.linkText}>View runs</Text>
            </Pressable>
          </View>
        ) : null}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: tokens.spacing.xl, gap: tokens.spacing.lg, paddingBottom: 64 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  panelRow: { gap: tokens.spacing.lg },
  panelRowWide: { flexDirection: 'row' },
  panelRowStacked: { flexDirection: 'column' },
  panel: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  panelLeft: { flex: 1 },
  panelRight: { flex: 1.1 },
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
  tableHeaderText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', flex: 1 },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  tableCell: { color: '#fff', fontSize: 11, flex: 1, paddingRight: 6 },
  colSubject: { flex: 1.1 },
  colStage: { flex: 0.8 },
  colVersion: { flex: 0.9 },
  colSkills: { flex: 0.6 },
  loadingRow: { paddingVertical: 12, alignItems: 'center' },
  emptyRow: { paddingVertical: 12, alignItems: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
});
