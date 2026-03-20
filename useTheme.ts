import { useColorScheme } from 'react-native';
import { COLORS } from '../constants';

export type Theme = typeof COLORS.dark;

export function useTheme(): { theme: Theme; isDark: boolean } {
  const scheme = useColorScheme();
  const isDark = scheme !== 'light';
  return {
    theme: isDark ? COLORS.dark : COLORS.light,
    isDark,
  };
}
