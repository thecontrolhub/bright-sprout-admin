import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { useNavigation } from '../navigation/NavigationContext';

type NavGroup = { title: string; collapsible?: boolean; items: Array<{ key: string; label: string }> };

type Props = {
  collapsed: boolean;
  onToggleCollapse: () => void;
};

const NAV: NavGroup[] = [
  { title: 'Dashboard', collapsible: true, items: [{ key: 'dashboard', label: 'Overview' }] },
  {
    title: 'Baseline Engine',
    collapsible: true,
    items: [
      { key: 'baselineGenerate', label: 'Generate' },
      { key: 'baselineRuns', label: 'Active Runs' },
      { key: 'poolExplorer', label: 'Pool Explorer' },
    ],
  },
  { title: 'Curriculum', collapsible: true, items: [{ key: 'curriculumMaths', label: 'Curriculum' }] },
  {
    title: 'Users',
    collapsible: true,
    items: [
      { key: 'usersParent', label: 'Parent' },
      { key: 'usersChildren', label: 'Children' },
      { key: 'usersAdmin', label: 'Admin' },
    ],
  },
  {
    title: 'Common Data',
    collapsible: true,
    items: [
      { key: 'commonSubjects', label: 'Subjects' },
      { key: 'commonGrades', label: 'Grades' },
    ],
  },
  { title: 'Game Registry', collapsible: true, items: [{ key: 'gameRegistry', label: 'Game Registry' }] },
  { title: 'Analytics', collapsible: true, items: [{ key: 'analytics', label: 'Overview' }] },
  { title: 'Help Center', collapsible: true, items: [{ key: 'helpCenter', label: 'Help Center' }] },
];

export const AdminSidebar: React.FC<Props> = ({ collapsed, onToggleCollapse }) => {
  const { screen, navigate } = useNavigation();
  const [openGroup, setOpenGroup] = React.useState<string | null>(null);

  React.useEffect(() => {
    const match = NAV.find((group) => group.items.some((item) => item.key === screen));
    if (match && match.collapsible) {
      setOpenGroup(match.title);
    }
  }, [screen]);

  const toggleGroup = (title: string) => {
    setOpenGroup((prev) => (prev === title ? null : title));
  };

  return (
    <View style={styles.sidebar}>
      <View style={styles.topRow}>
        <Text style={[styles.brand, collapsed && styles.brandCollapsed]}>BS</Text>
        <Pressable
          accessibilityRole="button"
          onPress={onToggleCollapse}
          style={({ pressed }) => [styles.collapseBtn, pressed && styles.collapsePressed]}
        >
          <Text style={styles.collapseIcon}>{collapsed ? '>' : '<'}</Text>
        </Pressable>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, collapsed && styles.scrollContentCollapsed]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {NAV.map((group) => {
          const isOpen = group.collapsible ? openGroup === group.title : true;
          return (
            <View key={group.title} style={styles.group}>
              <Pressable
                accessibilityRole="button"
                onPress={() => group.collapsible && toggleGroup(group.title)}
                style={[styles.groupHeader, collapsed && styles.groupHeaderCollapsed]}
              >
                <Text style={[styles.heading, collapsed && styles.headingCollapsed]}>{group.title}</Text>
                {group.collapsible && !collapsed ? (
                  <Text style={styles.caret}>{isOpen ? 'v' : '>'}</Text>
                ) : null}
              </Pressable>
              {isOpen ? (
                <View>
                  {group.items.map((item) => {
                    const active = screen === item.key;
                    return (
                      <Pressable
                        key={item.key}
                        onPress={() => navigate(item.key as any)}
                        style={({ pressed }) => [
                          styles.navItem,
                          active && styles.navItemActive,
                          pressed && styles.navItemPressed,
                          collapsed && styles.navItemCollapsed,
                        ]}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.navText, active && styles.navTextActive]}>
                          {collapsed ? item.label.slice(0, 1) : item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(18,10,36,0.8)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  brand: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  brandCollapsed: {
    fontSize: 12,
  },
  collapseBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  collapsePressed: {
    transform: [{ scale: 0.96 }],
  },
  collapseIcon: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
    ...(Platform.OS === 'web'
      ? ({ scrollbarWidth: 'none', msOverflowStyle: 'none' } as any)
      : null),
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 28,
  },
  scrollContentCollapsed: {
    paddingHorizontal: 10,
  },
  group: {
    marginBottom: 18,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupHeaderCollapsed: {
    justifyContent: 'center',
  },
  heading: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  headingCollapsed: {
    fontSize: 9,
  },
  caret: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '700',
  },
  navItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  navItemCollapsed: {
    alignItems: 'center',
  },
  navItemActive: {
    backgroundColor: 'rgba(124,92,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(124,92,255,0.4)',
  },
  navItemPressed: {
    transform: [{ scale: 0.98 }],
  },
  navText: {
    color: '#d6ccff',
    fontSize: 12,
    fontWeight: '700',
  },
  navTextActive: {
    color: '#fff',
  },
});

