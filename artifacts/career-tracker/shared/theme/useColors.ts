import { useColorScheme } from 'react-native';
import colors from './colors';

/**
 * Returns the design tokens for the current color scheme, plus
 * scheme-independent values like `radius`. The app currently ships
 * dark-only; the structure leaves room for a light palette later.
 */
export function useColors() {
  const scheme = useColorScheme();
  const palette =
    scheme === 'dark' && 'dark' in colors
      ? (colors as Record<string, typeof colors.light>).dark
      : colors.light;
  return { ...palette, radius: colors.radius };
}
