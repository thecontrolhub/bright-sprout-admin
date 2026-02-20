import React from 'react';
import { View, Text, StyleSheet, ScrollView, LayoutChangeEvent } from 'react-native';
import { tokens } from '../styles/tokens';

const kpiCards = [
  { label: 'Active Parents', value: '1,284', sub: 'Last 7 days' },
  { label: 'Active Children', value: '2,913', sub: 'Last 7 days' },
  { label: 'DAU / WAU', value: '36%', sub: 'Engagement ratio' },
  { label: 'Baseline completion %', value: '62%', sub: 'All subjects' },
  { label: 'Median mastery %', value: '68%', sub: 'Across skills' },
];

const activeUsageSeries = [42, 48, 45, 52, 58, 60, 66];
const baselineCompletionSeries = [34, 36, 39, 41, 46, 52, 58];
const chartLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const masteryBySubject = [
  { label: 'Maths', value: 72 },
  { label: 'Literacy', value: 64 },
  { label: 'Science', value: 58 },
];

const alerts = [
  { title: 'Failed generations', detail: '3 runs failed in the last 24 hours.' },
  { title: 'Top failing skills', detail: 'Literacy Stage 2: CVC Builder, Rhyme Race.' },
  { title: 'Generator errors', detail: 'Schema validation errors up 1.6% this week.' },
];

const recentRuns = [
  { id: 'RUN-1209', subject: 'Maths', stage: 'Stage 3', status: 'Success', time: '12 min ago' },
  { id: 'RUN-1208', subject: 'Science', stage: 'Stage 5', status: 'Failed', time: '48 min ago' },
  { id: 'RUN-1207', subject: 'Literacy', stage: 'Stage 1', status: 'Partial', time: '1 hr ago' },
];

export const DashboardScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Live snapshot of parent + child engagement.</Text>

      <View style={styles.kpiRow}>
        {kpiCards.map((card) => (
          <View key={card.label} style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{card.label}</Text>
            <Text style={styles.kpiValue}>{card.value}</Text>
            <Text style={styles.kpiSub}>{card.sub}</Text>
          </View>
        ))}
      </View>

      <View style={styles.splitRow}>
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Usage trend (DAU)</Text>
          <LineChart data={activeUsageSeries} labels={chartLabels} />
        </View>
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Mastery by subject</Text>
          <BarChart data={masteryBySubject} suffix="%" />
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Baseline completion trend</Text>
        <LineChart data={baselineCompletionSeries} labels={chartLabels} />
      </View>

      <View style={styles.splitRow}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Alerts</Text>
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
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recent runs</Text>
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

type LineChartProps = { data: number[]; labels: string[] };

type BarChartItem = { label: string; value: number };

const BarChart: React.FC<{ data: BarChartItem[]; suffix?: string }> = ({ data, suffix = '' }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <View style={styles.barWrap}>
      {data.map((item) => (
        <View key={item.label} style={styles.barRow}>
          <Text style={styles.barLabel}>{item.label}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${Math.round((item.value / max) * 100)}%` }]} />
          </View>
          <Text style={styles.barValue}>
            {item.value}
            {suffix}
          </Text>
        </View>
      ))}
    </View>
  );
};

const LineChart: React.FC<LineChartProps> = ({ data, labels }) => {
  const [width, setWidth] = React.useState(0);
  const height = 120;
  const paddingX = 12;
  const paddingY = 16;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, idx) => {
    const x = paddingX + (width - paddingX * 2) * (idx / (data.length - 1 || 1));
    const y = paddingY + (height - paddingY * 2) * (1 - (value - min) / range);
    return { x, y };
  });

  const segments = points.slice(1).map((point, idx) => {
    const prev = points[idx];
    const dx = point.x - prev.x;
    const dy = point.y - prev.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    return { x: prev.x, y: prev.y, length, angle };
  });

  const handleLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={styles.chartWrap} onLayout={handleLayout}>
      <View style={[styles.chartPlot, { height }]}>
        {width > 0 &&
          segments.map((seg, idx) => (
            <View
              key={`seg-${idx}`}
              style={[
                styles.chartSegment,
                {
                  width: seg.length,
                  transform: [{ translateX: seg.x }, { translateY: seg.y }, { rotateZ: `${seg.angle}deg` }],
                },
              ]}
            />
          ))}
        {width > 0 &&
          points.map((point, idx) => (
            <View
              key={`dot-${idx}`}
              style={[
                styles.chartDot,
                {
                  left: point.x - 4,
                  top: point.y - 4,
                },
              ]}
            />
          ))}
      </View>
      <View style={styles.chartLabels}>
        {labels.map((label, idx) => (
          <Text key={`${label}-${idx}`} style={styles.chartLabel}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: tokens.spacing.xl,
    gap: tokens.spacing.lg,
    paddingBottom: 64,
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
    minWidth: 200,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    flexGrow: 1,
  },
  kpiLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '700',
  },
  kpiValue: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    marginVertical: 6,
  },
  kpiSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
  splitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.lg,
  },
  chartCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    gap: tokens.spacing.md,
    flex: 1,
    minWidth: 260,
  },
  chartTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '700',
  },
  chartWrap: {
    gap: tokens.spacing.sm,
  },
  chartPlot: {
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  chartSegment: {
    position: 'absolute',
    height: 2,
    backgroundColor: 'rgba(124,92,255,0.8)',
    borderRadius: 2,
  },
  chartDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: 'rgba(124,92,255,0.9)',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  chartLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
  },
  barWrap: {
    gap: 10,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barLabel: {
    width: 70,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: 'rgba(124,92,255,0.8)',
  },
  barValue: {
    width: 40,
    textAlign: 'right',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    flex: 1,
    minWidth: 260,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
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
