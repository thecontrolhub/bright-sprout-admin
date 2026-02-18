import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { tokens } from '../styles/tokens';

const tickets = [
  { id: 'HC-09', topic: 'Baseline run failure', status: 'Open', updated: '1 hr ago' },
  { id: 'HC-08', topic: 'Parent login issue', status: 'Resolved', updated: 'Yesterday' },
  { id: 'HC-07', topic: 'Content request', status: 'Pending', updated: '2 days ago' },
];

export const HelpCenterScreen: React.FC = () => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={styles.title}>Help Center</Text>
    <Text style={styles.subtitle}>Support requests and system notes.</Text>

    {tickets.map((ticket) => (
      <View key={ticket.id} style={styles.card}>
        <Text style={styles.cardTitle}>{ticket.topic}</Text>
        <Text style={styles.cardText}>{ticket.id} · {ticket.status} · {ticket.updated}</Text>
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

