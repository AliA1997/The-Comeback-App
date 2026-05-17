/**
 * OnboardingWizard — first-launch wizard.
 *
 * Replaces the original `LandingOverlay`. Calls
 * `completeOnboarding({ name, careerTrack, seniority, targetRole })`
 * once the user finishes — the user-profile slice then flips
 * `onboardingComplete` and stores the seed profile.
 */
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useColors } from '@/shared/theme/useColors';
import { useAppStore } from '@/shared/store/root';
import {
  CAREER_TRACKS,
  SENIORITY_LEVELS,
  type CareerTrack,
  type Seniority,
} from '@/domains/user-profile/types';

type Step = 0 | 1 | 2 | 3;

export function OnboardingWizard() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);

  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState('');
  const [track, setTrack] = useState<CareerTrack | null>(null);
  const [seniority, setSeniority] = useState<Seniority | null>(null);
  const [targetRole, setTargetRole] = useState('');

  const canContinue =
    step === 0 ||
    (step === 1 && track !== null) ||
    (step === 2 && seniority !== null) ||
    step === 3;

  const next = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < 3) {
      setStep(((step + 1) as Step));
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeOnboarding({
      name: name.trim() || 'Friend',
      careerTrack: track,
      seniority,
      targetRole: targetRole.trim(),
    });
  };

  const back = () => {
    if (step === 0) return;
    Haptics.selectionAsync();
    setStep(((step - 1) as Step));
  };

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(250)}
      style={[styles.overlay, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + (Platform.OS === 'web' ? 56 : 24),
            paddingBottom: insets.bottom + 120,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress dots */}
        <View style={styles.dots}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i <= step ? colors.primary : colors.border,
                  width: i === step ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {step === 0 ? (
          <View style={styles.stepBlock}>
            <View style={[styles.iconRing, { borderColor: `${colors.primary}33` }]}>
              <View style={[styles.iconBg, { backgroundColor: colors.card }]}>
                <Feather name="clock" size={40} color={colors.primary} />
              </View>
            </View>
            <Text style={[styles.h1, { color: colors.foreground }]}>Welcome back to the climb.</Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              Career Comeback Time Tracker keeps your job-search routine structured — time tracking,
              streaks, lessons, and weekly nudges. Let's set you up in 30 seconds.
            </Text>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>What's your name?</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Alex"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border },
              ]}
              maxLength={40}
              autoFocus={Platform.OS === 'web'}
            />
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.stepBlock}>
            <Text style={[styles.h1, { color: colors.foreground }]}>What's your track?</Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              We'll tune lesson recommendations to your specialty.
            </Text>
            <View style={styles.chips}>
              {CAREER_TRACKS.map((t) => {
                const active = track === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setTrack(t);
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.primary : colors.card,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.chipText, { color: active ? '#fff' : colors.foreground }]}
                    >
                      {t}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.stepBlock}>
            <Text style={[styles.h1, { color: colors.foreground }]}>Where are you in your career?</Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              We adjust the bar for "ready" based on the seniority you're aiming at.
            </Text>
            <View style={styles.chips}>
              {SENIORITY_LEVELS.map((lvl) => {
                const active = seniority === lvl;
                return (
                  <Pressable
                    key={lvl}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSeniority(lvl);
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.primary : colors.card,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: active ? '#fff' : colors.foreground }]}>
                      {lvl}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.stepBlock}>
            <Text style={[styles.h1, { color: colors.foreground }]}>What role are you aiming at?</Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              Optional — a one-liner like "Senior Frontend at a Series-B startup".
            </Text>
            <TextInput
              value={targetRole}
              onChangeText={setTargetRole}
              placeholder="e.g. Senior Frontend Engineer"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border },
              ]}
              maxLength={80}
            />
            <Text style={[styles.smallNote, { color: colors.mutedForeground }]}>
              All data stays on your device. You can change everything in Profile later.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        <Pressable
          onPress={back}
          disabled={step === 0}
          style={[styles.secondaryBtn, { opacity: step === 0 ? 0 : 1 }]}
        >
          <Feather name="arrow-left" size={18} color={colors.mutedForeground} />
          <Text style={[styles.secondaryBtnText, { color: colors.mutedForeground }]}>Back</Text>
        </Pressable>
        <Pressable
          onPress={next}
          disabled={!canContinue}
          style={({ pressed }) => [
            styles.primaryBtn,
            {
              backgroundColor: canContinue ? colors.primary : colors.border,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Text style={styles.primaryBtnText}>{step === 3 ? 'Get Started' : 'Continue'}</Text>
          <Feather name="arrow-right" size={18} color="#fff" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 9999 },
  content: { paddingHorizontal: 24, gap: 24 },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 8 },
  dot: { height: 8, borderRadius: 4 },
  stepBlock: { gap: 16 },
  iconRing: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBg: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  h1: { fontSize: 26, fontFamily: 'Inter_700Bold', textAlign: 'center', letterSpacing: -0.5 },
  sub: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 360,
    alignSelf: 'center',
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 4 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  smallNote: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 8 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  secondaryBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 26,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold', letterSpacing: 0.2 },
});
