import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { collection, doc, onSnapshot, setDoc, deleteDoc, orderBy, query } from 'firebase/firestore';
import { tokens } from '../styles/tokens';
import { db } from '../firebase/firestore';

type GameRecord = {
  id: string;
  slug: string;
  description: string;
  type: 'baseline' | 'course';
  createdAt?: any;
  updatedAt?: any;
};

export const GameRegistryScreen: React.FC = () => {
  const [games, setGames] = React.useState<GameRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showModal, setShowModal] = React.useState(false);
  const [editing, setEditing] = React.useState<GameRecord | null>(null);
  const [slug, setSlug] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [type, setType] = React.useState<'baseline' | 'course'>('baseline');
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    const q = query(collection(db, 'gameRegistry'), orderBy('slug'));
    const unsub = onSnapshot(q, (snap) => {
      const next: GameRecord[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as any;
        next.push({
          id: docSnap.id,
          slug: data.slug || docSnap.id,
          description: data.description || '',
          type: data.type || 'baseline',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      setGames(next);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setSlug('');
    setDescription('');
    setType('baseline');
    setError('');
    setShowModal(true);
  };

  const openEdit = (game: GameRecord) => {
    setEditing(game);
    setSlug(game.slug);
    setDescription(game.description || '');
    setType(game.type || 'baseline');
    setError('');
    setShowModal(true);
  };

  const saveGame = async () => {
    if (!slug.trim()) {
      setError('Slug is required.');
      return;
    }
    setSaving(true);
    try {
      const id = slug.trim().toLowerCase();
      await setDoc(
        doc(db, 'gameRegistry', id),
        {
          slug: id,
          description: description.trim(),
          type,
          updatedAt: new Date(),
          ...(editing ? {} : { createdAt: new Date() }),
        },
        { merge: true }
      );
      setShowModal(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to save game.');
    } finally {
      setSaving(false);
    }
  };

  const removeGame = async (game: GameRecord) => {
    await deleteDoc(doc(db, 'gameRegistry', game.slug));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Game Registry</Text>
          <Text style={styles.subtitle}>Manage game slugs and metadata used by baseline and course content.</Text>
        </View>
        <Pressable onPress={openCreate} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Add Game</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colSlug]}>Slug</Text>
          <Text style={[styles.tableHeaderText, styles.colType]}>Type</Text>
          <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
          <Text style={[styles.tableHeaderText, styles.colActions]}>Actions</Text>
        </View>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : games.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No games configured yet.</Text>
          </View>
        ) : (
          games.map((game) => (
            <View key={game.slug} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colSlug]} numberOfLines={1}>{game.slug}</Text>
              <Text style={[styles.tableCell, styles.colType]}>{game.type}</Text>
              <Text style={[styles.tableCell, styles.colDesc]} numberOfLines={1}>{game.description || '—'}</Text>
              <View style={[styles.tableCell, styles.colActions, styles.actionCell]}>
                <Pressable onPress={() => openEdit(game)} style={styles.actionButton}>
                  <Text style={styles.actionText}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => removeGame(game)} style={[styles.actionButton, styles.removeButton]}>
                  <Text style={styles.actionText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>

      {showModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBackdrop} />
          <View style={[styles.card, styles.modalCard]}>
            <View style={styles.modalHeader}>
              <Text style={styles.cardTitle}>{editing ? 'Edit Game' : 'Add Game'}</Text>
              <Pressable onPress={() => setShowModal(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </View>

            <Text style={styles.formLabel}>Slug</Text>
            <TextInput
              value={slug}
              onChangeText={setSlug}
              placeholder="count-fish"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={[styles.input, editing && styles.inputDisabled]}
              editable={!editing}
            />

            <Text style={styles.formLabel}>Type</Text>
            <View style={styles.chipRow}>
              {['baseline', 'course'].map((opt) => {
                const active = type === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => setType(opt as 'baseline' | 'course')}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Short description for reviewers"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.textArea}
              multiline
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable onPress={saveGame} disabled={saving} style={styles.primaryButton}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Save</Text>}
            </Pressable>
          </View>
        </View>
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
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  tableHeader: { flexDirection: 'row', marginBottom: 8 },
  tableHeaderText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', flex: 1 },
  tableRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  tableCell: { color: '#fff', fontSize: 11, flex: 1, paddingRight: 6 },
  colSlug: { flex: 1.2 },
  colType: { flex: 0.6 },
  colDesc: { flex: 2 },
  colActions: { flex: 1, alignItems: 'flex-end' },
  loadingRow: { paddingVertical: 16, alignItems: 'center' },
  emptyRow: { paddingVertical: 16, alignItems: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  actionCell: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(122, 92, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(122, 92, 255, 0.6)',
  },
  removeButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.25)',
    borderColor: 'rgba(231, 76, 60, 0.5)',
  },
  actionText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  primaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(124,92,255,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(124,92,255,0.55)',
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 10,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 6, 24, 0.85)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 640,
    backgroundColor: 'rgba(30, 18, 52, 0.98)',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalClose: { paddingHorizontal: 10, paddingVertical: 6 },
  modalCloseText: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  formLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 10, textTransform: 'uppercase', marginTop: 12 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    marginTop: 6,
  },
  inputDisabled: { opacity: 0.6 },
  chipRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  chipActive: {
    borderColor: 'rgba(124,92,255,0.6)',
    backgroundColor: 'rgba(124,92,255,0.2)',
  },
  chipText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  chipTextActive: { color: '#fff', fontWeight: '800' },
  textArea: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    marginTop: 6,
    minHeight: 90,
  },
  errorText: { color: '#ffb4b4', fontSize: 11, marginTop: 10 },
});
