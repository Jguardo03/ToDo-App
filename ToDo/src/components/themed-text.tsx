import { Text, type TextProps } from 'react-native';

import { ThemeColor, Typography, type TextVariant } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  variant?: TextVariant;
  color?: ThemeColor;
};

export function ThemedText({ style, variant = 'bodyMd', color = 'onSurface', ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        Typography[variant],
        { color: theme[color] },
        variant === 'labelXs' && { textTransform: 'uppercase' },
        style,
      ]}
      {...rest}
    />
  );
}
