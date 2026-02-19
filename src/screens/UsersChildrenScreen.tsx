import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Modal, TextInput } from 'react-native';
import {
  collection,
  query,
  where,
  doc,
  updateDoc,
  serverTimestamp,
  getDocs,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { tokens } from '../styles/tokens';
import { db } from '../firebase/firestore';
import { useNavigation } from '../navigation/NavigationContext';

type ChildRow = {
  id: string;
  name: string;
  grade?: string;
  lastActiveAt?: Date | null;
  isBlocked?: boolean;
  isRemoved?: boolean;
};

const PAGE_SIZE = 10;

const formatLastActive = (date?: Date | null) => {
  if (!date) return '—';
  const now = Date.now();
  const diffDays = Math.floor((now - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days`;
};

const getStatus = (date?: Date | null) => {
  if (!date) return 'Unknown';
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 3) return 'Active';
  if (diffDays <= 7) return 'At risk';
  return 'Churn risk';
};

const toDateSafe = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  return null;
};

export const UsersChildrenScreen: React.FC = () => {
  const { navigate } = useNavigation();
  const [children, setChildren] = React.useState<ChildRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [queryText, setQueryText] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'risk' | 'churn'>('all');
  const [searchField, setSearchField] = React.useState<'email' | 'username' | 'name'>('email');
  const [page, setPage] = React.useState(0);
  const [hasNext, setHasNext] = React.useState(false);
  const cursorRef = React.useRef<Array<DocumentSnapshot | null>>([null]);

  const fetchPage = React.useCallback(async (pageIndex: number) => {
    setLoading(true);
    const startAfterDoc = cursorRef.current[pageIndex] || null;
    const now = Timestamp.now();
    const threeDaysAgo = Timestamp.fromMillis(now.toMillis() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = Timestamp.fromMillis(now.toMillis() - 7 * 24 * 60 * 60 * 1000);

    const baseFilters: any[] = [where('role', '==', 'child')];

    if (queryText.trim()) {
      const term = queryText.trim().toLowerCase();
      if (searchField === 'email') {
        baseFilters.push(where('email', '==', term));
      } else if (searchField === 'username') {
        baseFilters.push(where('username', '==', term));
      } else {
        baseFilters.push(where('displayNameLower', 'array-contains', term));
      }
    }

    if (statusFilter === 'active') {
      baseFilters.push(where('lastActiveAt', '>=', threeDaysAgo));
    } else if (statusFilter === 'risk') {
      baseFilters.push(where('lastActiveAt', '>=', sevenDaysAgo));
      baseFilters.push(where('lastActiveAt', '<', threeDaysAgo));
    } else if (statusFilter === 'churn') {
      baseFilters.push(where('lastActiveAt', '<', sevenDaysAgo));
    }

    const orderField = statusFilter === 'all' ? 'createdAt' : 'lastActiveAt';

    let childQuery = query(
      collection(db, 'users'),
      ...baseFilters,
      orderBy(orderField, 'desc'),
      orderBy('__name__'),
      limit(PAGE_SIZE)
    );
    if (startAfterDoc) {
      childQuery = query(
        collection(db, 'users'),
        ...baseFilters,
        orderBy(orderField, 'desc'),
        orderBy('__name__'),
        startAfter(startAfterDoc),
        limit(PAGE_SIZE)
      );
    }

    const childSnap = await getDocs(childQuery);
    const rows: ChildRow[] = [];
    childSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const displayName = data.displayName || data.username;
      const name = [data.firstName, data.lastName].filter(Boolean).join(' ') || displayName || data.email || 'Child';
      const lastActiveAt =
        toDateSafe(data.lastActiveAt) ||
        toDateSafe(data.updatedAt) ||
        toDateSafe(data.createdAt);
      rows.push({
        id: docSnap.id,
        name,
        grade: data.grade,
        lastActiveAt,
        isBlocked: data.isBlocked === true,
        isRemoved: data.isRemoved === true,
      });
    });

    setChildren(rows);
    setHasNext(childSnap.size === PAGE_SIZE);
    if (childSnap.size > 0) {
      const lastDoc = childSnap.docs[childSnap.docs.length - 1];
      cursorRef.current[pageIndex + 1] = lastDoc;
    }
    setLoading(false);
  }, [queryText, searchField, statusFilter]);

  React.useEffect(() => {
    fetchPage(page);
  }, [fetchPage, page]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Children</Text>
          <Text style={styles.subtitle}>Progress signals and activity by child profile.</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setFilterOpen(true)}
            style={({ pressed }) => [styles.filterButton, pressed && styles.filterButtonPressed]}
          >
            <Text style={styles.filterText}>Filter</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Child</Text>
          <Text style={styles.tableHeaderText}>Grade</Text>
          <Text style={styles.tableHeaderText}>Status</Text>
          <Text style={styles.tableHeaderText}>Last active</Text>
          <Text style={[styles.tableHeaderText, styles.actionHeader]}>Actions</Text>
        </View>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : children.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No child profiles found.</Text>
          </View>
        ) : (
          children.map((child) => (
            <View key={child.id} style={styles.tableRow}>
              <Text style={styles.tableCell}>{child.name}</Text>
              <Text style={styles.tableCell}>{child.grade || '—'}</Text>
              <Text style={styles.tableCell}>{getStatus(child.lastActiveAt)}</Text>
              <Text style={styles.tableCell}>{formatLastActive(child.lastActiveAt)}</Text>
              <View style={styles.actionCellWrap}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => navigate('childDetail', { id: child.id })}
                  style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
                >
                  <Text style={styles.actionButtonText}>Manage</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={async () => {
                    const ref = doc(db, 'users', child.id);
                    await updateDoc(ref, {
                      isBlocked: !child.isBlocked,
                      blockedAt: child.isBlocked ? null : serverTimestamp(),
                    });
                  }}
                  style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
                >
                  <Text style={styles.actionButtonText}>
                    {child.isBlocked ? 'Unblock' : 'Block'}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={async () => {
                    const ref = doc(db, 'users', child.id);
                    await updateDoc(ref, {
                      isRemoved: true,
                      removedAt: serverTimestamp(),
                    });
                  }}
                  style={({ pressed }) => [styles.actionButton, styles.removeButton, pressed && styles.actionButtonPressed]}
                >
                  <Text style={[styles.actionButtonText, styles.removeText]}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        <View style={styles.paginationRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setPage((prev) => Math.max(prev - 1, 0))}
            disabled={page === 0}
            style={({ pressed }) => [styles.pageButton, page === 0 && styles.pageButtonDisabled, pressed && styles.actionButtonPressed]}
          >
            <Text style={styles.pageButtonText}>Previous</Text>
          </Pressable>
          <Text style={styles.pageLabel}>Page {page + 1}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => hasNext && setPage((prev) => prev + 1)}
            disabled={!hasNext}
            style={({ pressed }) => [styles.pageButton, !hasNext && styles.pageButtonDisabled, pressed && styles.actionButtonPressed]}
          >
            <Text style={styles.pageButtonText}>Next</Text>
          </Pressable>
        </View>
      </View>

      <Modal visible={filterOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Filter Children</Text>
            <Text style={styles.modalLabel}>Search</Text>
            <TextInput
              value={queryText}
              onChangeText={setQueryText}
              placeholder="Search by name"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.modalInput}
            />

            <Text style={styles.modalLabel}>Search Field</Text>
            <View style={styles.modalOptions}>
              {[
                { key: 'email', label: 'Email' },
                { key: 'username', label: 'Username' },
                { key: 'name', label: 'Name' },
              ].map((opt) => (
                <Pressable
                  key={opt.key}
                  accessibilityRole="button"
                  onPress={() => setSearchField(opt.key as any)}
                  style={({ pressed }) => [
                    styles.modalOption,
                    searchField === opt.key && styles.modalOptionActive,
                    pressed && styles.filterButtonPressed,
                  ]}
                >
                  <Text style={styles.modalOptionText}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.modalLabel}>Status</Text>
            <View style={styles.modalOptions}>
              {[
                { key: 'all', label: 'All' },
                { key: 'active', label: 'Active' },
                { key: 'risk', label: 'At risk' },
                { key: 'churn', label: 'Churn risk' },
              ].map((opt) => (
                <Pressable
                  key={opt.key}
                  accessibilityRole="button"
                  onPress={() => setStatusFilter(opt.key as any)}
                  style={({ pressed }) => [
                    styles.modalOption,
                    statusFilter === opt.key && styles.modalOptionActive,
                    pressed && styles.filterButtonPressed,
                  ]}
                >
                  <Text style={styles.modalOptionText}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setQueryText('');
                  setStatusFilter('all');
                  setSearchField('email');
                }}
                style={({ pressed }) => [styles.modalButton, pressed && styles.filterButtonPressed]}
              >
                <Text style={styles.modalButtonText}>Reset</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setFilterOpen(false)}
                style={({ pressed }) => [styles.modalButton, styles.modalButtonPrimary, pressed && styles.filterButtonPressed]}
              >
                <Text style={styles.modalButtonTextPrimary}>Apply</Text>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  filterButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  filterText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
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
  actionHeader: { flex: 0.8, textAlign: 'right' },
  actionCellWrap: {
    flex: 0.8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  actionButtonText: {
    color: '#bba7ff',
    fontWeight: '700',
    fontSize: 11,
  },
  removeButton: {
    marginTop: 2,
  },
  removeText: {
    color: '#ffb4b4',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: tokens.spacing.lg,
  },
  pageButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pageButtonDisabled: {
    opacity: 0.4,
  },
  pageButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  pageLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
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
    maxWidth: 420,
    backgroundColor: 'rgba(24,16,40,0.98)',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 12 },
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
  modalOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  modalOption: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  modalOptionActive: {
    borderColor: 'rgba(124,92,255,0.6)',
    backgroundColor: 'rgba(124,92,255,0.2)',
  },
  modalOptionText: { color: '#fff', fontSize: 11, fontWeight: '600' },
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
  modalButtonText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  modalButtonTextPrimary: { color: '#fff', fontSize: 11, fontWeight: '800' },
});
