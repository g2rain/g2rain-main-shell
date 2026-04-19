/**
 * 主题状态管理（Pinia）
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ThemeMode, ThemeConfig } from '../theme/types';
import { THEME_MODES } from '../theme/types';
import { applyTheme, saveTheme, initTheme, getCurrentTheme } from '../theme';

export const useThemeStore = defineStore('theme', () => {
  const currentMode = ref<ThemeMode>('light');
  const initialized = ref(false);

  const currentTheme = computed<ThemeConfig>(() => {
    return THEME_MODES[currentMode.value];
  });

  const availableThemes = computed<ThemeConfig[]>(() => {
    return Object.values(THEME_MODES);
  });

  /**
   * 初始化主题
   */
  const initialize = async (defaultTheme: ThemeMode = 'light'): Promise<void> => {
    if (initialized.value) {
      return;
    }

    try {
      await initTheme(defaultTheme);
      currentMode.value = getCurrentTheme();
      initialized.value = true;
      console.log('[ThemeStore] 主题初始化完成:', currentMode.value);
    } catch (error) {
      console.error('[ThemeStore] 主题初始化失败:', error);
      throw error;
    }
  };

  /**
   * 切换主题
   */
  const setTheme = async (mode: ThemeMode): Promise<void> => {
    if (currentMode.value === mode) {
      return;
    }

    try {
      await applyTheme(mode);
      currentMode.value = mode;
      saveTheme(mode);
      console.log('[ThemeStore] 主题已切换:', mode);
    } catch (error) {
      console.error('[ThemeStore] 切换主题失败:', error);
      throw error;
    }
  };

  /**
   * 切换亮色/暗色主题
   */
  const toggleDarkMode = async (): Promise<void> => {
    const newMode = currentMode.value === 'dark' ? 'light' : 'dark';
    await setTheme(newMode);
  };

  /**
   * 重置主题
   */
  const reset = (): void => {
    currentMode.value = 'light';
    initialized.value = false;
  };

  return {
    currentMode,
    currentTheme,
    availableThemes,
    initialized,
    initialize,
    setTheme,
    toggleDarkMode,
    reset,
  };
});
