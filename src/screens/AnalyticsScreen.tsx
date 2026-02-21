import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { tokens } from '../styles/tokens';
import { db } from '../firebase/firestore';

type AnalyticsStats = {
  activeParents7d?: number;
  activeChildren7d?: number;
  avgSessionMin?: number;
  retentionD7?: number;
  usageTrend7d?: Array<{ label: string; count: number }>;
  masteryBySubject?: Array<{ subject: string; value: number }>;
  stageDistribution?: Array<{ label: string; value: number }>;
  skillMovement?: { top?: Array<{ label: string; value: string }>; weak?: Array<{ label: string; value: string }> };
  cohort?: number[];
};

const fallbackStats: AnalyticsStats = {
  activeParents7d: 1284,
  activeChildren7d: 2913,
  avgSessionMin: 8.1,
  retentionD7: 42,
  usageTrend7d: [
    { label: 'M', count: 4 },
    { label: 'T', count: 7 },
    { label: 'W', count: 6 },
    { label: 'T', count: 9 },
    { label: 'F', count: 8 },
    { label: 'S', count: 11 },
    { label: 'S', count: 13 },
  ],
  masteryBySubject: [
    { subject: 'Maths', value: 72 },
    { subject: 'Literacy', value: 64 },
    { subject: 'Science', value: 58 },
  ],
  stageDistribution: [
    { label: 'Early Years', value: 32 },
    { label: 'Stage 1', value: 24 },
    { label: 'Stage 2', value: 17 },
    { label: 'Stage 3', value: 12 },
    { label: 'Stage 4', value: 8 },
    { label: 'Stage 5-6', value: 7 },
  ],
  skillMovement: {
    top: [
      { label: 'Counting 1–10', value: '+12%' },
      { label: 'Rhyming words', value: '+9%' },
      { label: 'Living things', value: '+8%' },
    ],
    weak: [
      { label: 'Number bonds', value: '-6%' },
      { label: 'CVC blending', value: '-4%' },
      { label: 'Materials properties', value: '-3%' },
    ],
  },
  cohort: [72, 58, 49, 41, 36, 33],
};

export const AnalyticsScreen: React.FC = () => {
  const [stats, setStats] = React.useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const ref = doc(db, 'adminStats', 'dashboard');
    const unsub = onSnapshot(ref, (snap) => {
      setStats(snap.exists() ? (snap.data() as AnalyticsStats) : null);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const data = stats || fallbackStats;
  const usageTrend = data.usageTrend7d || fallbackStats.usageTrend7d || [];
  const masteryBySubject = data.masteryBySubject || fallbackStats.masteryBySubject || [];
  const stageMix = data.stageDistribution || fallbackStats.stageDistribution || [];
  const topSkills = data.skillMovement?.top || fallbackStats.skillMovement?.top || [];
  const weakSkills = data.skillMovement?.weak || fallbackStats.skillMovement?.weak || [];
  const cohort = data.cohort || fallbackStats.cohort || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Usage, retention, and learning effectiveness.</Text>
        </View>
        <View style={styles.filterWrap}>
          <View style={styles.filterPill}><Text style={styles.filterText}>Last 7 days</Text></View>
          <View style={styles.filterPill}><Text style={styles.filterText}>All subjects</Text></View>
          <View style={styles.filterPill}><Text style={styles.filterText}>All stages</Text></View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingRow}><ActivityIndicator color="#fff" /></View>
      ) : null}

      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Active parents</Text>
          <Text style={styles.kpiValue}>{data.activeParents7d ?? fallbackStats.activeParents7d}</Text>
          <Text style={styles.kpiSub}>Last 7 days</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Active children</Text>
          <Text style={styles.kpiValue}>{data.activeChildren7d ?? fallbackStats.activeChildren7d}</Text>
          <Text style={styles.kpiSub}>Last 7 days</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Avg session</Text>
          <Text style={styles.kpiValue}>{(data.avgSessionMin ?? fallbackStats.avgSessionMin)?.toFixed(1)} min</Text>
          <Text style={styles.kpiSub}>Median</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Retention D7</Text>
          <Text style={styles.kpiValue}>{data.retentionD7 ?? fallbackStats.retentionD7}%</Text>
          <Text style={styles.kpiSub}>Returning</Text>
        </View>
      </View>

      <View style={styles.gridRow}>
        <View style={[styles.card, styles.flex2]}>
          <Text style={styles.cardTitle}>Usage trend</Text>
          <Text style={styles.cardText}>Daily active usage across the last week.</Text>
          <View style={styles.lineChart}>
            {usageTrend.map((v, i) => (
              <View key={`pt-${i}`} style={styles.linePointWrap}>
                <View style={[styles.linePoint, { bottom: 12 + v.count * 4 }]} />
                {i < usageTrend.length - 1 && <View style={[styles.lineSegment, { height: Math.max(1, (usageTrend[i + 1].count - v.count) * 4 + 2) }]} />}
              </View>
            ))}
          </View>
          <View style={styles.lineLabels}>
            {usageTrend.map((d, idx) => (
              <Text key={`lbl-${idx}`} style={styles.lineLabel}>{d.label}</Text>
            ))}
          </View>
        </View>
        <View style={[styles.card, styles.flex1]}>
          <Text style={styles.cardTitle}>Mastery by subject</Text>
          {masteryBySubject.map((row) => (
            <View key={row.subject} style={styles.barRow}>
              <View style={styles.barHeader}>
                <Text style={styles.barLabel}>{row.subject}</Text>
                <Text style={styles.barValue}>{row.value}%</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${row.value}%` }]} />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.gridRow}>
        <View style={[styles.card, styles.flex1]}>
          <Text style={styles.cardTitle}>Stage distribution</Text>
          {stageMix.map((seg) => (
            <View key={seg.label} style={styles.segmentRow}>
              <Text style={styles.segmentLabel}>{seg.label}</Text>
              <Text style={styles.segmentValue}>{seg.value}%</Text>
            </View>
          ))}
        </View>
        <View style={[styles.card, styles.flex1]}>
          <Text style={styles.cardTitle}>Skill movement</Text>
          <Text style={styles.cardText}>Biggest gains and dips this week.</Text>
          <View style={styles.skillList}>
            {topSkills.map((skill) => (
              <View key={skill.label} style={styles.skillRow}>
                <Text style={styles.skillLabel}>{skill.label}</Text>
                <Text style={styles.skillUp}>{skill.value}</Text>
              </View>
            ))}
          </View>
          <View style={styles.skillDivider} />
          <View style={styles.skillList}>
            {weakSkills.map((skill) => (
              <View key={skill.label} style={styles.skillRow}>
                <Text style={styles.skillLabel}>{skill.label}</Text>
                <Text style={styles.skillDown}>{skill.value}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Retention cohort</Text>
        <Text style={styles.cardText}>Return rate by week since first session.</Text>
        <View style={styles.cohortRow}>
          {cohort.map((v, i) => (
            <View key={`cohort-${i}`} style={styles.cohortBlock}>
              <View style={[styles.cohortFill, { opacity: 0.25 + v / 140 }]} />
              <Text style={styles.cohortText}>{v}%</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: tokens.spacing.xl, gap: tokens.spacing.lg, paddingBottom: 64 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  filterWrap: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  filterText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  loadingRow: { paddingVertical: 8, alignItems: 'center' },
  kpiRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  kpiCard: {
    flexGrow: 1,
    minWidth: 180,
    padding: tokens.spacing.md,
    borderRadius: tokens.radii.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  kpiLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, textTransform: 'uppercase' },
  kpiValue: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 8 },
  kpiSub: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 4 },
  gridRow: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  flex1: { flex: 1, minWidth: 260 },
  flex2: { flex: 2, minWidth: 300 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cardText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 6 },
  lineChart: { height: 120, marginTop: 18, flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  linePointWrap: { flex: 1, height: 120, alignItems: 'center', justifyContent: 'flex-end' },
  linePoint: { width: 8, height: 8, borderRadius: 6, backgroundColor: 'rgba(124,92,255,0.9)', position: 'absolute' },
  lineSegment: { width: 2, backgroundColor: 'rgba(124,92,255,0.35)', marginLeft: 12 },
  lineLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  lineLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
  barRow: { marginTop: 12 },
  barHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  barLabel: { color: '#fff', fontSize: 12, fontWeight: '600' },
  barValue: { color: '#bba7ff', fontSize: 12, fontWeight: '700' },
  barTrack: { height: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 8 },
  barFill: { height: '100%', borderRadius: 999, backgroundColor: 'rgba(124,92,255,0.75)' },
  segmentRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  segmentLabel: { color: '#fff', fontSize: 12, fontWeight: '600' },
  segmentValue: { color: '#bba7ff', fontSize: 12, fontWeight: '700' },
  skillList: { marginTop: 10, gap: 6 },
  skillRow: { flexDirection: 'row', justifyContent: 'space-between' },
  skillLabel: { color: '#fff', fontSize: 12 },
  skillUp: { color: '#6be3a9', fontSize: 12, fontWeight: '700' },
  skillDown: { color: '#ff8a8a', fontSize: 12, fontWeight: '700' },
  skillDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 10 },
  cohortRow: { flexDirection: 'row', gap: 10, marginTop: 14, flexWrap: 'wrap' },
  cohortBlock: { width: 64, height: 64, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  cohortFill: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderRadius: 12, backgroundColor: 'rgba(124,92,255,0.8)' },
  cohortText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});

