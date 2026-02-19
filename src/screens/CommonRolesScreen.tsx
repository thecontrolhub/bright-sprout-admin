import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, ActivityIndicator } from 'react-native';
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { tokens } from '../styles/tokens';
import { db } from '../firebase/firestore';

export const CommonRolesScreen: React.FC = () => {
  const [roles, setRoles] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [roleName, setRoleName] = React.useState('');
  const [editRole, setEditRole] = React.useState('');
  const [removeOpen, setRemoveOpen] = React.useState(false);
  const [removeRole, setRemoveRole] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const ref = doc(db, 'config', 'app');
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data();
      setRoles(Array.isArray(data?.roles) ? data.roles : []);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAddRole = async () => {
    setError('');
    const trimmed = roleName.trim();
    if (!trimmed) {
      setError('Role name is required.');
      return;
    }
    setSaving(true);
    try {
      const ref = doc(db, 'config', 'app');
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await updateDoc(ref, { roles: [trimmed] });
      } else {
        await updateDoc(ref, { roles: arrayUnion(trimmed) });
      }
      setRoleName('');
      setModalOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Unable to add role.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditRole = async () => {
    setError('');
    const trimmed = roleName.trim();
    if (!trimmed || !editRole) {
      setError('Role name is required.');
      return;
    }
    setSaving(true);
    try {
      const ref = doc(db, 'config', 'app');
      const snap = await getDoc(ref);
      const current = Array.isArray(snap.data()?.roles) ? snap.data()?.roles : [];
      const updated = current.map((role: string) => (role === editRole ? trimmed : role));
      await updateDoc(ref, { roles: updated });
      setRoleName('');
      setEditRole('');
      setEditOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Unable to update role.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveRole = async () => {
    setError('');
    if (!removeRole) {
      setError('Role name is required.');
      return;
    }
    setSaving(true);
    try {
      const ref = doc(db, 'config', 'app');
      const snap = await getDoc(ref);
      const current = Array.isArray(snap.data()?.roles) ? snap.data()?.roles : [];
      const updated = current.filter((role: string) => role !== removeRole);
      await updateDoc(ref, { roles: updated });
      setRemoveRole('');
      setRemoveOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Unable to remove role.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Common Data · Roles</Text>
          <Text style={styles.subtitle}>Manage admin role labels used across the platform.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setModalOpen(true)}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
        >
          <Text style={styles.primaryButtonText}>Add role</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Role</Text>
          <Text style={styles.tableHeaderText}>Description</Text>
          <Text style={[styles.tableHeaderText, styles.actionHeader]}>Actions</Text>
        </View>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : roles.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No roles configured yet.</Text>
          </View>
        ) : (
          roles.map((role) => (
            <View key={role} style={styles.tableRow}>
              <Text style={styles.tableCell}>{role}</Text>
              <Text style={styles.tableCell}>Admin permission label</Text>
              <View style={styles.actionCellWrap}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setEditRole(role);
                    setRoleName(role);
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
                    setRemoveRole(role);
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

      <Modal visible={modalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Admin Role</Text>
            <Text style={styles.modalLabel}>Role name</Text>
            <TextInput
              value={roleName}
              onChangeText={setRoleName}
              placeholder="e.g. Content Lead"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.modalInput}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setModalOpen(false);
                  setError('');
                  setRoleName('');
                }}
                style={({ pressed }) => [styles.modalButton, pressed && styles.primaryButtonPressed]}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handleAddRole}
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
            <Text style={styles.modalTitle}>Update Role</Text>
            <Text style={styles.modalLabel}>Role name</Text>
            <TextInput
              value={roleName}
              onChangeText={setRoleName}
              placeholder="e.g. Content Lead"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.modalInput}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setEditOpen(false);
                  setError('');
                  setRoleName('');
                  setEditRole('');
                }}
                style={({ pressed }) => [styles.modalButton, pressed && styles.primaryButtonPressed]}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handleEditRole}
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
            <Text style={styles.modalTitle}>Remove Role</Text>
            <Text style={styles.modalSubtitle}>
              This will remove the role "{removeRole}" from Common Data.
            </Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setRemoveOpen(false);
                  setError('');
                  setRemoveRole('');
                }}
                style={({ pressed }) => [styles.modalButton, pressed && styles.primaryButtonPressed]}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handleRemoveRole}
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
  loadingRow: { paddingVertical: 16, alignItems: 'center' },
  emptyRow: { paddingVertical: 16, alignItems: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  editButtonText: {
    color: '#d6ccff',
    fontSize: 11,
    fontWeight: '700',
  },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,120,120,0.45)',
    backgroundColor: 'rgba(255,120,120,0.12)',
  },
  removeButtonText: {
    color: '#ffb4b4',
    fontSize: 11,
    fontWeight: '700',
  },
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
