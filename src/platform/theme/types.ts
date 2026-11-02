/**
 * 主题类型：对齐 @g2rain/theme（仅 light / dark）
 */

export type ThemeMode = 'light' | 'dark';

export interface ThemeConfig {
  mode: ThemeMode;
  name: string;
  displayName: string;
}

export const THEME_MODES: Record<ThemeMode, ThemeConfig> = {
  light: {
    mode: 'light',
    name: 'light',
    displayName: '亮色主题',
  },
  dark: {
    mode: 'dark',
    name: 'dark',
    displayName: '暗色主题',
  },
};
