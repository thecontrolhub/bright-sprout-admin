import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Modal, TextInput } from 'react-native';
import { arrayUnion, doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { tokens } from '../styles/tokens';
import { db } from '../firebase/firestore';

type SubjectItem = { label: string; subjectId?: string };

export const CommonSubjectsScreen: React.FC = () => {
  const [subjects, setSubjects] = React.useState<SubjectItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [addOpen, setAddOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [removeOpen, setRemoveOpen] = React.useState(false);
  const [activeItem, setActiveItem] = React.useState('');
  const [value, setValue] = React.useState('');
  const [subjectId, setSubjectId] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const ref = doc(db, 'config', 'app');
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data();
      const raw = Array.isArray(data?.subjects) ? data.subjects : [];
      const normalized: SubjectItem[] = raw.map((entry: any) => {
        if (typeof entry === 'string') return { label: entry };
        return { label: entry?.label || entry?.name || 'Subject', subjectId: entry?.subjectId || entry?.id || '' };
      });
      setSubjects(normalized);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAdd = async () => {
    setError('');
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Subject name is required.');
      return;
    }
    setSaving(true);
    try {
      const ref = doc(db, 'config', 'app');
      const snap = await getDoc(ref);
      const nextItem: SubjectItem = { label: trimmed, subjectId: subjectId.trim() || '' };
      if (!snap.exists()) {
        await setDoc(ref, { subjects: [nextItem] }, { merge: true });
      } else {
        const current = Array.isArray(snap.data()?.subjects) ? snap.data()?.subjects : [];
        await updateDoc(ref, {
          subjects: arrayUnion(nextItem),
        });
      }
      setValue('');
      setSubjectId('');
      setAddOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Unable to add subject.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    setError('');
    const trimmed = value.trim();
    if (!trimmed || !activeItem) {
      setError('Subject name is required.');
      return;
    }
    setSaving(true);
    try {
      const ref = doc(db, 'config', 'app');
      const snap = await getDoc(ref);
      const current = Array.isArray(snap.data()?.subjects) ? snap.data()?.subjects : [];
      const updated = current.map((item: any) => {
        const label = typeof item === 'string' ? item : item?.label || item?.name;
        if (label !== activeItem) return item;
        return { label: trimmed, subjectId: subjectId.trim() || '' };
      });
      await updateDoc(ref, {
        subjects: updated,
      });
      setValue('');
      setSubjectId('');
      setActiveItem('');
      setEditOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Unable to update subject.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setError('');
    if (!activeItem) {
      setError('Subject name is required.');
      return;
    }
    setSaving(true);
    try {
      const ref = doc(db, 'config', 'app');
      const snap = await getDoc(ref);
      const current = Array.isArray(snap.data()?.subjects) ? snap.data()?.subjects : [];
      const updated = current.filter((item: any) => {
        const label = typeof item === 'string' ? item : item?.label || item?.name;
        return label !== activeItem;
      });
      await updateDoc(ref, {
        subjects: updated,
      });
      setActiveItem('');
      setRemoveOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Unable to remove subject.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Common Data - Subjects</Text>
          <Text style={styles.subtitle}>Manage subjects used across baselines and analytics.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setAddOpen(true)}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
        >
          <Text style={styles.primaryButtonText}>Add subject</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Subject</Text>
          <Text style={styles.tableHeaderText}>Subject ID</Text>
          <Text style={styles.tableHeaderText}>Status</Text>
          <Text style={[styles.tableHeaderText, styles.actionHeader]}>Actions</Text>
        </View>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : subjects.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No subjects configured yet.</Text>
          </View>
        ) : (
          subjects.map((subject) => (
            <View key={subject.label} style={styles.tableRow}>
              <Text style={styles.tableCell}>{subject.label}</Text>
              <Text style={styles.tableCell}>{subject.subjectId || '—'}</Text>
              <Text style={styles.tableCell}>Active</Text>
              <View style={styles.actionCellWrap}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setActiveItem(subject.label);
                    setValue(subject.label);
                    setSubjectId(subject.subjectId || '');
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
                    setActiveItem(subject.label);
                    setRemoveOpen(true);
                    setError('');
                  }}
                  style={({ pressed }) => [styles.actionButton, styles.removeButton, pressed && styles.primaryButtonPressed]}
                >
                  <Text style={[styles.actionButtonText, styles.removeButtonText]}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>

      <Modal visible={addOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Subject</Text>
            <Text style={styles.modalLabel}>Subject name</Text>
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder="e.g. Maths"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.modalInput}
            />
            <Text style={styles.modalLabel}>Subject ID</Text>
            <TextInput
              value={subjectId}
              onChangeText={setSubjectId}
              placeholder="e.g. maths"
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
                  setSubjectId('');
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
            <Text style={styles.modalTitle}>Update Subject</Text>
            <Text style={styles.modalLabel}>Subject name</Text>
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder="e.g. Maths"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.modalInput}
            />
            <Text style={styles.modalLabel}>Subject ID</Text>
            <TextInput
              value={subjectId}
              onChangeText={setSubjectId}
              placeholder="e.g. maths"
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
                  setSubjectId('');
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
            <Text style={styles.modalTitle}>Remove Subject</Text>
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
