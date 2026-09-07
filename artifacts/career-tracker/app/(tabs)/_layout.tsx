import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActiveTimerBanner } from '@/domains/time-focus';
import { useColors } from '@/shared/theme/useColors';
import { useTabBarHeight } from '@/shared/ui/tabBarMetrics';

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="lists">
        <Icon sf={{ default: 'list.bullet', selected: 'list.bullet' }} />
        <Label>Lists</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tasks">
        <Icon sf={{ default: 'checklist', selected: 'checklist' }} />
        <Label>Tasks</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="learn">
        <Icon sf={{ default: 'book', selected: 'book.fill' }} />
        <Label>Learn</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="insights">
        <Icon sf={{ default: 'bolt', selected: 'bolt.fill' }} />
        <Label>Insights</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: 'person.circle', selected: 'person.circle.fill' }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarHeight();
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        // The height is declared rather than left implicit so that
        // `useTabBarHeight` — which screens pad from and the timer dock
        // positions against — describes the bar that actually renders (AC-5).
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: tabBarHeight,
          paddingBottom: isWeb ? 0 : insets.bottom,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="house" tintColor={color} size={24} /> : <Feather name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="lists"
        options={{
          title: 'Lists',
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="list.bullet" tintColor={color} size={24} /> : <Feather name="list" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="checklist" tintColor={color} size={24} /> : <Feather name="check-square" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="book" tintColor={color} size={24} /> : <Feather name="book-open" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="bolt" tintColor={color} size={24} /> : <Feather name="zap" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="person.circle" tintColor={color} size={24} /> : <Feather name="user" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

/**
 * Docks the active-timer banner just above the tab bar, on every tab.
 *
 * It used to be mounted inside DashboardScreen and ListsScreen only, which
 * left a running session invisible on Tasks, Learn, Insights and Profile —
 * and reachable only by navigating back to the dashboard first (spec AC-7,
 * Principles IV and V).
 *
 * `box-none` lets taps fall through everywhere except on the banner itself,
 * so docking it costs the screen underneath nothing. The banner renders null
 * when no task is active, so this is inert the rest of the time.
 */
function ActiveTimerDock() {
  const tabBarHeight = useTabBarHeight();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.dock, { bottom: tabBarHeight + 12 }]}
    >
      <ActiveTimerBanner />
    </View>
  );
}

export default function TabLayout() {
  return (
    <View style={styles.root}>
      {isLiquidGlassAvailable() ? <NativeTabLayout /> : <ClassicTabLayout />}
      <ActiveTimerDock />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  dock: { position: 'absolute', left: 16, right: 16 },
});
