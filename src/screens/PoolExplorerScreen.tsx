import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { tokens } from '../styles/tokens';

const pools = [
  { skill: 'Counting 1-10', stage: 'Early Years', items: 180, coverage: '72%' },
  { skill: 'CVC Builder', stage: 'Stage 1', items: 210, coverage: '84%' },
  { skill: 'Habitats Match', stage: 'Stage 3', items: 96, coverage: '48%' },
];

export const PoolExplorerScreen: React.FC = () => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={styles.title}>Pool Explorer</Text>
    <Text style={styles.subtitle}>Inspect template pools, coverage, and sample items.</Text>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>Filters</Text>
      <Text style={styles.cardText}>Subject, stage, skill, and difficulty filters will appear here.</Text>
    </View>

    {pools.map((pool) => (
      <View key={pool.skill} style={styles.card}>
        <Text style={styles.cardTitle}>{pool.skill}</Text>
        <Text style={styles.cardText}>{pool.stage} · {pool.items} items · {pool.coverage} coverage</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: pool.coverage }] as any} />
        </View>
      </View>
    ))}
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
  progressBar: { height: 8, borderRadius: tokens.radii.pill, backgroundColor: 'rgba(255,255,255,0.12)', marginTop: tokens.spacing.md, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: 'rgba(124,92,255,0.8)' },
});

