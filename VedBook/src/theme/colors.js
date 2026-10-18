import { Platform } from 'react-native';

export const colors = {
  // Brand Palette
  primary: '#173F35', // Forest Green
  primaryDark: '#102F28', // Dark Green
  primaryLight: '#245748',
  ivory: '#FAF7F0', // Warm Ivory
  ivoryDark: '#F2EDE0',
  white: '#FFFFFF',
  gold: '#C6A45C', // Muted Gold
  goldLight: '#E8D7A8',
  goldDark: '#A8863E',
  sage: '#E4EDE5', // Light Sage
  sageDark: '#CAD9CC',
  sageLight: '#F3F7F4',

  // Semantics & Neutrals
  surface: '#FFFFFF',
  surfaceAlt: '#F2EEE5',
  paper: '#FFFFFF',
  background: '#FAF7F0',
  text: '#173F35',
  textSecondary: '#777B75', // Secondary Text
  textMuted: '#9BA199',
  textLight: '#FAF7F0',
  border: '#E7E1D5', // Border
  borderLight: '#F0ECE4',

  // Status & Feedback
  success: '#2E7D32',
  error: '#C0392B',
  warning: '#D97706',
  info: '#173F35',

  // Overlays
  overlay: 'rgba(23, 63, 53, 0.4)',
  overlayDark: 'rgba(16, 47, 40, 0.8)',
};

export const typography = {
  fontSerif: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'serif',
  }),
  fontSans: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'sans-serif',
  }),
  h1: {
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    color: colors.primary,
  },
  h2: {
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    color: colors.primary,
  },
  h3: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    color: colors.primary,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.textSecondary,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    color: colors.textSecondary,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 9999,
};

export const shadows = {
  soft: {
    shadowColor: '#173F35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  card: {
    shadowColor: '#173F35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  medium: {
    shadowColor: '#173F35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 6,
  },
  elevated: {
    shadowColor: '#173F35',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  hover: {
    shadowColor: '#173F35',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
};
