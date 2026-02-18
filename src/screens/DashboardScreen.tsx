import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { tokens } from '../styles/tokens';

const kpis = [
  { label: 'Active Parents', value: '1,284', delta: '+4.2%' },
  { label: 'Active Children', value: '2,913', delta: '+3.1%' },
  { label: 'Baseline Runs', value: '48', delta: '+6' },
  { label: 'Avg. Session', value: '7.6 min', delta: '+0.4' },
];

const alerts = [
  { title: 'Literacy Stage 2 pool low', detail: 'Needs 120 more items for target coverage.' },
  { title: 'Science Stage 5 error rate high', detail: 'Recent run failed schema validation.' },
  { title: 'Parent onboarding drop', detail: 'Login-to-first-session down 5% WoW.' },
];

const recentRuns = [
  { id: 'RUN-1209', subject: 'Maths', stage: 'Stage 3', status: 'Success', time: '12 min ago' },
  { id: 'RUN-1208', subject: 'Science', stage: 'Stage 5', status: 'Failed', time: '48 min ago' },
  { id: 'RUN-1207', subject: 'Literacy', stage: 'Stage 1', status: 'Partial', time: '1 hr ago' },
];

export const DashboardScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>Live overview of Bright Sprout growth, content health, and baseline coverage.</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>Live</Text>
          <Text style={styles.badgeValue}>Last updated 2 min ago</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.kpiRow}>
          {kpis.map((kpi) => (
            <View key={kpi.label} style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{kpi.label}</Text>
              <Text style={styles.kpiValue}>{kpi.value}</Text>
              <Text style={styles.kpiDelta}>{kpi.delta} vs last week</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Weekly Activity</Text>
          <Text style={styles.sectionMeta}>Parents + Children sessions</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.chartRow}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
              <View key={day + idx} style={styles.chartBarWrap}>
                <View style={[styles.chartBar, { height: 28 + idx * 6 }]} />
                <Text style={styles.chartLabel}>{day}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.cardLarge}>
          <Text style={styles.cardTitle}>Content Coverage</Text>
          <Text style={styles.cardSub}>Blueprint vs pool coverage by subject</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '78%' }]} />
            </View>
            <Text style={styles.progressLabel}>Maths 78%</Text>
          </View>
          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '72%' }]} />
            </View>
            <Text style={styles.progressLabel}>Literacy 72%</Text>
          </View>
          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '64%' }]} />
            </View>
            <Text style={styles.progressLabel}>Science 64%</Text>
          </View>
        </View>
        <View style={styles.cardLarge}>
          <Text style={styles.cardTitle}>Operational Alerts</Text>
          <Text style={styles.cardSub}>Items that need attention</Text>
          {alerts.map((alert) => (
            <View key={alert.title} style={styles.alertRow}>
              <View style={styles.alertDot} />
              <View style={styles.alertTextWrap}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertDetail}>{alert.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Baseline Runs</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>Run</Text>
            <Text style={styles.tableHeaderText}>Subject</Text>
            <Text style={styles.tableHeaderText}>Stage</Text>
            <Text style={styles.tableHeaderText}>Status</Text>
            <Text style={styles.tableHeaderText}>Time</Text>
          </View>
          {recentRuns.map((run) => (
            <View key={run.id} style={styles.tableRow}>
              <Text style={styles.tableCell}>{run.id}</Text>
              <Text style={styles.tableCell}>{run.subject}</Text>
              <Text style={styles.tableCell}>{run.stage}</Text>
              <Text style={styles.tableCell}>{run.status}</Text>
              <Text style={styles.tableCell}>{run.time}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: tokens.spacing.xl,
    gap: tokens.spacing.lg,
    paddingBottom: 64,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: tokens.spacing.lg,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 6,
    maxWidth: 460,
  },
  badge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: tokens.radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  badgeLabel: {
    color: '#bba7ff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  badgeValue: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  section: {
    gap: tokens.spacing.md,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionMeta: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.lg,
  },
  kpiCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    minWidth: 160,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  kpiLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
  },
  kpiValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginVertical: 6,
  },
  kpiDelta: {
    color: '#b9a6ff',
    fontSize: 11,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  chartBarWrap: {
    alignItems: 'center',
    gap: 6,
  },
  chartBar: {
    width: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(124,92,255,0.65)',
  },
  chartLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.lg,
  },
  cardLarge: {
    flex: 1,
    minWidth: 260,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  cardSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginVertical: 8,
  },
  progressRow: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: tokens.radii.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(124,92,255,0.8)',
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 6,
  },
  alertRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  alertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffb86b',
    marginTop: 6,
  },
  alertTextWrap: {
    flex: 1,
  },
  alertTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  alertDetail: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginTop: 4,
  },
  table: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tableHeaderText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '700',
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tableCell: {
    color: '#fff',
    fontSize: 11,
    flex: 1,
  },
});

