import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { tokens } from '../styles/tokens';

const skills = ['Counting to 20', 'Number bonds', 'Place value', 'Addition within 20', 'Simple subtraction'];

export const CurriculumMathsScreen: React.FC = () => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={styles.title}>Curriculum · Maths</Text>
    <Text style={styles.subtitle}>Overview of Cambridge-aligned maths progression by stage.</Text>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>Coverage Summary</Text>
      <Text style={styles.cardText}>Early Years ? Stage 6 skill mapping and prerequisite health.</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '78%' }]} />
      </View>
      <Text style={styles.progressLabel}>78% of skills have baseline pools</Text>
    </View>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>Stage 1 Focus Skills</Text>
      {skills.map((skill) => (
        <Text key={skill} style={styles.listItem}>• {skill}</Text>
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
  listItem: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 6 },
  progressBar: { height: 8, borderRadius: tokens.radii.pill, backgroundColor: 'rgba(255,255,255,0.12)', marginTop: tokens.spacing.md, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: 'rgba(124,92,255,0.8)' },
  progressLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 6 },
});

