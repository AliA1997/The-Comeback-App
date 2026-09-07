/**
 * How much vertical space the floating tab bar occupies.
 *
 * The tab bar is `position: 'absolute'` (app/(tabs)/_layout.tsx), so it paints
 * over screen content and every tab screen has to reserve its own bottom
 * space. That reservation used to be a hardcoded `120`, which is a guess at
 * (bar height + bottom safe-area inset) — a sum that differs between gesture
 * navigation, three-button navigation and display cutouts. Where the real
 * value exceeded 120 the last row of content sat under the bar.
 *
 * One module owns the number now: the layout sizes the bar from it, screens
 * pad from it, and the active-timer dock positions from it. They cannot
 * disagree.
 *
 * Spec: backend-write-failures-and-ui-placement.md § AC-5, AC-7.
 */
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * The bar's own height, before the safe-area inset is added. Web has no
 * gesture inset to absorb, so it carries the taller fixed value the layout
 * previously set inline.
 */
export const TAB_BAR_CONTENT_HEIGHT = Platform.OS === 'web' ? 84 : 60;

/** Total height the bar occupies, including the device's bottom inset. */
export function useTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_CONTENT_HEIGHT + (Platform.OS === 'web' ? 0 : insets.bottom);
}

/**
 * Bottom padding a scrolling tab screen needs so its last row clears the bar.
 *
 * `extra` is breathing room above the bar rather than a fudge factor — the
 * bar's height is already accounted for.
 */
export function useTabBarInset(extra = 24): number {
  return useTabBarHeight() + extra;
}
