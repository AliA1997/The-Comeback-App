import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatsCard } from '@/components/StatsCard';

interface Props {
  completedCount: number;
  totalMinutes: number;
  streak: number;
}

function formatTime(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes}m`;
}

export function QuickStatsRow({ completedCount, totalMinutes, streak }: Props) {
  return (
    <View style={styles.row}>
      <StatsCard label="Done today" value={completedCount} />
      <StatsCard label="Time logged" value={formatTime(totalMinutes)} />
      <StatsCard label="Day streak" value={streak} accent />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginBottom: 16 },
});
