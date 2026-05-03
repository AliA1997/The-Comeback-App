import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { useAppStore } from '@/store/useAppStore';

const { width, height } = Dimensions.get('window');

const FEATURES = [
  { icon: 'clock', text: 'Track time on every task' },
  { icon: 'zap', text: 'Career guidance insights' },
  { icon: 'bar-chart-2', text: 'Streaks & analytics' },
];

export function LandingOverlay() {
  const colors = useColors();
  const setHasSeenLanding = useAppStore((s) => s.setHasSeenLanding);

  // Shared values for animations
  const containerOpacity = useSharedValue(1);
  const logoScale = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);
  const titleY = useSharedValue(30);
  const titleOpacity = useSharedValue(0);
  const subtitleY = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);
  const featuresOpacity = useSharedValue(0);
  const featuresY = useSharedValue(20);
  const ctaOpacity = useSharedValue(0);
  const ctaY = useSharedValue(24);

  useEffect(() => {
    // Staggered entrance
    logoOpacity.value = withTiming(1, { duration: 600 });
    logoScale.value = withTiming(1, { duration: 700 });

    titleOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    titleY.value = withDelay(400, withTiming(0, { duration: 500 }));

    subtitleOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
    subtitleY.value = withDelay(700, withTiming(0, { duration: 500 }));

    featuresOpacity.value = withDelay(1000, withTiming(1, { duration: 500 }));
    featuresY.value = withDelay(1000, withTiming(0, { duration: 500 }));

    ctaOpacity.value = withDelay(1400, withTiming(1, { duration: 500 }));
    ctaY.value = withDelay(1400, withTiming(0, { duration: 500 }));
  }, []);

  const handleGetStarted = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    containerOpacity.value = withTiming(0, { duration: 400 }, (finished) => {
      if (finished) runOnJS(setHasSeenLanding)();
    });
  };

  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));
  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleY.value }],
  }));
  const featuresStyle = useAnimatedStyle(() => ({
    opacity: featuresOpacity.value,
    transform: [{ translateY: featuresY.value }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.overlay,
        { backgroundColor: colors.background },
        containerStyle,
      ]}
    >
      <View style={styles.inner}>
        {/* Logo */}
        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <View style={[styles.logoRing, { borderColor: `${colors.primary}44` }]}>
            <View style={[styles.logoBg, { backgroundColor: colors.card }]}>
              <Feather name="clock" size={44} color={colors.primary} />
            </View>
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View style={[styles.titleBlock, titleStyle]}>
          <Text style={[styles.title, { color: colors.foreground }]}>Career Comeback</Text>
          <View style={[styles.titleBadge, { backgroundColor: `${colors.primary}22` }]}>
            <Text style={[styles.titleBadgeText, { color: colors.primary }]}>Time Tracker</Text>
          </View>
        </Animated.View>

        {/* Subtitle */}
        <Animated.Text style={[styles.subtitle, { color: colors.mutedForeground }, subtitleStyle]}>
          The structured productivity system built for developers getting back into the industry.
        </Animated.Text>

        {/* Features */}
        <Animated.View style={[styles.features, featuresStyle]}>
          {FEATURES.map((f) => (
            <View
              key={f.icon}
              style={[styles.featureRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.featureIcon, { backgroundColor: `${colors.primary}22` }]}>
                <Feather name={f.icon as any} size={16} color={colors.primary} />
              </View>
              <Text style={[styles.featureText, { color: colors.foreground }]}>{f.text}</Text>
              <Feather name="check" size={14} color={colors.accent} />
            </View>
          ))}
        </Animated.View>

        {/* CTA */}
        <Animated.View style={[styles.ctaWrap, ctaStyle]}>
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
            onPress={handleGetStarted}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaBtnText}>Get Started</Text>
            <Feather name="arrow-right" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.ctaNote, { color: colors.mutedForeground }]}>
            All data stored locally on your device
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: 'center',
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 20,
  },
  logoWrap: { marginBottom: 8 },
  logoRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: { alignItems: 'center', gap: 8 },
  title: {
    fontSize: 34,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1,
    textAlign: 'center',
  },
  titleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
  },
  titleBadgeText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  features: { gap: 10, width: '100%' },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  ctaWrap: { alignItems: 'center', gap: 12, width: '100%' },
  ctaBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 30,
  },
  ctaBtnText: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    letterSpacing: 0.2,
  },
  ctaNote: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});
