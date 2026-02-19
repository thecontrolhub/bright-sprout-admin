import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput, ActivityIndicator } from 'react-native';
import { collection, doc, getDoc, onSnapshot, orderBy, query, updateDoc, where, serverTimestamp } from 'firebase/firestore';
import { tokens } from '../styles/tokens';
import { db } from '../firebase/firestore';
import { createAdminAccount } from '../firebase/functions';

type AdminRow = {
  id: string;
  name: string;
  email?: string;
  roleLabel?: string | null;
  lastActiveAt?: Date | null;
  isBlocked?: boolean;
  isRemoved?: boolean;
};

const toDateSafe = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  return null;
};

const formatLastActive = (date?: Date | null) => {
  if (!date) return '—';
  const now = Date.now();
  const diffDays = Math.floor((now - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days`;
};

export const UsersAdminScreen: React.FC = () => {
  const [admins, setAdmins] = React.useState<AdminRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [manageOpen, setManageOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmType, setConfirmType] = React.useState<'block' | 'remove'>('block');
  const [activeAdmin, setActiveAdmin] = React.useState<AdminRow | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [roles, setRoles] = React.useState<string[]>([]);
  const [form, setForm] = React.useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    displayName: '',
    roleLabel: '',
  });

  React.useEffect(() => {
    const adminQuery = query(collection(db, 'users'), where('role', '==', 'admin'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(adminQuery, (snap) => {
      const rows: AdminRow[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const displayName = data.displayName || data.username;
        const name = [data.firstName, data.lastName].filter(Boolean).join(' ') || displayName || data.email || 'Admin';
        rows.push({
          id: docSnap.id,
          name,
          email: data.email,
          roleLabel: data.roleLabel || null,
          lastActiveAt: toDateSafe(data.lastActiveAt) || toDateSafe(data.updatedAt) || toDateSafe(data.createdAt),
          isBlocked: data.isBlocked === true,
          isRemoved: data.isRemoved === true,
        });
      });
      setAdmins(rows);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  React.useEffect(() => {
    const loadRoles = async () => {
      const ref = doc(db, 'config', 'app');
      const snap = await getDoc(ref);
      const data = snap.data();
      setRoles(Array.isArray(data?.roles) ? data.roles : []);
    };
    loadRoles();
  }, []);

  const handleCreate = async () => {
    setError('');
    setSuccess('');
    if (!form.email || !form.password) {
      setError('Email and password are required.');
      return;
    }
    setSubmitting(true);
    try {
      await createAdminAccount({
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim() || undefined,
        lastName: form.lastName.trim() || undefined,
        displayName: form.displayName.trim() || undefined,
        roleLabel: form.roleLabel.trim() || undefined,
      });
      setSuccess('Admin created.');
      setForm({ email: '', password: '', firstName: '', lastName: '', displayName: '', roleLabel: '' });
      setModalOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Unable to create admin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Admins</Text>
          <Text style={styles.subtitle}>Admin access and permissions overview.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setModalOpen(true)}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
        >
          <Text style={styles.primaryButtonText}>Create admin</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Name</Text>
          <Text style={styles.tableHeaderText}>Email</Text>
          <Text style={styles.tableHeaderText}>Role</Text>
          <Text style={styles.tableHeaderText}>Last active</Text>
          <Text style={[styles.tableHeaderText, styles.actionHeader]}>Actions</Text>
        </View>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : admins.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No admins found.</Text>
          </View>
        ) : (
          admins.map((admin) => (
            <View key={admin.id} style={styles.tableRow}>
              <Text style={styles.tableCell}>{admin.name}</Text>
              <Text style={styles.tableCell}>{admin.email || '—'}</Text>
              <Text style={styles.tableCell}>{admin.roleLabel || '—'}</Text>
              <Text style={styles.tableCell}>{formatLastActive(admin.lastActiveAt)}</Text>
              <View style={styles.actionCellWrap}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setActiveAdmin(admin);
                    setManageOpen(true);
                  }}
                  style={({ pressed }) => [styles.actionButton, pressed && styles.primaryButtonPressed]}
                >
                  <Text style={styles.actionButtonText}>Manage</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setActiveAdmin(admin);
                    setConfirmType('block');
                    setConfirmOpen(true);
                  }}
                  style={({ pressed }) => [styles.actionButton, pressed && styles.primaryButtonPressed]}
                >
                  <Text style={styles.actionButtonText}>{admin.isBlocked ? 'Unblock' : 'Block'}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setActiveAdmin(admin);
                    setConfirmType('remove');
                    setConfirmOpen(true);
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
            <Text style={styles.modalTitle}>Create Admin</Text>
            <Text style={styles.modalLabel}>Email</Text>
            <TextInput
              value={form.email}
              onChangeText={(value) => setForm((prev) => ({ ...prev, email: value }))}
              placeholder="admin@brightsprout.com"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.modalInput}
              autoCapitalize="none"
            />
            <Text style={styles.modalLabel}>Password</Text>
            <TextInput
              value={form.password}
              onChangeText={(value) => setForm((prev) => ({ ...prev, password: value }))}
              placeholder="Minimum 6 characters"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.modalInput}
              secureTextEntry
            />
            <View style={styles.modalRow}>
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>First name</Text>
                <TextInput
                  value={form.firstName}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, firstName: value }))}
                  placeholder="First"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  style={styles.modalInput}
                />
              </View>
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Last name</Text>
                <TextInput
                  value={form.lastName}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, lastName: value }))}
                  placeholder="Last"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  style={styles.modalInput}
                />
              </View>
            </View>
            <Text style={styles.modalLabel}>Display name (optional)</Text>
            <TextInput
              value={form.displayName}
              onChangeText={(value) => setForm((prev) => ({ ...prev, displayName: value }))}
              placeholder="Admin name"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.modalInput}
            />

            <Text style={styles.modalLabel}>Admin role</Text>
            {roles.length === 0 ? (
              <TextInput
                value={form.roleLabel}
                onChangeText={(value) => setForm((prev) => ({ ...prev, roleLabel: value }))}
                placeholder="Role label"
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={styles.modalInput}
              />
            ) : (
              <View style={styles.rolesRow}>
                {roles.map((role) => {
                  const selected = form.roleLabel === role;
                  return (
                    <Pressable
                      key={role}
                      accessibilityRole="button"
                      onPress={() => setForm((prev) => ({ ...prev, roleLabel: role }))}
                      style={({ pressed }) => [
                        styles.roleChip,
                        selected && styles.roleChipActive,
                        pressed && styles.primaryButtonPressed,
                      ]}
                    >
                      <Text style={[styles.roleChipText, selected && styles.roleChipTextActive]}>{role}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {success ? <Text style={styles.successText}>{success}</Text> : null}

            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setModalOpen(false);
                  setError('');
                  setSuccess('');
                }}
                style={({ pressed }) => [styles.modalButton, pressed && styles.primaryButtonPressed]}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handleCreate}
                disabled={submitting}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  pressed && styles.primaryButtonPressed,
                  submitting && styles.modalButtonDisabled,
                ]}
              >
                <Text style={styles.modalButtonTextPrimary}>{submitting ? 'Creating...' : 'Create'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={manageOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Admin Details</Text>
            <Text style={styles.modalSubtitle}>Quick view of the admin account.</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{activeAdmin?.name || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{activeAdmin?.email || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Role</Text>
              <Text style={styles.infoValue}>{activeAdmin?.roleLabel || '—'}</Text>
            </View>
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setManageOpen(false)}
                style={({ pressed }) => [styles.modalButton, pressed && styles.primaryButtonPressed]}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={confirmOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {confirmType === 'block' ? 'Block admin account?' : 'Remove admin account?'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {confirmType === 'block'
                ? 'This will prevent the admin from accessing the console until unblocked.'
                : 'This marks the admin as removed. This action can be reversed by an owner.'}
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setConfirmOpen(false)}
                style={({ pressed }) => [styles.modalButton, pressed && styles.primaryButtonPressed]}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={async () => {
                  if (!activeAdmin) return;
                  const ref = doc(db, 'users', activeAdmin.id);
                  if (confirmType === 'block') {
                    await updateDoc(ref, {
                      isBlocked: !activeAdmin.isBlocked,
                      blockedAt: activeAdmin.isBlocked ? null : serverTimestamp(),
                    });
                  } else {
                    await updateDoc(ref, {
                      isRemoved: true,
                      removedAt: serverTimestamp(),
                    });
                  }
                  setConfirmOpen(false);
                }}
                style={({ pressed }) => [
                  styles.modalButton,
                  confirmType === 'remove' && styles.modalButtonDanger,
                  pressed && styles.primaryButtonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    confirmType === 'remove' && styles.modalButtonTextDanger,
                  ]}
                >
                  Confirm
                </Text>
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
  removeButton: {
    marginTop: 2,
  },
  removeButtonText: {
    color: '#ffb4b4',
  },
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
    maxWidth: 520,
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
  modalRow: { flexDirection: 'row', gap: 12 },
  modalField: { flex: 1 },
  rolesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  roleChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  roleChipActive: {
    borderColor: 'rgba(124,92,255,0.6)',
    backgroundColor: 'rgba(124,92,255,0.2)',
  },
  roleChipText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  roleChipTextActive: { color: '#fff', fontWeight: '800' },
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
  modalButtonDanger: {
    borderColor: 'rgba(255,120,120,0.45)',
    backgroundColor: 'rgba(255,120,120,0.2)',
  },
  modalButtonTextDanger: { color: '#ffb4b4' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  infoValue: { color: '#fff', fontSize: 12, fontWeight: '600' },
  errorText: { color: '#ffb4b4', fontSize: 11, marginTop: 10 },
  successText: { color: '#bfe7c9', fontSize: 11, marginTop: 10 },
});
