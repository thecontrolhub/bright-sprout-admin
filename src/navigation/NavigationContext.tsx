import React from 'react';

export type ScreenName =
  | 'login'
  | 'dashboard'
  | 'baselineGenerate'
  | 'baselineRuns'
  | 'poolReview'
  | 'blueprintReview'
  | 'curriculumBaseline'
  | 'curriculumMaths'
  | 'curriculumLiteracy'
  | 'curriculumScience'
  | 'usersParent'
  | 'parentDetail'
  | 'usersChildren'
  | 'childDetail'
  | 'usersAdmin'
  | 'gameRegistry'
  | 'analytics'
  | 'commonSubjects'
  | 'commonGrades'
  | 'commonRoles'
  | 'helpCenter';

export type NavigationParams = Record<string, string | undefined>;

type NavigationValue = {
  screen: ScreenName;
  params: NavigationParams;
  navigate: (screen: ScreenName, params?: NavigationParams) => void;
};

export const NavigationContext = React.createContext<NavigationValue | null>(null);

export const useNavigation = () => {
  const ctx = React.useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within provider');
  return ctx;
};

