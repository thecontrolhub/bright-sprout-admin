import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { tokens } from '../styles/tokens';

const admins = [
  { name: 'Admin One', role: 'Owner', lastLogin: 'Today' },
  { name: 'Content Lead', role: 'Editor', lastLogin: 'Yesterday' },
  { name: 'QA Reviewer', role: 'Reviewer', lastLogin: '3 days' },
];

export const UsersAdminScreen: React.FC = () => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={styles.title}>Admins</Text>
    <Text style={styles.subtitle}>Admin access and permissions overview.</Text>

    <View style={styles.card}>
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderText}>Name</Text>
        <Text style={styles.tableHeaderText}>Role</Text>
        <Text style={styles.tableHeaderText}>Last login</Text>
      </View>
      {admins.map((admin) => (
        <View key={admin.name} style={styles.tableRow}>
          <Text style={styles.tableCell}>{admin.name}</Text>
          <Text style={styles.tableCell}>{admin.role}</Text>
          <Text style={styles.tableCell}>{admin.lastLogin}</Text>
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

