/**
 * Career Comeback Time Tracker — Dark professional theme
 * Inspired by developer-focused tools: Linear, Vercel, Raycast
 */

const colors = {
  light: {
    // Legacy aliases
    text: '#FFFFFF',
    tint: '#4F7FFF',

    // Core surfaces
    background: '#0A0E1A',
    foreground: '#FFFFFF',

    // Cards / elevated surfaces
    card: '#141924',
    cardForeground: '#FFFFFF',

    // Primary action (electric blue)
    primary: '#4F7FFF',
    primaryForeground: '#FFFFFF',

    // Secondary
    secondary: '#1E2A3A',
    secondaryForeground: '#E8ECF0',

    // Muted
    muted: '#1E2A3A',
    mutedForeground: '#8895A7',

    // Accent (teal — success, streaks)
    accent: '#00D4AA',
    accentForeground: '#0A0E1A',

    // Destructive
    destructive: '#FF4757',
    destructiveForeground: '#FFFFFF',

    // Borders and inputs
    border: '#1E2A3A',
    input: '#1A2236',
  },

  radius: 12,
} as const;

export default colors;
