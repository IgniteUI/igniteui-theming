import { useMemo } from 'react';
import { useColorMode } from '@/lib/theme/color-mode';
import {
  sandpackRosepineMoonTheme,
  sandpackRosepineDawnTheme,
} from '../../themes/codeThemes';

export function useSandpackTheme() {
  const { colorMode } = useColorMode();

  return useMemo(
    () =>
      colorMode === 'dark'
        ? sandpackRosepineMoonTheme
        : sandpackRosepineDawnTheme,
    [colorMode]
  );
}
