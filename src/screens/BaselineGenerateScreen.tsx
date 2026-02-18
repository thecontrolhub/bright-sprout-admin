import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { tokens } from '../styles/tokens';

export const BaselineGenerateScreen: React.FC = () => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={styles.title}>Baseline Generator</Text>
    <Text style={styles.subtitle}>Launch Cambridge-aligned baseline runs and review the generation plan.</Text>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>Run Configuration</Text>
      <Text style={styles.cardText}>Subject, stage, seed, and version selection will live here.</Text>
      <View style={styles.formRow}>
        <View style={styles.formField}>
          <Text style={styles.formLabel}>Subject</Text>
          <Text style={styles.formValue}>Maths / Literacy / Science</Text>
        </View>
        <View style={styles.formField}>
          <Text style={styles.formLabel}>Stage</Text>
          <Text style={styles.formValue}>Early Years, Stage 1-6</Text>
        </View>
      </View>
      <View style={styles.formRow}>
        <View style={styles.formField}>
          <Text style={styles.formLabel}>Seed</Text>
          <Text style={styles.formValue}>auto-generated</Text>
        </View>
        <View style={styles.formField}>
          <Text style={styles.formLabel}>Version</Text>
          <Text style={styles.formValue}>2026.02</Text>
        </View>
      </View>
    </View>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>Generation Plan</Text>
      <Text style={styles.cardText}>3-pass pipeline summary and expected output counts.</Text>
      <View style={styles.listRow}>
        <Text style={styles.listItem}>• Blueprint pass: 18 skills</Text>
        <Text style={styles.listItem}>• Template pass: 42 templates</Text>
        <Text style={styles.listItem}>• Sample items: 360 items</Text>
      </View>
    </View>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>Run Controls</Text>
      <Text style={styles.cardText}>Queue jobs, monitor rate limits, and save run metadata.</Text>
      <View style={styles.statusRow}>
        <View style={styles.statusChip}><Text style={styles.statusText}>Ready</Text></View>
        <View style={styles.statusChip}><Text style={styles.statusText}>Admin Only</Text></View>
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
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cardText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 6 },
  formRow: { flexDirection: 'row', gap: tokens.spacing.lg, marginTop: tokens.spacing.lg, flexWrap: 'wrap' },
  formField: { flex: 1, minWidth: 160 },
  formLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, textTransform: 'uppercase' },
  formValue: { color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 6 },
  listRow: { marginTop: tokens.spacing.md },
  listItem: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginBottom: 6 },
  statusRow: { flexDirection: 'row', gap: 10, marginTop: tokens.spacing.md },
  statusChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: tokens.radii.pill,
    backgroundColor: 'rgba(124,92,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(124,92,255,0.4)',
  },
  statusText: { color: '#d7ccff', fontSize: 10, fontWeight: '700' },
});

