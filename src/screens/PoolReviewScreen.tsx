import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigation } from '../navigation/NavigationContext';
import { db } from '../firebase/firestore';
import { tokens } from '../styles/tokens';
import { useAdminAuth } from '../auth/AdminAuthContext';

type ReviewStatus = 'pending' | 'approved' | 'changes' | 'rejected';

export const PoolReviewScreen: React.FC = () => {
  const { params, navigate } = useNavigation();
  const { user } = useAdminAuth();
  const poolPath = params.poolPath;
  const [loading, setLoading] = React.useState(true);
  const [spec, setSpec] = React.useState<any | null>(null);
  const [notes, setNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [difficultyTabs, setDifficultyTabs] = React.useState<Record<string, 1 | 2 | 3>>({});

  React.useEffect(() => {
    if (!poolPath) return;
    const ref = doc(db, poolPath);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setSpec(null);
        setLoading(false);
        return;
      }
      const data = snap.data();
      setSpec({ id: snap.id, path: snap.ref.path, ...data });
      setNotes(data.reviewNotes || '');
      setLoading(false);
    });
    return () => unsub();
  }, [poolPath]);

  const setStatus = React.useCallback(async (status: ReviewStatus) => {
    if (!spec?.path) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, spec.path), {
        reviewStatus: status,
        reviewNotes: notes.trim(),
        reviewedAt: serverTimestamp(),
        reviewedBy: user?.email || user?.uid || 'admin',
      });
    } finally {
      setSaving(false);
    }
  }, [spec, notes, user]);

  if (!poolPath) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Pool Review</Text>
        <Text style={styles.subtitle}>Missing pool reference.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Pool Review</Text>
          <Text style={styles.subtitle}>Inspect full baseline pool spec and approve or request changes.</Text>
        </View>
        <Pressable onPress={() => navigate('poolExplorer')} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : !spec ? (
        <View style={styles.emptyRow}>
          <Text style={styles.emptyText}>Pool spec not found.</Text>
        </View>
      ) : (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{spec.skillId}</Text>
            <Text style={styles.summaryMeta}>Subject: {spec.subject}</Text>
            <Text style={styles.summaryMeta}>Stage: {spec.stageId}</Text>
            <Text style={styles.summaryMeta}>Templates: {Array.isArray(spec.templates) ? spec.templates.length : 0}</Text>
            <Text style={styles.summaryMeta}>Status: {(spec.reviewStatus || 'pending').toUpperCase()}</Text>
          </View>

          <View style={styles.specCard}>
            <Text style={styles.sectionTitle}>Templates</Text>
            {(spec.templates || []).map((template: any) => (
              <View key={template.templateId} style={styles.templateCard}>
                <View style={styles.templateHeader}>
                  <Text style={styles.templateTitle}>{template.templateId}</Text>
                  <Text style={styles.templateChip}>{template.promptStyle || 'visual'}</Text>
                </View>
                <Text style={styles.templateMeta}>Distractors: {(template.distractorStrategies || []).join(', ') || 'none'}</Text>
                <View style={styles.difficultyTabs}>
                  {[1, 2, 3].map((level) => {
                    const active = (difficultyTabs[template.templateId] || 1) === level;
                    return (
                      <Pressable
                        key={`${template.templateId}-${level}`}
                        onPress={() =>
                          setDifficultyTabs((prev) => ({ ...prev, [template.templateId]: level as 1 | 2 | 3 }))
                        }
                        style={[styles.difficultyTab, active && styles.difficultyTabActive]}
                      >
                        <Text style={[styles.difficultyTabText, active && styles.difficultyTabTextActive]}>
                          Difficulty {level}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={styles.templateMeta}>Param ranges:</Text>
                <View style={styles.paramWrap}>
                  {(template.paramRanges || []).map((range: any, idx: number) => (
                    <View key={`${range.key}-${idx}`} style={styles.paramRow}>
                      <Text style={styles.paramKey}>{range.key}</Text>
                      <Text style={styles.paramValue}>
                        {range.values ? range.values.join(', ') : `${range.min ?? '-'}–${range.max ?? '-'}`}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.templateMeta}>Item fields:</Text>
                <View style={styles.fieldWrap}>
                  {(template.itemSchema || []).map((field: any, idx: number) => (
                    <View key={`${field.name}-${idx}`} style={styles.fieldRow}>
                      <Text style={styles.fieldName}>{field.name}</Text>
                      <Text style={styles.fieldType}>{field.type}</Text>
                      {field.notes ? <Text style={styles.fieldNotes}>{field.notes}</Text> : null}
                    </View>
                  ))}
                </View>
                <Text style={styles.templateMeta}>Example items:</Text>
                {(template.exampleItems || [])
                  .filter((item: any) => item.difficulty === (difficultyTabs[template.templateId] || 1))
                  .slice(0, 5)
                  .map((item: any) => (
                    <View key={item.itemId} style={styles.itemCard}>
                      <Text style={styles.itemPrompt}>{item.prompt?.text || item.prompt?.audioText || '—'}</Text>
                      <View style={styles.itemRow}>
                        <Text style={styles.itemLabel}>Answer</Text>
                        <Text style={styles.itemValue}>{String(item.correctAnswer)}</Text>
                      </View>
                      <View style={styles.itemRow}>
                        <Text style={styles.itemLabel}>Choices</Text>
                        <Text style={styles.itemValue}>{(item.choices || []).join(', ')}</Text>
                      </View>
                      <View style={styles.itemRow}>
                        <Text style={styles.itemLabel}>Surface</Text>
                        <Text style={styles.itemValue}>{item.surface?.kind || '—'} ({item.surface?.width}x{item.surface?.height})</Text>
                      </View>
                    </View>
                  ))}
              </View>
            ))}
          </View>

          <View style={styles.reviewCard}>
            <Text style={styles.sectionTitle}>Review Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes for changes or approval."
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.reviewInput}
              multiline
            />
            <View style={styles.actionsRow}>
              <Pressable onPress={() => setStatus('approved')} style={[styles.actionButton, styles.approve]} disabled={saving}>
                <Text style={styles.actionText}>Approve</Text>
              </Pressable>
              <Pressable onPress={() => setStatus('changes')} style={[styles.actionButton, styles.changes]} disabled={saving}>
                <Text style={styles.actionText}>Request Changes</Text>
              </Pressable>
              <Pressable onPress={() => setStatus('rejected')} style={[styles.actionButton, styles.reject]} disabled={saving}>
                <Text style={styles.actionText}>Reject</Text>
              </Pressable>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: tokens.spacing.xl, gap: tokens.spacing.lg, paddingBottom: 64 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  backButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  loadingRow: { paddingVertical: 16, alignItems: 'center' },
  emptyRow: { paddingVertical: 16, alignItems: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  summaryTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 6 },
  summaryMeta: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 4 },
  reviewCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 8 },
  reviewInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 10,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.05)',
    textAlignVertical: 'top',
  },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionButton: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  actionText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  approve: { backgroundColor: 'rgba(46, 204, 113, 0.8)' },
  changes: { backgroundColor: 'rgba(241, 196, 15, 0.8)' },
  reject: { backgroundColor: 'rgba(231, 76, 60, 0.8)' },
  specCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  templateCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  templateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  templateTitle: { color: '#fff', fontSize: 13, fontWeight: '800' },
  templateChip: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(122, 92, 255, 0.4)',
  },
  difficultyTabs: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  difficultyTab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  difficultyTabActive: {
    backgroundColor: 'rgba(122, 92, 255, 0.35)',
    borderColor: 'rgba(122, 92, 255, 0.7)',
  },
  difficultyTabText: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
  difficultyTabTextActive: { color: '#fff', fontWeight: '700' },
  templateMeta: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 8 },
  paramWrap: { marginTop: 6, gap: 6 },
  paramRow: { flexDirection: 'row', justifyContent: 'space-between' },
  paramKey: { color: '#fff', fontSize: 11 },
  paramValue: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  fieldWrap: { marginTop: 6, gap: 6 },
  fieldRow: { paddingVertical: 6, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  fieldName: { color: '#fff', fontSize: 11, fontWeight: '700' },
  fieldType: { color: 'rgba(255,255,255,0.6)', fontSize: 10 },
  fieldNotes: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 },
  itemCard: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  itemPrompt: { color: '#fff', fontSize: 11, marginBottom: 6 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  itemLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10 },
  itemValue: { color: '#fff', fontSize: 10, flex: 1, textAlign: 'right' },
});
