import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAdminAuth } from '../auth/AdminAuthContext';

export const AdminHeader: React.FC = () => {
  const { signOutUser } = useAdminAuth();

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.title}>Bright Sprout Admin</Text>
        <Text style={styles.subtitle}>Content & Baselines</Text>
      </View>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}>
          <Text style={styles.iconText}>🔔</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={signOutUser}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
        >
          <Text style={styles.iconText}>⎋</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 64,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(18,10,36,0.9)',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  iconBtnPressed: {
    transform: [{ scale: 0.96 }],
  },
  iconText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
