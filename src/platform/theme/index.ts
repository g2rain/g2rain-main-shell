/**
 * 主题模块出口 — 运行时以 ThemeController 为准；保留兼容 re-export。
 */

export type { ThemeMode, ThemeConfig } from './types';
export { THEME_MODES } from './types';
export { initThemeController, getThemeController } from './controller';
