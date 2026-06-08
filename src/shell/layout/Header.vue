<template>
  <header class="main-header">
    <div class="logo">
      <img
        :src="logoHeader"
        :alt="$t('MS_HDR_LOGO', '谷雨开源SaaS平台')"
        class="logo-image"
      />
    </div>
    <div class="header-right">
      <el-select
        v-model="selectedLocale"
        :placeholder="$t('MS_HDR_LANG_PH', '选择语言')"
        filterable
        class="locale-select"
        :disabled="!localeStore.initialized || localeStore.options.length === 0"
        :loading="!localeStore.initialized"
      >
        <el-option
          v-for="item in localeStore.options"
          :key="item.code"
          :label="item.name"
          :value="item.code"
        />
      </el-select>

      <!-- 主题切换 -->
      <el-dropdown trigger="click" @command="handleThemeChange">
        <el-button
          :icon="Setting"
          circle
          class="theme-switcher"
          :title="themeButtonTitle"
        />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="theme in availableThemes"
              :key="theme.mode"
              :command="theme.mode"
              :class="{ 'is-active': currentMode === theme.mode }"
            >
              <el-icon v-if="currentMode === theme.mode" class="check-icon">
                <Check />
              </el-icon>
              {{ themeLabel(theme.mode) }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- 用户信息 -->
      <el-dropdown trigger="click" @command="handleUserCommand">
        <div class="user-info">
          <el-avatar icon="User" />
          <span class="username">{{ $t('MS_HDR_ADMIN', '管理员') }}</span>
          <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout" divided>
              <el-icon><SwitchButton /></el-icon>
              {{ $t('MS_HDR_LOGOUT', '退出登录') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Setting, Check, ArrowDown, SwitchButton } from '@element-plus/icons-vue';
import logoHeader from '@/assets/brand/logo-header.png';
import { useThemeStore, useLocaleStore } from '@platform/stores';
import { logout } from '@/runtime/boot';
import { t } from '@platform/i18n';
import type { ThemeMode } from '@platform/theme/types';

const router = useRouter();
const themeStore = useThemeStore();
const localeStore = useLocaleStore();

const selectedLocale = computed({
  get: () => localeStore.locale,
  set: (code: string) => {
    void localeStore.setLocale(code);
  },
});

// 当前主题模式
const currentMode = computed(() => themeStore.currentMode);
// 可用主题列表
// 当前主题配置
const availableThemes = computed(() => themeStore.availableThemes);

const THEME_I18N: Record<ThemeMode, [string, string]> = {
  light: ['MS_THEME_LIGHT', '亮色主题'],
  dark: ['MS_THEME_DARK', '暗色主题'],
  g2rain: ['MS_THEME_BRAND', 'G2rain 品牌主题'],
};

function themeLabel(mode: ThemeMode): string {
  const [key, def] = THEME_I18N[mode];
  return t(key, def);
}

const themeButtonTitle = computed(
  () => `${t('MS_HDR_THEME', '当前主题')}: ${themeLabel(currentMode.value)}`,
);

// 处理主题切换
const handleThemeChange = async (mode: ThemeMode) => {
  try {
    await themeStore.setTheme(mode);
  } catch (error) {
    console.error('[Header] 切换主题失败:', error);
  }
};

// 处理用户下拉菜单命令
const handleUserCommand = (command: string) => {
  if (command === 'logout') {
    logout(router);
  }
};
</script>

<style scoped>
.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: var(--header-height);
  padding: 0 var(--spacing-lg);
  background-color: var(--header-bg);
  border-bottom: 1px solid var(--header-border);
  box-shadow: var(--shadow-base);
}

.logo {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.logo-image {
  display: block;
  height: 36px;
  width: auto;
  max-width: min(320px, 42vw);
  object-fit: contain;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.locale-select {
  width: 150px;
}
.locale-select :deep(.el-select__wrapper) {
  background-color: transparent;
  box-shadow: 0 0 0 1px var(--border-color-base) inset;
}
.locale-select :deep(.el-select__placeholder),
.locale-select :deep(.el-select__selected-item) {
  color: var(--header-text);
}

.theme-switcher {
  border: 1px solid var(--border-color-base);
  background-color: transparent;
  color: var(--header-text);
  transition: all var(--transition-duration-fast) var(--transition-timing-function);
}

.theme-switcher:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background-color: var(--bg-color-page);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-md);
  transition: background-color var(--transition-duration-fast) var(--transition-timing-function);
}

.user-info:hover {
  background-color: var(--bg-color-page);
}

.username {
  font-size: var(--font-size-sm);
  color: var(--header-text);
}

.dropdown-icon {
  font-size: var(--font-size-xs);
  color: var(--text-color-placeholder);
  transition: transform var(--transition-duration-fast) var(--transition-timing-function);
}

/* 下拉菜单样式 - 使用主题变量 */
:deep(.el-dropdown-menu) {
  background-color: var(--dropdown-bg) !important;
  border-color: var(--dropdown-border) !important;
  box-shadow: var(--dropdown-shadow) !important;
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--dropdown-text) !important;
}

:deep(.el-dropdown-menu__item:hover) {
  background-color: var(--dropdown-bg-hover) !important;
  color: var(--dropdown-text-hover) !important;
}

:deep(.el-dropdown-menu__item.is-active) {
  color: var(--color-primary) !important;
  background-color: var(--dropdown-bg-hover) !important;
}

:deep(.el-dropdown-menu__item.divided) {
  border-top-color: var(--dropdown-border) !important;
}

.check-icon {
  color: var(--color-primary);
  font-size: var(--font-size-sm);
}
</style>
