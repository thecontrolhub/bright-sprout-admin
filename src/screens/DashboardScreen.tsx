import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { tokens } from '../styles/tokens';

const kpis = [
  { label: 'Daily Active Parents', value: '1,284', delta: '+4.2%' },
  { label: 'Daily Active Children', value: '2,913', delta: '+3.1%' },
  { label: 'Weekly Active Users', value: '7,842', delta: '+5.6%' },
  { label: 'DAU / WAU', value: '36%', delta: '+1.2%' },
];

const engagement = [
  { label: 'Avg sessions / child', value: '3.6', delta: '+0.4' },
  { label: 'Avg session length', value: '7.6 min', delta: '+0.4' },
  { label: 'Lessons completed', value: '12.4k', delta: '+8%' },
  { label: '% baseline completed', value: '62%', delta: '+3%' },
];

const outcomes = [
  { label: 'Median mastery (Maths)', value: '72%' },
  { label: 'Median mastery (Literacy)', value: '64%' },
  { label: 'Median mastery (Science)', value: '59%' },
  { label: '% skills mastered', value: '41%' },
];

const retention = [
  { label: 'New parents (7d)', value: '312', delta: '+9%' },
  { label: '7-day retention', value: '48%', delta: '+2%' },
  { label: '30-day retention', value: '31%', delta: '+1%' },
  { label: 'At-risk accounts', value: '126', delta: '-4%' },
];

const contentHealth = [
  { label: 'Pool coverage (all)', value: '71%' },
  { label: 'Missing skills', value: '42' },
  { label: 'Validation fails', value: '3' },
  { label: 'Generator error rate', value: '1.6%' },
];

const ops = [
  { label: 'Runs this week', value: '48' },
  { label: 'Success rate', value: '92%' },
  { label: 'Avg run time', value: '8m 14s' },
  { label: 'Queued runs', value: '5' },
];

const revenue = [
  { label: 'Trials', value: '142' },
  { label: 'Paid', value: '61' },
  { label: 'Trial→Paid', value: '18%' },
  { label: 'MRR', value: '$4.2k' },
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
          <Text style={styles.subtitle}>Live overview of Bright Sprout growth, content health, and learning outcomes.</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>Live</Text>
          <Text style={styles.badgeValue}>Last updated 2 min ago</Text>
        </View>
      </View>

      <DashboardSection title="Active Usage">
        <MetricGrid items={kpis} />
      </DashboardSection>

      <DashboardSection title="Engagement & Learning">
        <MetricGrid items={engagement} />
      </DashboardSection>

      <DashboardSection title="Mastery & Outcomes">
        <MetricGrid items={outcomes} />
      </DashboardSection>

      <DashboardSection title="Retention & Churn">
        <MetricGrid items={retention} />
      </DashboardSection>

      <DashboardSection title="Content Health">
        <MetricGrid items={contentHealth} />
      </DashboardSection>

      <DashboardSection title="Operational">
        <MetricGrid items={ops} />
      </DashboardSection>

      <DashboardSection title="Revenue (Preview)">
        <MetricGrid items={revenue} />
      </DashboardSection>

      <DashboardSection title="Weekly Activity">
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
      </DashboardSection>

      <View style={styles.grid}>
        <View style={styles.cardLarge}>
          <Text style={styles.cardTitle}>Content Coverage</Text>
          <Text style={styles.cardSub}>Blueprint vs pool coverage by subject</Text>
          <ProgressRow label="Maths 78%" width="78%" />
          <ProgressRow label="Literacy 72%" width="72%" />
          <ProgressRow label="Science 64%" width="64%" />
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

      <DashboardSection title="Recent Baseline Runs">
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
      </DashboardSection>
    </ScrollView>
  );
};

const DashboardSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const MetricGrid: React.FC<{ items: Array<{ label: string; value: string; delta?: string }> }> = ({ items }) => (
  <View style={styles.kpiRow}>
    {items.map((kpi) => (
      <View key={kpi.label} style={styles.kpiCard}>
        <Text style={styles.kpiLabel}>{kpi.label}</Text>
        <Text style={styles.kpiValue}>{kpi.value}</Text>
        {kpi.delta ? <Text style={styles.kpiDelta}>{kpi.delta} vs last week</Text> : null}
      </View>
    ))}
  </View>
);

const ProgressRow: React.FC<{ label: string; width: string }> = ({ label, width }) => (
  <View style={styles.progressRow}>
    <View style={styles.progressBar}>
      <View style={[styles.progressFill, { width }]as any} />
    </View>
    <Text style={styles.progressLabel}>{label}</Text>
  </View>
);

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
    maxWidth: 520,
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
