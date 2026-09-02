import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/shared/theme/useColors';
import { ACHIEVEMENTS } from '@/domains/progress/data/achievements';
import { useUnlockedAchievements } from '@/domains/progress/selectors';
import type { AchievementTier } from '@/domains/progress/types';

const TIER_COLOR: Record<AchievementTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
};

export function AchievementsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const unlocked = useUnlockedAchievements();

  const unlockedIds = useMemo(() => new Set(unlocked.map((u) => u.achievementId)), [unlocked]);
  const unlockedById = useMemo(
    () => Object.fromEntries(unlocked.map((u) => [u.achievementId, u.unlockedAt])),
    [unlocked]
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === 'web' ? insets.top + 67 : insets.top + 16,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Achievements</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.summary, { color: colors.mutedForeground }]}>
          {unlocked.length} of {ACHIEVEMENTS.length} unlocked
        </Text>

        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: (`${Math.round((unlocked.length / ACHIEVEMENTS.length) * 100)}%` as unknown) as number,
              },
            ]}
          />
        </View>

        <View style={styles.grid}>
          {ACHIEVEMENTS.map((a) => {
            const isUnlocked = unlockedIds.has(a.id);
            const tier = TIER_COLOR[a.tier];
            return (
              <View
                key={a.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: isUnlocked ? tier : colors.border,
                    opacity: isUnlocked ? 1 : 0.55,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: isUnlocked ? `${tier}33` : colors.background },
                  ]}
                >
                  <Feather
                    name={(isUnlocked ? a.icon : 'lock') as never}
                    size={24}
                    color={isUnlocked ? tier : colors.mutedForeground}
                  />
                </View>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{a.title}</Text>
                <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>
                  {a.description}
                </Text>
                <View style={[styles.tierTag, { backgroundColor: `${tier}33` }]}>
                  <Text style={[styles.tierText, { color: tier }]}>{a.tier.toUpperCase()}</Text>
                </View>
                {isUnlocked && unlockedById[a.id] ? (
                  <Text style={[styles.unlockedAt, { color: colors.mutedForeground }]}>
                    {new Date(unlockedById[a.id]).toLocaleDateString()}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36, height: 36, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  summary: { fontSize: 14, fontFamily: 'Inter_500Medium', marginBottom: 10 },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 20 },
  progressFill: { height: 6, borderRadius: 3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  card: {
    width: '48%',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  cardDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 16 },
  tierTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  tierText: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  unlockedAt: { fontSize: 10, fontFamily: 'Inter_400Regular' },
});
