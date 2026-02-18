import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

export const AppBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <View style={styles.container}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1b1235',
    ...(Platform.OS === 'web'
      ? ({
        backgroundImage: 'radial-gradient(circle at top, #2b1a50, #120a24 70%)',
        minHeight: '100vh',
      } as any)
      : {}),
  },
});
