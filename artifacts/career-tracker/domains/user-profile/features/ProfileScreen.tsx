import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScorePill } from '@/shared/ui/ScorePill';
import { SkeletonList } from '@/shared/ui/SkeletonList';
import { useColors } from '@/shared/theme/useColors';
import { useTabBarInset } from '@/shared/ui/tabBarMetrics';
import { useAppStore } from '@/shared/store/root';
import { signOut } from '@/domains/auth/services/AuthService';
import { useAuthUser } from '@/domains/auth/selectors';
import { useEarnedScore } from '@/domains/task-planning/hooks/useTasks';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';
import {
  CAREER_TRACKS,
  DEFAULT_DAILY_MINUTES_TARGET,
  DEFAULT_PREFERENCES,
  DEFAULT_WEEKLY_TASKS_TARGET,
  SENIORITY_LEVELS,
  type CareerTrack,
  type Seniority,
} from '../types';

export function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const router = useRouter();

  const { profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const authUser = useAuthUser();
  const earnedScore = useEarnedScore();
  const resetOnboarding = useAppStore((s) => s.resetOnboarding);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [editingRole, setEditingRole] = useState(false);
  const [roleDraft, setRoleDraft] = useState('');

  const displayName = profile?.displayName ?? '';
  const targetRole = profile?.targetRole ?? '';
  const careerTrack = profile?.careerTrack ?? null;
  const seniority = profile?.seniority ?? null;
  const preferences = { ...DEFAULT_PREFERENCES, ...(profile?.preferences ?? {}) };
  const dailyMinutesTarget = profile?.dailyMinutesTarget ?? DEFAULT_DAILY_MINUTES_TARGET;
  const weeklyTasksTarget = profile?.weeklyTasksTarget ?? DEFAULT_WEEKLY_TASKS_TARGET;

  const save = (data: Parameters<typeof updateProfile.mutate>[0]['data']) =>
    updateProfile.mutate({ data });

  const handleSignOut = () => {
    const run = () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      void signOut();
    };

    if (Platform.OS === 'web') {
      run();
      return;
    }

    Alert.alert(
      'Sign out?',
      'Your tasks and progress stay saved to your account. Sign back in any time.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: run },
      ]
    );
  };

  const handleRedoOnboarding = () => {
    const run = () => {
      Haptics.selectionAsync();
      resetOnboarding();
      router.replace('/(tabs)');
    };

    if (Platform.OS === 'web') {
      run();
      return;
    }

    Alert.alert(
      'Walk through setup again?',
      'Your tasks, lists and history are kept — this just reopens the intro questions.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start over', onPress: run },
      ]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === 'web' ? insets.top + 67 : insets.top + 16,
            paddingBottom: tabBarInset,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.avatar, { backgroundColor: `${colors.primary}33` }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {(displayName || authUser?.email || '?').slice(0, 1).toUpperCase()}
            </Text>
          </View>
          {editingName ? (
            <View style={styles.editRow}>
              <TextInput
                accessibilityLabel="Your name"
                value={nameDraft}
                onChangeText={setNameDraft}
                autoFocus
                style={[
                  styles.editInput,
                  { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.primary },
                ]}
                maxLength={40}
              />
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Save name"
                hitSlop={12}
                onPress={() => {
                  save({ displayName: nameDraft.trim() || null });
                  setEditingName(false);
                }}
              >
                <Feather name="check" size={20} color={colors.accent} />
              </TouchableOpacity>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit your name"
              onPress={() => {
                setNameDraft(displayName);
                setEditingName(true);
              }}
              style={styles.nameRow}
            >
              <Text style={[styles.name, { color: colors.foreground }]}>
                {displayName || 'Add your name'}
              </Text>
              <Feather name="edit-2" size={14} color={colors.mutedForeground} />
            </Pressable>
          )}
          <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
            {careerTrack ?? 'Set track'} · {seniority ?? 'Set level'}
          </Text>
          {earnedScore > 0 ? (
            <View style={styles.heroScore}>
              <ScorePill score={earnedScore} earned />
              <Text style={[styles.heroScoreLabel, { color: colors.mutedForeground }]}>
                points earned so far
              </Text>
            </View>
          ) : null}
        </View>

        {isLoading ? <SkeletonList count={2} rowHeight={64} /> : null}

        {/* Career track */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Career Track</Text>
          <View style={styles.chipWrap}>
            {CAREER_TRACKS.map((t) => {
              const active = careerTrack === t;
              return (
                <Pressable
                  key={t}
                  accessibilityRole="button"
                  accessibilityLabel={t}
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    save({ careerTrack: t as CareerTrack });
                  }}
                >
                  <Text style={[styles.chipText, { color: active ? '#fff' : colors.foreground }]}>{t}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Seniority */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Seniority</Text>
          <View style={styles.chipWrap}>
            {SENIORITY_LEVELS.map((lvl) => {
              const active = seniority === lvl;
              return (
                <Pressable
                  key={lvl}
                  accessibilityRole="button"
                  accessibilityLabel={lvl}
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    save({ seniority: lvl as Seniority });
                  }}
                >
                  <Text style={[styles.chipText, { color: active ? '#fff' : colors.foreground }]}>{lvl}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Target role */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Target Role</Text>
          {editingRole ? (
            <View style={styles.editRow}>
              <TextInput
                accessibilityLabel="Target role"
                value={roleDraft}
                onChangeText={setRoleDraft}
                autoFocus
                placeholder="e.g. Senior Frontend at FAANG"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.editInput,
                  { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.primary },
                ]}
                maxLength={80}
              />
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Save target role"
                hitSlop={12}
                onPress={() => {
                  save({ targetRole: roleDraft.trim() || null });
                  setEditingRole(false);
                }}
              >
                <Feather name="check" size={20} color={colors.accent} />
              </TouchableOpacity>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit target role"
              onPress={() => {
                setRoleDraft(targetRole);
                setEditingRole(true);
              }}
              style={[styles.staticRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.staticValue, { color: colors.foreground }]} numberOfLines={1}>
                {targetRole || 'Tap to set'}
              </Text>
              <Feather name="edit-2" size={15} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        {/* Goals */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Daily Goals</Text>
          <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Focus minutes per day</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Decrease daily focus minutes"
                hitSlop={10}
                onPress={() =>
                  save({ dailyMinutesTarget: Math.max(15, dailyMinutesTarget - 15) })
                }
              >
                <Feather name="minus-circle" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
              <Text style={[styles.stepperValue, { color: colors.foreground }]}>
                {dailyMinutesTarget}m
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Increase daily focus minutes"
                hitSlop={10}
                onPress={() =>
                  save({ dailyMinutesTarget: Math.min(480, dailyMinutesTarget + 15) })
                }
              >
                <Feather name="plus-circle" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Tasks per week</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Decrease weekly task target"
                hitSlop={10}
                onPress={() => save({ weeklyTasksTarget: Math.max(1, weeklyTasksTarget - 1) })}
              >
                <Feather name="minus-circle" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
              <Text style={[styles.stepperValue, { color: colors.foreground }]}>
                {weeklyTasksTarget}
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Increase weekly task target"
                hitSlop={10}
                onPress={() => save({ weeklyTasksTarget: Math.min(60, weeklyTasksTarget + 1) })}
              >
                <Feather name="plus-circle" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Preferences</Text>
          <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>In-app notifications</Text>
            <Switch
              accessibilityLabel="In-app notifications"
              value={preferences.notificationsEnabled}
              onValueChange={(v) =>
                save({ preferences: { ...preferences, notificationsEnabled: v } })
              }
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
          <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Weekly nudges</Text>
            <Switch
              accessibilityLabel="Weekly nudges"
              value={preferences.nudgesEnabled}
              onValueChange={(v) => save({ preferences: { ...preferences, nudgesEnabled: v } })}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
          <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Personalized ads</Text>
            <Switch
              accessibilityLabel="Personalized ads"
              value={preferences.adsEnabled}
              onValueChange={(v) => save({ preferences: { ...preferences, adsEnabled: v } })}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
        </View>

        {/* Links */}
        <View style={styles.section}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Achievements"
            style={[styles.linkRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/achievements')}
          >
            <Feather name="award" size={18} color={colors.accent} />
            <Text style={[styles.linkText, { color: colors.foreground }]}>Achievements</Text>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="History"
            style={[styles.linkRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/history')}
          >
            <Feather name="bar-chart-2" size={18} color={colors.primary} />
            <Text style={[styles.linkText, { color: colors.foreground }]}>History</Text>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            style={[styles.linkRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/notifications')}
          >
            <Feather name="bell" size={18} color={colors.foreground} />
            <Text style={[styles.linkText, { color: colors.foreground }]}>Notifications</Text>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Privacy policy"
            style={[styles.linkRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/privacy')}
          >
            <Feather name="shield" size={18} color={colors.mutedForeground} />
            <Text style={[styles.linkText, { color: colors.foreground }]}>Privacy Policy</Text>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Walk through setup again"
            style={[styles.linkRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleRedoOnboarding}
          >
            <Feather name="rotate-ccw" size={18} color={colors.mutedForeground} />
            <Text style={[styles.linkText, { color: colors.foreground }]}>Redo setup</Text>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          style={[styles.dangerBtn, { borderColor: colors.destructive }]}
          onPress={handleSignOut}
        >
          <Feather name="log-out" size={16} color={colors.destructive} />
          <Text style={[styles.dangerText, { color: colors.destructive }]}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },
  hero: { alignItems: 'center', gap: 10, marginBottom: 24 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 38, fontFamily: 'Inter_700Bold' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  heroSub: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  heroScore: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroScoreLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%' },
  editInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  section: { marginBottom: 22, gap: 10 },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  staticRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  staticValue: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  rowLabel: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperValue: { fontSize: 15, fontFamily: 'Inter_700Bold', minWidth: 40, textAlign: 'center' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 52,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  linkText: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  dangerText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
