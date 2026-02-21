import React from 'react';
import { View, Text, StyleSheet, ScrollView, LayoutChangeEvent, ActivityIndicator } from 'react-native';
import { tokens } from '../styles/tokens';
import { db } from '../firebase/firestore';
import { doc, onSnapshot } from 'firebase/firestore';


type AdminStats = {
  activeParents7d?: number;
  activeChildren7d?: number;
  dau?: number;
  wau?: number;
  dauWauRatio?: number;
  baselineCompletionPct?: number;
  medianMasteryPct?: number;
  usageTrend7d?: { label: string; count: number }[];
  baselineTrend7d?: { label: string; percent: number }[];
  masteryBySubject?: { subject: string; value: number }[];
  alerts?: { failedRuns24h?: number; topFailingSkills?: string[]; generatorErrors?: string[] };
  recentRuns?: { id: string; subject: string; stage: string; status: string; startedAt?: any }[];
};

export const DashboardScreen: React.FC = () => {
  const [stats, setStats] = React.useState<AdminStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'adminStats', 'dashboard'),
      (snap) => {
        setStats(snap.exists() ? (snap.data() as AdminStats) : null);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => {
      unsub();
    };
  }, []);

  const kpiCards = [
    { label: 'Active Parents', value: stats?.activeParents7d ?? 0, sub: 'Last 7 days' },
    { label: 'Active Children', value: stats?.activeChildren7d ?? 0, sub: 'Last 7 days' },
    { label: 'DAU / WAU', value: `${stats?.dauWauRatio ?? 0}%`, sub: 'Engagement ratio' },
    { label: 'Baseline completion %', value: `${stats?.baselineCompletionPct ?? 0}%`, sub: 'All subjects' },
    { label: 'Median mastery %', value: `${stats?.medianMasteryPct ?? 0}%`, sub: 'Across skills' },
  ];

  const activeUsageSeries = stats?.usageTrend7d?.map((d) => d.count) || [];
  const baselineCompletionSeries = stats?.baselineTrend7d?.map((d) => d.percent) || [];
  const chartLabels = stats?.usageTrend7d?.map((d) => d.label) || ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const masteryBySubject = (stats?.masteryBySubject || []).map((s) => ({
    label: s.subject === 'maths' ? 'Maths' : s.subject === 'literacy' ? 'Literacy' : s.subject === 'science' ? 'Science' : s.subject,
    value: s.value,
  }));

  const alerts = [
    { title: 'Failed generations', detail: `${stats?.alerts?.failedRuns24h ?? 0} runs failed in the last 24 hours.` },
    { title: 'Top failing skills', detail: (stats?.alerts?.topFailingSkills || []).join(', ') || 'No failing skills detected.' },
    { title: 'Generator errors', detail: (stats?.alerts?.generatorErrors || []).join(', ') || 'No generator errors logged.' },
  ];

  const recentRuns = (stats?.recentRuns || []).map((run) => ({
    id: run.id,
    subject: run.subject,
    stage: run.stage,
    status: run.status,
    time: run.startedAt?.toDate ? run.startedAt.toDate().toLocaleString() : '—',
  }));

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
      {loading ? <ActivityIndicator color="#fff" /> : null}

      <View style={styles.splitRow}>
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Usage trend (DAU)</Text>
          <LineChart data={activeUsageSeries.length ? activeUsageSeries : [0, 0, 0, 0, 0, 0, 0]} labels={chartLabels} />
        </View>
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Mastery by subject</Text>
          <BarChart data={masteryBySubject.length ? masteryBySubject : [{ label: 'No data', value: 0 }]} suffix="%" />
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Baseline completion trend</Text>
        <LineChart data={baselineCompletionSeries.length ? baselineCompletionSeries : [0, 0, 0, 0, 0, 0, 0]} labels={chartLabels} />
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
          {!recentRuns.length ? <Text style={styles.tableEmpty}>No recent runs.</Text> : null}
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
  tableEmpty: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginTop: 8,
  },
});
