import type { TextProps, TextStyle } from 'react-native';
import { StyleSheet, Text } from 'react-native';

import { fontFamily, palette } from '@/shared/theme/tokens';

type TextVariant = 'display' | 'title' | 'subtitle' | 'body' | 'label' | 'caption';
type TextTone = 'default' | 'muted' | 'primary' | 'inverse' | 'error';

type AppTextProps = TextProps & {
  tone?: TextTone;
  variant?: TextVariant;
};

const toneStyles: Record<TextTone, TextStyle> = {
  default: { color: palette.text },
  muted: { color: palette.textMuted },
  primary: { color: palette.primary },
  inverse: { color: palette.white },
  error: { color: palette.error },
};

export function AppText({ style, tone = 'default', variant = 'body', ...props }: AppTextProps) {
  return <Text {...props} style={[styles.base, styles[variant], toneStyles[tone], style]} />;
}

const styles = StyleSheet.create({
  base: {
    fontFamily: fontFamily.body,
  },
  display: {
    fontFamily: fontFamily.display,
    fontSize: 30,
    fontWeight: '600',
    lineHeight: 38,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 31,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  caption: {
    fontSize: 12,
    lineHeight: 17,
  },
});
