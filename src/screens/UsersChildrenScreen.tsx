import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { tokens } from '../styles/tokens';

const children = [
  { name: 'Andile', stage: 'Early Years', mastery: '78%', lastActive: 'Today' },
  { name: 'Lulu', stage: 'Stage 1', mastery: '64%', lastActive: 'Yesterday' },
  { name: 'Sipho', stage: 'Stage 2', mastery: '59%', lastActive: '3 days' },
];

export const UsersChildrenScreen: React.FC = () => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={styles.title}>Children</Text>
    <Text style={styles.subtitle}>Progress signals and activity by child profile.</Text>

    <View style={styles.card}>
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderText}>Child</Text>
        <Text style={styles.tableHeaderText}>Stage</Text>
        <Text style={styles.tableHeaderText}>Mastery</Text>
        <Text style={styles.tableHeaderText}>Last active</Text>
      </View>
      {children.map((child) => (
        <View key={child.name} style={styles.tableRow}>
          <Text style={styles.tableCell}>{child.name}</Text>
          <Text style={styles.tableCell}>{child.stage}</Text>
          <Text style={styles.tableCell}>{child.mastery}</Text>
          <Text style={styles.tableCell}>{child.lastActive}</Text>
        </View>
      ))}
    </View>
  </ScrollView>
);

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
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  tableCell: { color: '#fff', fontSize: 11, flex: 1 },
});

