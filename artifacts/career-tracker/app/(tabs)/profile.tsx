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
import { useColors } from '@/shared/theme/useColors';
import { useAppStore } from '@/shared/store/root';
import {
  CAREER_TRACKS,
  SENIORITY_LEVELS,
  type CareerTrack,
  type Seniority,
} from '@/domains/user-profile/types';
import {
  useProfile,
  useUserPreferences,
  useUserGoals,
} from '@/domains/user-profile/selectors';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const profile = useProfile();
  const preferences = useUserPreferences();
  const goals = useUserGoals();

  const setProfileName = useAppStore((s) => s.setProfileName);
  const setCareerTrack = useAppStore((s) => s.setCareerTrack);
  const setSeniority = useAppStore((s) => s.setSeniority);
  const setTargetRole = useAppStore((s) => s.setTargetRole);
  const updateGoals = useAppStore((s) => s.updateGoals);
  const updatePreferences = useAppStore((s) => s.updatePreferences);
  const resetProfile = useAppStore((s) => s.resetProfile);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.name);
  const [editingRole, setEditingRole] = useState(false);
  const [roleDraft, setRoleDraft] = useState(profile.targetRole);

  const handleReset = () => {
    if (Platform.OS === 'web') {
      resetProfile();
      return;
    }
    Alert.alert(
      'Reset profile?',
      'This restarts onboarding and clears your profile settings. Your tasks and history are kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            resetProfile();
          },
        },
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
            paddingBottom: 120 + (Platform.OS === 'web' ? 34 : 0),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.avatar, { backgroundColor: `${colors.primary}33` }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {(profile.name || '?').slice(0, 1).toUpperCase()}
            </Text>
          </View>
          {editingName ? (
            <View style={styles.editRow}>
              <TextInput
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
                onPress={() => {
                  setProfileName(nameDraft.trim() || profile.name);
                  setEditingName(false);
                }}
              >
                <Feather name="check" size={20} color={colors.accent} />
              </TouchableOpacity>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                setNameDraft(profile.name);
                setEditingName(true);
              }}
              style={styles.nameRow}
            >
              <Text style={[styles.name, { color: colors.foreground }]}>
                {profile.name || 'Add your name'}
              </Text>
              <Feather name="edit-2" size={14} color={colors.mutedForeground} />
            </Pressable>
          )}
          <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
            {profile.careerTrack ?? 'Set track'} · {profile.seniority ?? 'Set level'}
          </Text>
        </View>

        {/* Career track */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Career Track</Text>
          <View style={styles.chipWrap}>
            {CAREER_TRACKS.map((t) => {
              const active = profile.careerTrack === t;
              return (
                <Pressable
                  key={t}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setCareerTrack(t as CareerTrack);
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
              const active = profile.seniority === lvl;
              return (
                <Pressable
                  key={lvl}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSeniority(lvl as Seniority);
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
                onPress={() => {
                  setTargetRole(roleDraft.trim());
                  setEditingRole(false);
                }}
              >
                <Feather name="check" size={20} color={colors.accent} />
              </TouchableOpacity>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                setRoleDraft(profile.targetRole);
                setEditingRole(true);
              }}
              style={[styles.staticRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.staticValue, { color: colors.foreground }]} numberOfLines={1}>
                {profile.targetRole || 'Tap to set'}
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
                onPress={() =>
                  updateGoals({ dailyMinutesTarget: Math.max(15, goals.dailyMinutesTarget - 15) })
                }
              >
                <Feather name="minus-circle" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
              <Text style={[styles.stepperValue, { color: colors.foreground }]}>
                {goals.dailyMinutesTarget}m
              </Text>
              <TouchableOpacity
                onPress={() =>
                  updateGoals({ dailyMinutesTarget: Math.min(480, goals.dailyMinutesTarget + 15) })
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
                onPress={() => updateGoals({ weeklyTasksTarget: Math.max(1, goals.weeklyTasksTarget - 1) })}
              >
                <Feather name="minus-circle" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
              <Text style={[styles.stepperValue, { color: colors.foreground }]}>
                {goals.weeklyTasksTarget}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  updateGoals({ weeklyTasksTarget: Math.min(60, goals.weeklyTasksTarget + 1) })
                }
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
              value={preferences.notificationsEnabled}
              onValueChange={(v) => updatePreferences({ notificationsEnabled: v })}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
          <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Weekly nudges</Text>
            <Switch
              value={preferences.nudgesEnabled}
              onValueChange={(v) => updatePreferences({ nudgesEnabled: v })}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
          <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>Personalized ads</Text>
            <Switch
              value={preferences.adsEnabled}
              onValueChange={(v) => updatePreferences({ adsEnabled: v })}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
        </View>

        {/* Links */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.linkRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/achievements')}
          >
            <Feather name="award" size={18} color={colors.accent} />
            <Text style={[styles.linkText, { color: colors.foreground }]}>Achievements</Text>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.linkRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/history')}
          >
            <Feather name="bar-chart-2" size={18} color={colors.primary} />
            <Text style={[styles.linkText, { color: colors.foreground }]}>History</Text>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.linkRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/notifications')}
          >
            <Feather name="bell" size={18} color={colors.foreground} />
            <Text style={[styles.linkText, { color: colors.foreground }]}>Notifications</Text>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.linkRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/privacy')}
          >
            <Feather name="shield" size={18} color={colors.mutedForeground} />
            <Text style={[styles.linkText, { color: colors.foreground }]}>Privacy Policy</Text>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.dangerBtn, { borderColor: colors.destructive }]}
          onPress={handleReset}
        >
          <Feather name="rotate-ccw" size={16} color={colors.destructive} />
          <Text style={[styles.dangerText, { color: colors.destructive }]}>Reset profile</Text>
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
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  staticRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  staticValue: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  dangerText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
