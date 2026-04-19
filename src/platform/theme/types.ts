/**
 * 主题类型定义
 */

export type ThemeMode = 'light' | 'dark' | 'g2rain';

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
  g2rain: {
    mode: 'g2rain',
    name: 'g2rain',
    displayName: 'G2rain 品牌主题',
  },
};
