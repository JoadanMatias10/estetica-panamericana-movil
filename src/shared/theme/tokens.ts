import { Platform } from 'react-native';

export const palette = {
  background: '#FFF9FC',
  backgroundAlt: '#F6F2FF',
  surface: '#FFFFFF',
  surfaceMuted: '#F8FAFC',
  text: '#2D3748',
  textMuted: '#64748B',
  textSubtle: '#94A3B8',
  border: '#E2E8F0',
  primary: '#BE185D',
  primaryBright: '#EC4899',
  primaryDark: '#9D174D',
  secondary: '#6D28D9',
  secondaryBright: '#8B5CF6',
  secondaryDark: '#5B21B6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#E53E3E',
  white: '#FFFFFF',
} as const;

export const gradients = {
  brand: [palette.primary, palette.secondary] as const,
  screen: [palette.background, palette.backgroundAlt] as const,
  soft: ['#FFEAF5', '#F0EAFE'] as const,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const layout = {
  contentMaxWidth: 600,
  screenPadding: spacing.lg,
  minimumTouchTarget: 44,
} as const;

export const fontFamily = {
  body: Platform.select({ web: 'Inter, system-ui, sans-serif', default: undefined }),
  display: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    web: 'Georgia, Times New Roman, serif',
    default: 'serif',
  }),
} as const;
