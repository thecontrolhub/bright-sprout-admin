import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { tokens } from '../styles/tokens';

const segments = [
  { label: 'Early Years', value: '32%' },
  { label: 'Stage 1-2', value: '41%' },
  { label: 'Stage 3-4', value: '19%' },
  { label: 'Stage 5-6', value: '8%' },
];

export const AnalyticsScreen: React.FC = () => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={styles.title}>Analytics</Text>
    <Text style={styles.subtitle}>Usage, retention, and content effectiveness signals.</Text>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>Engagement Trend</Text>
      <Text style={styles.cardText}>Weekly sessions across parents and children.</Text>
      <View style={styles.chartRow}>
        {['W1', 'W2', 'W3', 'W4', 'W5'].map((label, idx) => (
          <View key={label} style={styles.chartBarWrap}>
            <View style={[styles.chartBar, { height: 24 + idx * 8 }]} />
            <Text style={styles.chartLabel}>{label}</Text>
          </View>
        ))}
      </View>
    </View>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>Stage Distribution</Text>
      {segments.map((seg) => (
        <View key={seg.label} style={styles.segmentRow}>
          <Text style={styles.segmentLabel}>{seg.label}</Text>
          <Text style={styles.segmentValue}>{seg.value}</Text>
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
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cardText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 6 },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 16, marginTop: tokens.spacing.md },
  chartBarWrap: { alignItems: 'center', gap: 6 },
  chartBar: { width: 12, borderRadius: 6, backgroundColor: 'rgba(124,92,255,0.7)' },
  chartLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  segmentRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  segmentLabel: { color: '#fff', fontSize: 12, fontWeight: '600' },
  segmentValue: { color: '#bba7ff', fontSize: 12, fontWeight: '700' },
});

