import React from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { AdminHeader } from './AdminHeader';
import { AdminSidebar } from './AdminSidebar';

const HEADER_H = 64;
const SIDEBAR_W = 240;
const SIDEBAR_W_COLLAPSED = 72;

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width } = useWindowDimensions();
  const showSidebar = width >= 900;
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W;

  return (
    <View style={styles.container}>
      <View style={styles.headerFixed}>
        <AdminHeader />
      </View>
      {showSidebar ? (
        <View style={[styles.sidebarFixed, { width: sidebarWidth }]}>
          <AdminSidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((v) => !v)} />
        </View>
      ) : null}
      <View style={[styles.content, showSidebar && { paddingLeft: sidebarWidth }]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as any } : null),
  },
  headerFixed: {
    position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_H,
    zIndex: 20,
  },
  sidebarFixed: {
    position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
    top: HEADER_H,
    left: 0,
    bottom: 0,
    zIndex: 10,
  },
  content: {
    flex: 1,
    paddingTop: HEADER_H,
  },
});

