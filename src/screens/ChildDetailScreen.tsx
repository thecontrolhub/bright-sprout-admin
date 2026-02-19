import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Modal } from 'react-native';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { tokens } from '../styles/tokens';
import { db } from '../firebase/firestore';
import { useNavigation } from '../navigation/NavigationContext';

type TabKey = 'details' | 'account' | 'settings' | 'parent';

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

export const ChildDetailScreen: React.FC = () => {
  const { params } = useNavigation();
  const childId = params.id;
  const [child, setChild] = React.useState<any | null>(null);
  const [parent, setParent] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmType, setConfirmType] = React.useState<'block' | 'remove'>('block');
  const [activeTab, setActiveTab] = React.useState<TabKey>('details');

  React.useEffect(() => {
    if (!childId) return;
    const childRef = doc(db, 'users', childId);
    let parentUnsub: (() => void) | null = null;
    const unsubChild = onSnapshot(childRef, (snap) => {
      const data = snap.exists() ? { id: snap.id, ...snap.data() } : null;
      setChild(data);
      setLoading(false);
      const parentId = data?.parentUid || data?.parentId;
      if (!parentId) {
        if (parentUnsub) {
          parentUnsub();
          parentUnsub = null;
        }
        setParent(null);
        return;
      }
      const parentRef = doc(db, 'users', parentId);
      if (parentUnsub) {
        parentUnsub();
      }
      parentUnsub = onSnapshot(parentRef, (parentSnap) => {
        setParent(parentSnap.exists() ? { id: parentSnap.id, ...parentSnap.data() } : null);
      });
    });

    return () => {
      if (parentUnsub) parentUnsub();
      unsubChild();
    };
  }, [childId]);

  if (!childId) {
    return (
      <View style={styles.center}>
        <Text style={styles.subtitle}>No child selected.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Child Profile</Text>
          <Text style={styles.subtitle}>Manage child account, settings, and parent link.</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setConfirmType('block');
              setConfirmOpen(true);
            }}
            style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
          >
            <Text style={styles.actionBtnText}>Block</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setConfirmType('remove');
              setConfirmOpen(true);
            }}
            style={({ pressed }) => [styles.actionBtn, styles.removeBtn, pressed && styles.actionBtnPressed]}
          >
            <Text style={styles.removeBtnText}>Remove</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.tabsRow}>
        {(
          [
            { key: 'details', label: 'Details' },
            { key: 'account', label: 'Account' },
            { key: 'settings', label: 'App Settings' },
            { key: 'parent', label: 'Parent' },
          ] as Array<{ key: TabKey; label: string }>
        ).map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="button"
              onPress={() => setActiveTab(tab.key)}
              style={({ pressed }) => [styles.tabChip, active && styles.tabChipActive, pressed && styles.actionBtnPressed]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : child ? (
        <>
          {activeTab === 'details' ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Details</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>
                  {[child.firstName, child.lastName].filter(Boolean).join(' ') || child.displayName || '—'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Grade</Text>
                <Text style={styles.infoValue}>{child.grade || '—'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Role</Text>
                <Text style={styles.infoValue}>{child.role || 'child'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Last Active</Text>
                <Text style={styles.infoValue}>
                  {formatLastActive(toDateSafe(child.lastActiveAt) || toDateSafe(child.updatedAt))}
                </Text>
              </View>
            </View>
          ) : null}

          {activeTab === 'account' ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Account</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{child.email || '—'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Username</Text>
                <Text style={styles.infoValue}>{child.username || '—'}</Text>
              </View>
            </View>
          ) : null}

          {activeTab === 'settings' ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>App Settings</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Sounds</Text>
                <Text style={styles.infoValue}>{child.settings?.sounds ? 'On' : 'Off'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Reduced Motion</Text>
                <Text style={styles.infoValue}>{child.settings?.reducedMotion ? 'On' : 'Off'}</Text>
              </View>
            </View>
          ) : null}

          {activeTab === 'parent' ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Linked Parent</Text>
              {parent ? (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Name</Text>
                    <Text style={styles.infoValue}>
                      {[parent.firstName, parent.lastName].filter(Boolean).join(' ') || parent.displayName || '—'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{parent.email || '—'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>{parent.phone || parent.phoneNumber || '—'}</Text>
                  </View>
                </>
              ) : (
                <Text style={styles.emptyText}>No linked parent found.</Text>
              )}
            </View>
          ) : null}
        </>
      ) : (
        <Text style={styles.subtitle}>Child profile not found.</Text>
      )}

      <Modal visible={confirmOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {confirmType === 'block' ? 'Block child account?' : 'Remove child account?'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {confirmType === 'block'
                ? 'This will prevent the child from accessing the app until unblocked.'
                : 'This marks the child as removed. This action can be reversed by an admin.'}
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setConfirmOpen(false)}
                style={({ pressed }) => [styles.modalButton, pressed && styles.actionBtnPressed]}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={async () => {
                  if (!childId) return;
                  const ref = doc(db, 'users', childId);
                  if (confirmType === 'block') {
                    await updateDoc(ref, { isBlocked: true, blockedAt: serverTimestamp() });
                  } else {
                    await updateDoc(ref, { isRemoved: true, removedAt: serverTimestamp() });
                  }
                  setConfirmOpen(false);
                }}
                style={({ pressed }) => [
                  styles.modalButton,
                  confirmType === 'remove' && styles.modalButtonDanger,
                  pressed && styles.actionBtnPressed,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  tabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tabChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tabChipActive: {
    borderColor: 'rgba(124,92,255,0.6)',
    backgroundColor: 'rgba(124,92,255,0.2)',
  },
  tabText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  actionBtnPressed: {
    transform: [{ scale: 0.98 }],
  },
  actionBtnText: {
    color: '#bba7ff',
    fontSize: 11,
    fontWeight: '700',
  },
  removeBtn: {
    borderColor: 'rgba(255,120,120,0.35)',
    backgroundColor: 'rgba(255,120,120,0.12)',
  },
  removeBtnText: {
    color: '#ffb4b4',
    fontSize: 11,
    fontWeight: '700',
  },
  center: { paddingVertical: 24, alignItems: 'center' },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  infoValue: { color: '#fff', fontSize: 12, fontWeight: '600' },
  emptyText: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
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
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 8 },
  modalSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  modalButtonDanger: {
    borderColor: 'rgba(255,120,120,0.45)',
    backgroundColor: 'rgba(255,120,120,0.2)',
  },
  modalButtonText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  modalButtonTextDanger: { color: '#ffb4b4' },
});
