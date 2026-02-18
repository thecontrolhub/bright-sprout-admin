import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { tokens } from '../styles/tokens';

const parents = [
  { name: 'A. Mthembu', children: 2, status: 'Active', lastActive: 'Today' },
  { name: 'L. Nkosi', children: 1, status: 'Active', lastActive: 'Yesterday' },
  { name: 'P. Dlamini', children: 3, status: 'Churn risk', lastActive: '5 days' },
];

export const UsersParentScreen: React.FC = () => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={styles.title}>Parents</Text>
    <Text style={styles.subtitle}>Overview of parent accounts and engagement.</Text>

    <View style={styles.card}>
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderText}>Parent</Text>
        <Text style={styles.tableHeaderText}>Children</Text>
        <Text style={styles.tableHeaderText}>Status</Text>
        <Text style={styles.tableHeaderText}>Last active</Text>
      </View>
      {parents.map((parent) => (
        <View key={parent.name} style={styles.tableRow}>
          <Text style={styles.tableCell}>{parent.name}</Text>
          <Text style={styles.tableCell}>{parent.children}</Text>
          <Text style={styles.tableCell}>{parent.status}</Text>
          <Text style={styles.tableCell}>{parent.lastActive}</Text>
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

