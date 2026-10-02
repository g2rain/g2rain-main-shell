/**
 * 主题状态管理 — 包装 @g2rain/platform/theme ThemeController
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ThemeMode, ThemeConfig } from '../theme/types';
import { THEME_MODES } from '../theme/types';
import { getThemeController, initThemeController } from '../theme/controller';

export const useThemeStore = defineStore('theme', () => {
  const currentMode = ref<ThemeMode>('light');
  const initialized = ref(false);

  const currentTheme = computed<ThemeConfig>(() => {
    return THEME_MODES[currentMode.value];
  });

  const availableThemes = computed<ThemeConfig[]>(() => {
    return Object.values(THEME_MODES);
  });

  const initialize = async (_defaultTheme: ThemeMode = 'light'): Promise<void> => {
    if (initialized.value) {
      return;
    }

    try {
      const ctrl = initThemeController();
      currentMode.value = ctrl.getTheme();
      initialized.value = true;
      console.log('[ThemeStore] 主题初始化完成:', currentMode.value);
    } catch (error) {
      console.error('[ThemeStore] 主题初始化失败:', error);
      throw error;
    }
  };

  const setTheme = async (mode: ThemeMode): Promise<void> => {
    if (currentMode.value === mode) {
      return;
    }

    try {
      const ctrl = getThemeController();
      ctrl.setTheme(mode);
      currentMode.value = mode;
      console.log('[ThemeStore] 主题已切换:', mode);
    } catch (error) {
      console.error('[ThemeStore] 切换主题失败:', error);
      throw error;
    }
  };

  const toggleDarkMode = async (): Promise<void> => {
    const newMode = currentMode.value === 'dark' ? 'light' : 'dark';
    await setTheme(newMode);
  };

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
