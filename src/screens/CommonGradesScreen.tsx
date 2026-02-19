import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Modal, TextInput } from 'react-native';
import { arrayUnion, doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { tokens } from '../styles/tokens';
import { db } from '../firebase/firestore';

type GradeItem = { label: string; ageBand?: string; stageId?: string };

export const CommonGradesScreen: React.FC = () => {
  const [grades, setGrades] = React.useState<GradeItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [addOpen, setAddOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [removeOpen, setRemoveOpen] = React.useState(false);
  const [activeItem, setActiveItem] = React.useState<string>('');
  const [value, setValue] = React.useState('');
  const [ageBand, setAgeBand] = React.useState('');
  const [stageId, setStageId] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const ref = doc(db, 'config', 'app');
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data();
      const raw = Array.isArray(data?.grades) ? data.grades : [];
      const normalized: GradeItem[] = raw.map((entry: any) => {
        if (typeof entry === 'string') {
          return { label: entry };
        }
        return {
          label: entry?.label || entry?.name || 'Grade',
          ageBand: entry?.ageBand || entry?.age || '',
          stageId: entry?.stageId || entry?.stage || '',
        };
      });
      setGrades(normalized);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAdd = async () => {
    setError('');
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Grade name is required.');
      return;
    }
    setSaving(true);
    try {
      const ref = doc(db, 'config', 'app');
      const snap = await getDoc(ref);
      const nextItem: GradeItem = {
        label: trimmed,
        ageBand: ageBand.trim() || '',
        stageId: stageId.trim() || '',
      };
      if (!snap.exists()) {
        await setDoc(ref, { grades: [nextItem], gradesList: [trimmed] }, { merge: true });
      } else {
        const current = Array.isArray(snap.data()?.grades) ? snap.data()?.grades : [];
        await updateDoc(ref, {
          grades: arrayUnion(nextItem),
          gradesList: current.map((g: any) => (typeof g === 'string' ? g : g?.label)).filter(Boolean).concat(trimmed),
        });
      }
      setValue('');
      setAgeBand('');
      setStageId('');
      setAddOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Unable to add grade.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    setError('');
    const trimmed = value.trim();
    if (!trimmed || !activeItem) {
      setError('Grade name is required.');
      return;
    }
    setSaving(true);
    try {
      const ref = doc(db, 'config', 'app');
      const snap = await getDoc(ref);
      const current = Array.isArray(snap.data()?.grades) ? snap.data()?.grades : [];
      const updated = current.map((item: any) => {
        const label = typeof item === 'string' ? item : item?.label || item?.name;
        if (label !== activeItem) return item;
        return {
          label: trimmed,
          ageBand: ageBand.trim() || '',
          stageId: stageId.trim() || '',
        };
      });
      await updateDoc(ref, { grades: updated, gradesList: updated.map((g: any) => (typeof g === 'string' ? g : g?.label)).filter(Boolean) });
      setValue('');
      setAgeBand('');
      setStageId('');
      setActiveItem('');
      setEditOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Unable to update grade.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setError('');
    if (!activeItem) {
      setError('Grade name is required.');
      return;
    }
    setSaving(true);
    try {
      const ref = doc(db, 'config', 'app');
      const snap = await getDoc(ref);
      const current = Array.isArray(snap.data()?.grades) ? snap.data()?.grades : [];
      const updated = current.filter((item: any) => {
        const label = typeof item === 'string' ? item : item?.label || item?.name;
        return label !== activeItem;
      });
      await updateDoc(ref, { grades: updated, gradesList: updated.map((g: any) => (typeof g === 'string' ? g : g?.label)).filter(Boolean) });
      setActiveItem('');
      setRemoveOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Unable to remove grade.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Common Data · Grades</Text>
          <Text style={styles.subtitle}>Manage Cambridge Primary stages and grade labels.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setAddOpen(true)}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
        >
          <Text style={styles.primaryButtonText}>Add grade</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Grade</Text>
          <Text style={styles.tableHeaderText}>Status</Text>
          <Text style={styles.tableHeaderText}>Age band</Text>
          <Text style={styles.tableHeaderText}>Stage</Text>
          <Text style={[styles.tableHeaderText, styles.actionHeader]}>Actions</Text>
        </View>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : grades.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No grades configured yet.</Text>
          </View>
        ) : (
          grades.map((grade) => {
            const meta = { age: grade.ageBand || '—', stage: grade.stageId || '—' };
            return (
            <View key={grade.label} style={styles.tableRow}>
              <Text style={styles.tableCell}>{grade.label}</Text>
              <Text style={styles.tableCell}>Active</Text>
              <Text style={styles.tableCell}>{meta.age}</Text>
              <Text style={styles.tableCell}>{meta.stage}</Text>
              <View style={styles.actionCellWrap}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setActiveItem(grade.label);
                    setValue(grade.label);
                    setAgeBand(grade.ageBand || '');
                    setStageId(grade.stageId || '');
                    setEditOpen(true);
                    setError('');
                  }}
                  style={({ pressed }) => [styles.actionButton, pressed && styles.primaryButtonPressed]}
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setActiveItem(grade.label);
                    setRemoveOpen(true);
                    setError('');
                  }}
                  style={({ pressed }) => [styles.actionButton, styles.removeButton, pressed && styles.primaryButtonPressed]}
                >
                  <Text style={[styles.actionButtonText, styles.removeButtonText]}>Remove</Text>
                </Pressable>
              </View>
            </View>
          )})
        )}
      </View>

      <Modal visible={addOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Grade</Text>
            <Text style={styles.modalLabel}>Grade name</Text>
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder="e.g. Grade 1"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.modalInput}
            />
            <Text style={styles.modalLabel}>Age band</Text>
            <TextInput
              value={ageBand}
              onChangeText={setAgeBand}
              placeholder="e.g. 5-6"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.modalInput}
            />
            <Text style={styles.modalLabel}>Stage ID</Text>
            <TextInput
              value={stageId}
              onChangeText={setStageId}
              placeholder="e.g. stage1"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.modalInput}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setAddOpen(false);
                  setValue('');
                  setAgeBand('');
                  setStageId('');
                  setError('');
                }}
                style={({ pressed }) => [styles.modalButton, pressed && styles.primaryButtonPressed]}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handleAdd}
                disabled={saving}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  pressed && styles.primaryButtonPressed,
                  saving && styles.modalButtonDisabled,
                ]}
              >
                <Text style={styles.modalButtonTextPrimary}>{saving ? 'Saving...' : 'Add'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={editOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Update Grade</Text>
            <Text style={styles.modalLabel}>Grade name</Text>
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder="e.g. Grade 1"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.modalInput}
            />
            <Text style={styles.modalLabel}>Age band</Text>
            <TextInput
              value={ageBand}
              onChangeText={setAgeBand}
              placeholder="e.g. 5-6"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.modalInput}
            />
            <Text style={styles.modalLabel}>Stage ID</Text>
            <TextInput
              value={stageId}
              onChangeText={setStageId}
              placeholder="e.g. stage1"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.modalInput}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setEditOpen(false);
                  setValue('');
                  setAgeBand('');
                  setStageId('');
                  setActiveItem('');
                  setError('');
                }}
                style={({ pressed }) => [styles.modalButton, pressed && styles.primaryButtonPressed]}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handleEdit}
                disabled={saving}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  pressed && styles.primaryButtonPressed,
                  saving && styles.modalButtonDisabled,
                ]}
              >
                <Text style={styles.modalButtonTextPrimary}>{saving ? 'Saving...' : 'Update'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={removeOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Remove Grade</Text>
            <Text style={styles.modalSubtitle}>This will remove "{activeItem}" from Common Data.</Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setRemoveOpen(false);
                  setActiveItem('');
                  setError('');
                }}
                style={({ pressed }) => [styles.modalButton, pressed && styles.primaryButtonPressed]}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handleRemove}
                disabled={saving}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  pressed && styles.primaryButtonPressed,
                  saving && styles.modalButtonDisabled,
                ]}
              >
                <Text style={styles.modalButtonTextPrimary}>{saving ? 'Removing...' : 'Remove'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: tokens.spacing.xl, gap: tokens.spacing.lg, paddingBottom: 64 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacing.lg,
    flexWrap: 'wrap',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  primaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(124,92,255,0.6)',
    backgroundColor: 'rgba(124,92,255,0.25)',
  },
  primaryButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
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
  actionHeader: { flex: 1.2, textAlign: 'right' },
  actionCellWrap: {
    flex: 1.2,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#bba7ff',
    fontWeight: '700',
    fontSize: 11,
  },
  removeButton: { marginTop: 2 },
  removeButtonText: { color: '#ffb4b4' },
  loadingRow: { paddingVertical: 16, alignItems: 'center' },
  emptyRow: { paddingVertical: 16, alignItems: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(24,16,40,0.98)',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 12 },
  modalSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 16 },
  modalLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 10, marginBottom: 6 },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  modalButtonPrimary: {
    borderColor: 'rgba(124,92,255,0.6)',
    backgroundColor: 'rgba(124,92,255,0.25)',
  },
  modalButtonDisabled: { opacity: 0.6 },
  modalButtonText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  modalButtonTextPrimary: { color: '#fff', fontSize: 11, fontWeight: '800' },
  errorText: { color: '#ffb4b4', fontSize: 11, marginTop: 10 },
});
