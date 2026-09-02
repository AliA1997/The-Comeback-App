import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/shared/theme/useColors';

const LAST_UPDATED = 'May 17, 2026';
const APP_NAME = 'Career Comeback Time Tracker';
const CONTACT_EMAIL = 'privacy@alsaqr.app';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {children}
    </View>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return <Text style={[styles.para, { color: colors.mutedForeground }]}>{children}</Text>;
}

function Bullet({ text }: { text: string }) {
  const colors = useColors();
  return (
    <View style={styles.bulletRow}>
      <View style={[styles.bulletDot, { backgroundColor: colors.mutedForeground }]} />
      <Text style={[styles.bulletText, { color: colors.mutedForeground }]}>{text}</Text>
    </View>
  );
}

export function PrivacyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === 'web' ? insets.top + 67 : insets.top + 16,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Privacy Policy</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.lastUpdated, { color: colors.mutedForeground }]}>
          Last updated: {LAST_UPDATED}
        </Text>

        <Section title="Overview">
          <Para>
            {APP_NAME} ("the App", "we", "our") is committed to protecting your privacy. This
            policy explains what information is collected, how it is used, and your rights
            regarding that information.
          </Para>
        </Section>

        <Section title="Information We Collect">
          <Para>
            All profile, task, lesson, and timer data is stored locally on your device using
            AsyncStorage. No personal data is transmitted to our servers. Specifically, the App
            stores:
          </Para>
          <Bullet text="Your profile (name, career track, seniority, target role, goals)" />
          <Bullet text="Tasks you create (titles, descriptions, categories, durations)" />
          <Bullet text="Timer sessions and completion history" />
          <Bullet text="Lesson progress and quiz scores" />
          <Bullet text="Unlocked achievements" />
          <Bullet text="In-app notification inbox and nudge history" />
        </Section>

        <Section title="Advertising">
          <Para>
            The App integrates the AppLovin MAX and BidMachine advertising SDKs (active in native
            builds only). These third-party SDKs may collect device identifiers, IP address,
            device model, and ad-interaction data. Interstitial ads are only shown during idle
            state — never during focus sessions.
          </Para>
          <Para>
            You can opt out of personalized ads from your Profile screen, or limit ad tracking in
            your device settings.
          </Para>
        </Section>

        <Section title="Data Retention & Deletion">
          <Para>
            All data is stored on your device. You can reset your profile from the Profile screen
            or delete all App data by uninstalling the App.
          </Para>
        </Section>

        <Section title="Contact">
          <Para>If you have any questions about this Privacy Policy, contact us at:</Para>
          <Para>{CONTACT_EMAIL}</Para>
        </Section>
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
  content: { paddingHorizontal: 24, paddingTop: 20, gap: 4 },
  lastUpdated: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 20 },
  section: { marginBottom: 28, gap: 10 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  para: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 8, flexShrink: 0 },
  bulletText: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },
});
