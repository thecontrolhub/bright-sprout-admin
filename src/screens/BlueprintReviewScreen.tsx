import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, TextInput } from 'react-native';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firestore';
import { tokens } from '../styles/tokens';
import { useNavigation } from '../navigation/NavigationContext';
import { useAdminAuth } from '../auth/AdminAuthContext';

type SkillRow = {
  skillId: string;
  name: string;
  description: string;
  gameSlug?: string;
  interaction?: string;
};

export const BlueprintReviewScreen: React.FC = () => {
  const { params, navigate } = useNavigation();
  const { user } = useAdminAuth();
  const blueprintId = params?.blueprintId;
  const [loading, setLoading] = React.useState(true);
  const [blueprint, setBlueprint] = React.useState<any | null>(null);
  const [notes, setNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!blueprintId) return;
    const ref = doc(db, 'baselineBlueprints', String(blueprintId));
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setBlueprint(null);
        setLoading(false);
        return;
      }
      const data = snap.data();
      setBlueprint({ id: snap.id, ...data });
      setNotes(data.reviewNotes || '');
      setLoading(false);
    });
    return () => unsub();
  }, [blueprintId]);

  const setStatus = React.useCallback(async (status: 'approved' | 'changes_requested' | 'rejected') => {
    if (!blueprintId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'baselineBlueprints', String(blueprintId)), {
        reviewStatus: status,
        reviewNotes: notes.trim(),
        reviewedAt: serverTimestamp(),
        reviewedBy: user?.email || user?.uid || 'admin',
      });
      navigate('baselineGenerate');
    } finally {
      setSaving(false);
    }
  }, [blueprintId, notes, user]);

  const skills: SkillRow[] = Array.isArray(blueprint?.skills)
    ? blueprint.skills.map((skill: any) => ({
      skillId: skill.skillId,
      name: skill.name,
      description: skill.description,
      gameSlug: skill?.game?.gameSlug,
      interaction: skill?.game?.interaction,
    }))
    : [];
  const reviewStatus = String(blueprint?.reviewStatus || '').toLowerCase();
  const hideApprove = reviewStatus === 'changes_requested';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Blueprint Review</Text>
          <Text style={styles.subtitle}>Inspect skills and approve or request changes.</Text>
        </View>
        <Pressable onPress={() => navigate('baselineGenerate')} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : !blueprint ? (
        <View style={styles.emptyRow}>
          <Text style={styles.emptyText}>Blueprint not found.</Text>
        </View>
      ) : (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{blueprint.subject} · {blueprint.stageId}</Text>
            <Text style={styles.summaryMeta}>Version: {blueprint.version}</Text>
            <Text style={styles.summaryMeta}>Skills: {skills.length}</Text>
            <Text style={styles.summaryMeta}>Status: {(blueprint.reviewStatus || 'pending').toUpperCase()}</Text>
          </View>

          <View style={styles.skillsCard}>
            <Text style={styles.sectionTitle}>Skills</Text>
            {skills.map((skill) => (
              <View key={skill.skillId} style={styles.skillRow}>
                <Text style={styles.skillTitle}>{skill.name}</Text>
                <Text style={styles.skillMeta}>{skill.skillId}</Text>
                <Text style={styles.skillDesc}>{skill.description}</Text>
                <View style={styles.skillTags}>
                  <Text style={styles.skillTag}>{skill.gameSlug || 'game'}</Text>
                  <Text style={styles.skillTag}>{skill.interaction || 'interaction'}</Text>
                </View>
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
              {!hideApprove && (
                <Pressable onPress={() => setStatus('approved')} style={[styles.actionButton, styles.approve]} disabled={saving}>
                  <Text style={styles.actionText}>Approve</Text>
                </Pressable>
              )}
              <Pressable onPress={() => setStatus('changes_requested')} style={[styles.actionButton, styles.changes]} disabled={saving}>
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  backButton: {
    paddingHorizontal: 12,
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
  skillsCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 8 },
  skillRow: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 10,
  },
  skillTitle: { color: '#fff', fontSize: 12, fontWeight: '700' },
  skillMeta: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 4 },
  skillDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 6 },
  skillTags: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  skillTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(122, 92, 255, 0.3)',
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  reviewCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
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
});
