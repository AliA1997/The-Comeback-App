import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const LAST_UPDATED = 'May 2, 2026';
const APP_NAME = 'Career Comeback Time Tracker';
const CONTACT_EMAIL = 'privacy@alsaqr.app';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
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

export default function PrivacyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
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
          <Para>
            The App is designed for developers re-entering the tech industry. It helps you track
            tasks, manage focus timers, and review productivity history.
          </Para>
        </Section>

        <Section title="Information We Collect">
          <Para>
            The App stores all task and timer data locally on your device using AsyncStorage. No
            personal data is transmitted to our servers. Specifically, the App stores:
          </Para>
          <Bullet text="Tasks you create (titles, descriptions, categories, durations)" />
          <Bullet text="Timer sessions and completion history" />
          <Bullet text="Daily productivity records and streaks" />
          <Bullet text="App preferences (e.g. whether you have seen the onboarding screen)" />
        </Section>

        <Section title="Advertising">
          <Para>
            The App integrates the AppLovin MAX and BidMachine advertising SDKs (active in native
            builds only). These third-party SDKs may collect:
          </Para>
          <Bullet text="Device identifiers (e.g. IDFA on iOS, Android Advertising ID)" />
          <Bullet text="IP address and approximate location" />
          <Bullet text="Device model, OS version, and screen size" />
          <Bullet text="App usage data for ad targeting purposes" />
          <Para>
            You can limit ad tracking in your device settings (iOS: Settings › Privacy › Tracking;
            Android: Settings › Google › Ads). For more information, see AppLovin's privacy policy
            at applovin.com/privacy and BidMachine's policy at bidmachine.io/privacy-policy.
          </Para>
          <Para>
            Interstitial ads are only shown during idle state (when no timer is active) — never
            during focus sessions.
          </Para>
        </Section>

        <Section title="Data Sharing">
          <Para>
            We do not sell, rent, or share your personal data with third parties except:
          </Para>
          <Bullet text="Ad SDKs as described above (AppLovin MAX, BidMachine)" />
          <Bullet text="If required by law or legal process" />
        </Section>

        <Section title="Data Retention & Deletion">
          <Para>
            All data is stored on your device. You can delete all App data at any time by
            uninstalling the App, which removes all locally stored information.
          </Para>
        </Section>

        <Section title="Children's Privacy">
          <Para>
            The App is not directed to children under 13 years of age. We do not knowingly
            collect personal information from children. If you believe a child has provided
            information through the App, please contact us to remove it.
          </Para>
        </Section>

        <Section title="Your Rights">
          <Para>Depending on your jurisdiction, you may have the right to:</Para>
          <Bullet text="Access the personal data we hold about you" />
          <Bullet text="Request deletion of your data" />
          <Bullet text="Opt out of interest-based advertising" />
          <Para>
            Since all your task and timer data is stored only on your device, you have direct
            control over it at all times.
          </Para>
        </Section>

        <Section title="Changes to This Policy">
          <Para>
            We may update this Privacy Policy from time to time. The updated version will be
            accessible within the App. Continued use of the App after changes constitutes
            acceptance of the revised policy.
          </Para>
        </Section>

        <Section title="Contact">
          <Para>If you have any questions about this Privacy Policy, contact us at:</Para>
          <Para>{CONTACT_EMAIL}</Para>
          <Para>alsaqr.app · {CONTACT_EMAIL}</Para>
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
