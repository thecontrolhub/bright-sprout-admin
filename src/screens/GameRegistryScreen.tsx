import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { tokens } from '../styles/tokens';

const games = [
  { slug: 'count-fish', surface: 'FishTankSurface', status: 'Active' },
  { slug: 'number-bonds-rocket', surface: 'RocketSurface', status: 'Active' },
  { slug: 'habitats-match', surface: 'HabitatScene', status: 'Draft' },
];

export const GameRegistryScreen: React.FC = () => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={styles.title}>Game Registry</Text>
    <Text style={styles.subtitle}>Renderer mappings, surfaces, and interaction types.</Text>

    {games.map((game) => (
      <View key={game.slug} style={styles.card}>
        <Text style={styles.cardTitle}>{game.slug}</Text>
        <Text style={styles.cardText}>Surface: {game.surface}</Text>
        <Text style={styles.cardText}>Status: {game.status}</Text>
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
});

