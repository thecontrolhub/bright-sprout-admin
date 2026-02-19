import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Modal, TextInput } from 'react-native';
import { addDoc, arrayUnion, collection, doc, onSnapshot, orderBy, query, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { tokens } from '../styles/tokens';
import { db } from '../firebase/firestore';
import { useAdminAuth } from '../auth/AdminAuthContext';

type Ticket = {
  id: string;
  subject?: string;
  message?: string;
  email?: string;
  displayName?: string;
  status?: string;
  userId?: string;
  comments?: Array<{
    message?: string;
    createdAt?: Date | null;
    authorName?: string;
    authorEmail?: string;
  }>;
  createdAt?: Date | null;
};

const toDateSafe = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  return null;
};

const formatDate = (date?: Date | null) => {
  if (!date) return '—';
  return date.toLocaleString();
};

export const HelpCenterScreen: React.FC = () => {
  const { user } = useAdminAuth();
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusOpen, setStatusOpen] = React.useState(false);
  const [viewOpen, setViewOpen] = React.useState(false);
  const [commentsOpen, setCommentsOpen] = React.useState(false);
  const [activeTicket, setActiveTicket] = React.useState<Ticket | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [reply, setReply] = React.useState('');
  const statusOptions = ['Logged', 'In progress', 'Resolved', 'Blocked'];

  React.useEffect(() => {
    const ticketQuery = query(collection(db, 'helpcentre'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(ticketQuery, (snap) => {
      const rows: Ticket[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        rows.push({
          id: docSnap.id,
          subject: data.subject,
          message: data.message,
          email: data.email,
          displayName: data.displayName,
          status: data.status,
          userId: data.userId,
          comments: Array.isArray(data.comments)
            ? data.comments.map((c: any) => ({
              message: c?.message,
              createdAt: toDateSafe(c?.createdAt),
              authorName: c?.authorName,
              authorEmail: c?.authorEmail,
            }))
            : [],
          createdAt: toDateSafe(data.createdAt),
        });
      });
      setTickets(rows);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Help Center</Text>
      <Text style={styles.subtitle}>Support requests and system notes.</Text>

      <View style={styles.card}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Subject</Text>
          <Text style={styles.tableHeaderText}>User</Text>
          <Text style={styles.tableHeaderText}>Created</Text>
          <Text style={[styles.tableHeaderText, styles.actionHeader]}>Actions</Text>
        </View>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : tickets.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No support requests yet.</Text>
          </View>
        ) : (
          tickets.map((ticket) => (
            <View key={ticket.id} style={styles.tableRow}>
              <Text style={styles.tableCell}>{ticket.subject || '—'}</Text>
              <Text style={styles.tableCell}>{ticket.displayName || '—'}</Text>
              <Text style={styles.tableCell}>{formatDate(ticket.createdAt)}</Text>
              <View style={styles.actionCellWrap}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setActiveTicket(ticket);
                    setViewOpen(true);
                    setReply('');
                    setError('');
                  }}
                  style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
                >
                  <Text style={styles.actionText}>View</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setActiveTicket(ticket);
                    setCommentsOpen(true);
                    setError('');
                  }}
                  style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
                >
                  <Text style={styles.actionText}>Comments</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setActiveTicket(ticket);
                    setStatusOpen(true);
                    setError('');
                  }}
                  style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
                >
                  <Text style={styles.actionText}>Update</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>

      <Modal visible={statusOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Update Status</Text>
            <Text style={styles.modalSubtitle}>
              {activeTicket?.subject || 'Support request'}
            </Text>
            <View style={styles.statusOptions}>
              {statusOptions.map((status) => {
                const active = (activeTicket?.status || 'Logged') === status;
                return (
                  <Pressable
                    key={status}
                    accessibilityRole="button"
                    onPress={async () => {
                      if (!activeTicket) return;
                      setSaving(true);
                      setError('');
                      try {
                        await updateDoc(doc(db, 'helpcentre', activeTicket.id), { status });
                        setStatusOpen(false);
                      } catch (err: any) {
                        setError(err?.message || 'Unable to update status.');
                      } finally {
                        setSaving(false);
                      }
                    }}
                    style={({ pressed }) => [
                      styles.statusChip,
                      active && styles.statusChipActive,
                      pressed && styles.actionPressed,
                    ]}
                  >
                    <Text style={[styles.statusChipText, active && styles.statusChipTextActive]}>
                      {status}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setStatusOpen(false)}
                style={({ pressed }) => [styles.modalButton, pressed && styles.actionPressed]}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </Pressable>
              {saving ? <ActivityIndicator color="#fff" /> : null}
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={viewOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.detailText}>{activeTicket?.message || 'No description provided.'}</Text>

            <Text style={styles.detailLabel}>Reply</Text>
            <TextInput
              value={reply}
              onChangeText={setReply}
              placeholder="Type your response..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={[styles.modalInput, styles.replyInput]}
              multiline
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setViewOpen(false)}
                style={({ pressed }) => [styles.modalButton, pressed && styles.actionPressed]}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={async () => {
                  if (!activeTicket?.userId) {
                    setError('User ID missing on ticket.');
                    return;
                  }
                  if (!reply.trim()) {
                    setError('Reply is required.');
                    return;
                  }
                  setSaving(true);
                  setError('');
                  try {
                    await addDoc(collection(db, 'users', activeTicket.userId, 'notifications'), {
                      title: 'Support reply',
                      body: reply.trim(),
                      createdAt: serverTimestamp(),
                      read: false,
                      type: 'support',
                      ticketId: activeTicket.id,
                      userId: activeTicket.userId,
                    });
                    await updateDoc(doc(db, 'helpcentre', activeTicket.id), {
                      comments: arrayUnion({
                        message: reply.trim(),
                        createdAt: Timestamp.now(),
                        authorName: user?.displayName || 'Admin',
                        authorEmail: user?.email || '',
                      }),
                    });
                    setReply('');
                    setViewOpen(false);
                  } catch (err: any) {
                    setError(err?.message || 'Unable to send reply.');
                  } finally {
                    setSaving(false);
                  }
                }}
                style={({ pressed }) => [styles.modalButton, styles.modalButtonPrimary, pressed && styles.actionPressed]}
              >
                <Text style={styles.modalButtonTextPrimary}>{saving ? 'Sending...' : 'Reply'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={commentsOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Comment History</Text>
            {activeTicket?.comments && activeTicket.comments.length > 0 ? (
              activeTicket.comments.map((comment, index) => (
                <View key={`${activeTicket.id}-c-${index}`} style={styles.commentRow}>
                  <Text style={styles.commentMeta}>
                    {comment.authorName || 'Admin'} {comment.authorEmail ? `· ${comment.authorEmail}` : ''}{' '}
                    {comment.createdAt ? `· ${formatDate(comment.createdAt)}` : ''}
                  </Text>
                  <Text style={styles.commentText}>{comment.message || '—'}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No comments yet.</Text>
            )}
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setCommentsOpen(false)}
                style={({ pressed }) => [styles.modalButton, pressed && styles.actionPressed]}
              >
                <Text style={styles.modalButtonText}>Close</Text>
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
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  tableHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  tableHeaderText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', flex: 1 },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  tableCell: { color: '#fff', fontSize: 11, flex: 1 },
  actionHeader: { flex: 1, textAlign: 'right' },
  actionCellWrap: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  actionButton: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  actionText: { color: '#d6ccff', fontSize: 11, fontWeight: '700' },
  actionPressed: { transform: [{ scale: 0.98 }] },
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
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 6 },
  modalSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 12 },
  statusOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  statusChipActive: {
    borderColor: 'rgba(124,92,255,0.6)',
    backgroundColor: 'rgba(124,92,255,0.2)',
  },
  statusChipText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  statusChipTextActive: { color: '#fff', fontWeight: '800' },
  errorText: { color: '#ffb4b4', fontSize: 11, marginTop: 10 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  modalButtonText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  modalButtonPrimary: {
    borderColor: 'rgba(124,92,255,0.6)',
    backgroundColor: 'rgba(124,92,255,0.25)',
  },
  modalButtonTextPrimary: { color: '#fff', fontSize: 11, fontWeight: '800' },
  detailLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 8, marginBottom: 4 },
  detailText: { color: '#fff', fontSize: 12 },
  replyInput: { minHeight: 90, textAlignVertical: 'top', color: '#fff' },
  commentRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  commentMeta: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginBottom: 4 },
  commentText: { color: '#fff', fontSize: 12 },
});
