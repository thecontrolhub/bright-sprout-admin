import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { tokens } from '../styles/tokens';

const runs = [
  { id: 'RUN-1209', subject: 'Maths', stage: 'Stage 3', status: 'Success', duration: '9m' },
  { id: 'RUN-1208', subject: 'Science', stage: 'Stage 5', status: 'Failed', duration: '6m' },
  { id: 'RUN-1207', subject: 'Literacy', stage: 'Stage 1', status: 'Partial', duration: '11m' },
  { id: 'RUN-1206', subject: 'Maths', stage: 'Stage 6', status: 'Success', duration: '8m' },
];

export const BaselineRunsScreen: React.FC = () => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={styles.title}>Active Runs</Text>
    <Text style={styles.subtitle}>Monitor baseline generation status, outputs, and errors.</Text>

    <View style={styles.card}>
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderText}>Run</Text>
        <Text style={styles.tableHeaderText}>Subject</Text>
        <Text style={styles.tableHeaderText}>Stage</Text>
        <Text style={styles.tableHeaderText}>Status</Text>
        <Text style={styles.tableHeaderText}>Duration</Text>
      </View>
      {runs.map((run) => (
        <View key={run.id} style={styles.tableRow}>
          <Text style={styles.tableCell}>{run.id}</Text>
          <Text style={styles.tableCell}>{run.subject}</Text>
          <Text style={styles.tableCell}>{run.stage}</Text>
          <Text style={styles.tableCell}>{run.status}</Text>
          <Text style={styles.tableCell}>{run.duration}</Text>
        </View>
      ))}
    </View>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>Recent Errors</Text>
      <Text style={styles.cardText}>Schema validation and rate-limit warnings appear here.</Text>
      <View style={styles.alert}>
        <Text style={styles.alertTitle}>Science Stage 5: poolSpec mismatch</Text>
        <Text style={styles.alertText}>Template item schema failed validation for 3 items.</Text>
      </View>
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
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cardText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 6 },
  alert: { marginTop: tokens.spacing.md, padding: tokens.spacing.md, borderRadius: tokens.radii.md, backgroundColor: 'rgba(255,120,120,0.15)', borderWidth: 1, borderColor: 'rgba(255,120,120,0.3)' },
  alertTitle: { color: '#fff', fontSize: 12, fontWeight: '700' },
  alertText: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4 },
});

