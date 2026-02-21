import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { AppBackground } from './components/AppBackground';
import { MemoryNavigationProvider } from './navigation/MemoryNavigationProvider';
import { useNavigation } from './navigation/NavigationContext';
import { LoginScreen } from './screens/LoginScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { BaselineGenerateScreen } from './screens/BaselineGenerateScreen';
import { BaselineRunsScreen } from './screens/BaselineRunsScreen';
import { PoolReviewScreen } from './screens/PoolReviewScreen';
import { CurriculumBaselineScreen } from './screens/CurriculumBaselineScreen';
import { BlueprintReviewScreen } from './screens/BlueprintReviewScreen';
import { CurriculumMathsScreen } from './screens/CurriculumMathsScreen';
import { CurriculumLiteracyScreen } from './screens/CurriculumLiteracyScreen';
import { CurriculumScienceScreen } from './screens/CurriculumScienceScreen';
import { UsersParentScreen } from './screens/UsersParentScreen';
import { ParentDetailScreen } from './screens/ParentDetailScreen';
import { UsersChildrenScreen } from './screens/UsersChildrenScreen';
import { ChildDetailScreen } from './screens/ChildDetailScreen';
import { UsersAdminScreen } from './screens/UsersAdminScreen';
import { GameRegistryScreen } from './screens/GameRegistryScreen';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import { CommonSubjectsScreen } from './screens/CommonSubjectsScreen';
import { CommonGradesScreen } from './screens/CommonGradesScreen';
import { CommonRolesScreen } from './screens/CommonRolesScreen';
import { HelpCenterScreen } from './screens/HelpCenterScreen';
import { AdminLayout } from './components/AdminLayout';
import { AdminAuthProvider, useAdminAuth } from './auth/AdminAuthContext';

const ScreenRouter: React.FC = () => {
  const { screen } = useNavigation();
  const { isAdmin, loading } = useAdminAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!isAdmin) {
    return <LoginScreen />;
  }

  if (screen === 'baselineGenerate') {
    return (
      <AdminLayout>
        <BaselineGenerateScreen />
      </AdminLayout>
    );
  }
  if (screen === 'baselineRuns') {
    return (
      <AdminLayout>
        <BaselineRunsScreen />
      </AdminLayout>
    );
  }
  if (screen === 'poolReview') {
    return (
      <AdminLayout>
        <PoolReviewScreen />
      </AdminLayout>
    );
  }
  if (screen === 'curriculumBaseline') {
    return (
      <AdminLayout>
        <CurriculumBaselineScreen />
      </AdminLayout>
    );
  }
  if (screen === 'blueprintReview') {
    return (
      <AdminLayout>
        <BlueprintReviewScreen />
      </AdminLayout>
    );
  }
  if (screen === 'curriculumMaths') {
    return (
      <AdminLayout>
        <CurriculumMathsScreen />
      </AdminLayout>
    );
  }
  if (screen === 'curriculumLiteracy') {
    return (
      <AdminLayout>
        <CurriculumLiteracyScreen />
      </AdminLayout>
    );
  }
  if (screen === 'curriculumScience') {
    return (
      <AdminLayout>
        <CurriculumScienceScreen />
      </AdminLayout>
    );
  }
  if (screen === 'usersParent') {
    return (
      <AdminLayout>
        <UsersParentScreen />
      </AdminLayout>
    );
  }
  if (screen === 'parentDetail') {
    return (
      <AdminLayout>
        <ParentDetailScreen />
      </AdminLayout>
    );
  }
  if (screen === 'usersChildren') {
    return (
      <AdminLayout>
        <UsersChildrenScreen />
      </AdminLayout>
    );
  }
  if (screen === 'childDetail') {
    return (
      <AdminLayout>
        <ChildDetailScreen />
      </AdminLayout>
    );
  }
  if (screen === 'usersAdmin') {
    return (
      <AdminLayout>
        <UsersAdminScreen />
      </AdminLayout>
    );
  }
  if (screen === 'gameRegistry') {
    return (
      <AdminLayout>
        <GameRegistryScreen />
      </AdminLayout>
    );
  }
  if (screen === 'analytics') {
    return (
      <AdminLayout>
        <AnalyticsScreen />
      </AdminLayout>
    );
  }
  if (screen === 'commonSubjects') {
    return (
      <AdminLayout>
        <CommonSubjectsScreen />
      </AdminLayout>
    );
  }
  if (screen === 'commonGrades') {
    return (
      <AdminLayout>
        <CommonGradesScreen />
      </AdminLayout>
    );
  }
  if (screen === 'commonRoles') {
    return (
      <AdminLayout>
        <CommonRolesScreen />
      </AdminLayout>
    );
  }
  if (screen === 'helpCenter') {
    return (
      <AdminLayout>
        <HelpCenterScreen />
      </AdminLayout>
    );
  }
  if (screen === 'dashboard') {
    return (
      <AdminLayout>
        <DashboardScreen />
      </AdminLayout>
    );
  }
  return (
    <AdminLayout>
      <DashboardScreen />
    </AdminLayout>
  );
};

export const Root: React.FC = () => (
  <AdminAuthProvider>
    <MemoryNavigationProvider>
      <AppBackground>
        <View style={styles.shell}>
          <ScreenRouter />
        </View>
      </AppBackground>
    </MemoryNavigationProvider>
  </AdminAuthProvider>
);

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
