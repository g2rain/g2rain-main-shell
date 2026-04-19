/**
 * 主题切换入口
 */

import type { ThemeMode } from './types';
import { mapElementPlusVariables } from './element';

// 导入所有主题 CSS（在构建时处理）
import './themes/light.css';
import './themes/dark.css';
import './themes/g2rain.css';

let currentThemeMode: ThemeMode = 'light';

/**
 * 应用主题
 */
export const applyTheme = async (mode: ThemeMode): Promise<void> => {
  try {
    // 设置 data-theme 属性（CSS 选择器会根据这个属性应用对应主题）
    document.documentElement.setAttribute('data-theme', mode);
    currentThemeMode = mode;

    // 映射 Element Plus 变量
    mapElementPlusVariables();

    console.log(`[Theme] 主题已切换到: ${mode}`);
  } catch (error) {
    console.error(`[Theme] 切换主题失败:`, error);
    throw error;
  }
};

/**
 * 获取当前主题
 */
export const getCurrentTheme = (): ThemeMode => {
  return currentThemeMode;
};

/**
 * 初始化主题（从 localStorage 或默认值）
 */
export const initTheme = async (defaultTheme: ThemeMode = 'light'): Promise<void> => {
  const savedTheme = localStorage.getItem('theme') as ThemeMode | null;
  const theme =
    savedTheme && ['light', 'dark', 'g2rain'].includes(savedTheme) ? savedTheme : defaultTheme;

  await applyTheme(theme);
};

/**
 * 保存主题到 localStorage
 */
export const saveTheme = (mode: ThemeMode): void => {
  localStorage.setItem('theme', mode);
};
