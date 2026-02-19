import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { tokens } from '../styles/tokens';
import { db } from '../firebase/firestore';
import { useNavigation } from '../navigation/NavigationContext';

type ChildRow = {
  id: string;
  name: string;
  grade?: string;
  lastActiveAt?: Date | null;
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

export const ParentDetailScreen: React.FC = () => {
  const { params } = useNavigation();
  const parentId = params.id;
  const [parent, setParent] = React.useState<any | null>(null);
  const [children, setChildren] = React.useState<ChildRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!parentId) return;
    const parentRef = doc(db, 'users', parentId);
    const unsubParent = onSnapshot(parentRef, (snap) => {
      setParent(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setLoading(false);
    });
    const childQuery = query(collection(db, 'users'), where('role', '==', 'child'), where('parentUid', '==', parentId));
    const unsubChildren = onSnapshot(childQuery, (snap) => {
      const rows: ChildRow[] = [];
      snap.forEach((d) => {
        const data = d.data();
        const name = [data.firstName, data.lastName].filter(Boolean).join(' ') || data.displayName || 'Child';
        rows.push({
          id: d.id,
          name,
          grade: data.grade,
          lastActiveAt: toDateSafe(data.lastActiveAt) || toDateSafe(data.updatedAt) || toDateSafe(data.createdAt),
        });
      });
      setChildren(rows);
    });
    return () => {
      unsubParent();
      unsubChildren();
    };
  }, [parentId]);

  if (!parentId) {
    return (
      <View style={styles.center}>
        <Text style={styles.subtitle}>No parent selected.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Parent Profile</Text>
      <Text style={styles.subtitle}>Manage parent details and linked children.</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : parent ? (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Details</Text>
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
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Role</Text>
              <Text style={styles.infoValue}>{parent.role || 'parent'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Billing Plan</Text>
              <Text style={styles.infoValue}>{parent.billing?.plan || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Billing Status</Text>
              <Text style={styles.infoValue}>{parent.billing?.status || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Active</Text>
              <Text style={styles.infoValue}>
                {formatLastActive(toDateSafe(parent.lastActiveAt) || toDateSafe(parent.updatedAt))}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Address</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Street</Text>
              <Text style={styles.infoValue}>{parent.address?.street || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>City</Text>
              <Text style={styles.infoValue}>{parent.address?.city || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>State</Text>
              <Text style={styles.infoValue}>{parent.address?.state || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Postal Code</Text>
              <Text style={styles.infoValue}>{parent.address?.postalCode || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Country</Text>
              <Text style={styles.infoValue}>{parent.address?.country || '—'}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Banking</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account Name</Text>
              <Text style={styles.infoValue}>{parent.banking?.accountName || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account Number</Text>
              <Text style={styles.infoValue}>{parent.banking?.accountNumber || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bank</Text>
              <Text style={styles.infoValue}>{parent.banking?.bankName || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Routing</Text>
              <Text style={styles.infoValue}>{parent.banking?.routingNumber || '—'}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Profile</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Photo</Text>
              <Text style={styles.infoValue}>{parent.photoUrl ? 'Uploaded' : '—'}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>App Settings</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Push Notifications</Text>
              <Text style={styles.infoValue}>{parent.settings?.pushNotifications ? 'On' : 'Off'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email Summaries</Text>
              <Text style={styles.infoValue}>{parent.settings?.emailSummaries ? 'On' : 'Off'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Sounds</Text>
              <Text style={styles.infoValue}>{parent.settings?.sounds ? 'On' : 'Off'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Reduced Motion</Text>
              <Text style={styles.infoValue}>{parent.settings?.reducedMotion ? 'On' : 'Off'}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Children</Text>
            {children.length === 0 ? (
              <Text style={styles.emptyText}>No linked children found.</Text>
            ) : (
              children.map((child) => (
                <View key={child.id} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{child.name}</Text>
                  <Text style={styles.tableCell}>{child.grade || '—'}</Text>
                  <Text style={styles.tableCell}>{formatLastActive(child.lastActiveAt)}</Text>
                </View>
              ))
            )}
          </View>
        </>
      ) : (
        <Text style={styles.subtitle}>Parent profile not found.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: tokens.spacing.xl, gap: tokens.spacing.lg, paddingBottom: 64 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
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
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  tableCell: { color: '#fff', fontSize: 11, flex: 1 },
});
