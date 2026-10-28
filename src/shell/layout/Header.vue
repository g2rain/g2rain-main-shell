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
              {{ themeLabel(theme.mode) }}
              <el-icon v-if="currentMode === theme.mode" class="check-icon">
                <Check />
              </el-icon>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- 用户信息 -->
      <el-dropdown
        trigger="click"
        popper-class="user-menu-popper"
        @command="handleUserCommand"
        @visible-change="onUserMenuVisible"
      >
        <div class="user-info">
          <span class="username">{{ displayName }}</span>
          <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <div class="user-menu-identity">
              <div class="user-menu-name">{{ displayName }}</div>
              <div v-if="profile.organName" class="user-menu-organ">{{ profile.organName }}</div>
            </div>
            <!-- 切换身份：员工会话展示，列表超出约 5 条时单独滚动 -->
            <div v-if="isUserSession" class="user-menu-switch">
              <div class="user-menu-title">{{ $t('MS_HDR_SWITCH_IDENTITY', '切换身份') }}</div>
              <div class="user-menu-identities">
                <el-dropdown-item
                  v-for="item in identities"
                  :key="String(item.userId)"
                  :command="`${SWITCH_PREFIX}${item.userId}`"
                  :disabled="switching"
                  :class="{ 'is-active': String(item.userId) === profile.userId }"
                >
                  <span class="identity-text">
                    <span
                      class="identity-organ"
                      :title="item.organName || $t('MS_HDR_ORGAN_UNNAMED', '未命名机构')"
                    >{{ item.organName || $t('MS_HDR_ORGAN_UNNAMED', '未命名机构') }}</span>
                    <span v-if="item.userName" class="identity-user">{{ item.userName }}</span>
                  </span>
                  <el-icon v-if="String(item.userId) === profile.userId" class="check-icon"><Check /></el-icon>
                </el-dropdown-item>
              </div>
            </div>
            <el-dropdown-item command="logout">
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
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Setting, Check, ArrowDown, SwitchButton } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import logoHeader from '@/assets/brand/logo-header.png';
import { useThemeStore, useLocaleStore, useAccessTokenStore } from '@platform/stores';
import { sso } from '@/runtime/auth/sso';
import { listIdentities, type UserIdentityVo } from '@/runtime/api/user.api';
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

const tokenStore = useAccessTokenStore();
const profile = computed(() => tokenStore.profile);
const displayName = computed(() => profile.value.name || t('MS_HDR_ADMIN', '管理员'));

/** 切换身份命令前缀：`switch:<userId>` */
const SWITCH_PREFIX = 'switch:';

/** 当前账号在本应用中可切换的身份；每次打开用户菜单时刷新 */
const identities = ref<UserIdentityVo[]>([]);
const switching = ref(false);

/** 账号会话（尚未选定身份）走账号开通流程，不展示切换 */
const isUserSession = computed(() => profile.value.sessionType === 'USER');

const onUserMenuVisible = async (visible: boolean) => {
  if (!visible || !isUserSession.value) return;
  try {
    identities.value = await listIdentities();
  } catch (error) {
    console.warn('[Header] 查询可切换身份失败:', error);
  }
};

/**
 * 切换到同账号下的其他身份：确认后换票，整页回到首页，已打开的页签与子应用随之关闭。
 */
const switchIdentity = async (userId: string) => {
  if (userId === profile.value.userId || switching.value) return;
  const target = identities.value.find((item) => String(item.userId) === userId);
  const organ = target?.organName || t('MS_HDR_ORGAN_UNNAMED', '未命名机构');
  try {
    await ElMessageBox.confirm(
      t('MS_HDR_SWITCH_CONFIRM', { organ }, '切换后将关闭所有已打开的页面，确定切换到「{organ}」吗？'),
      t('MS_HDR_SWITCH_IDENTITY', '切换身份'),
      {
        type: 'warning',
        confirmButtonText: t('G2_BTN_CONFIRM', '确定'),
        cancelButtonText: t('G2_BTN_CANCEL', '取消'),
      },
    );
  } catch {
    return;
  }

  switching.value = true;
  try {
    await sso.switchToken(userId);
    window.location.assign(router.resolve('/').href);
  } catch (error) {
    const message = error instanceof Error && error.message
      ? error.message
      : t('MS_HDR_SWITCH_FAIL', '切换失败，请稍后再试');
    ElMessage.error(message);
    switching.value = false;
  }
};

// 处理用户下拉菜单命令
const handleUserCommand = (command: string) => {
  if (command === 'logout') {
    logout(router);
    return;
  }
  if (command.startsWith(SWITCH_PREFIX)) {
    void switchIdentity(command.slice(SWITCH_PREFIX.length));
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
  gap: var(--spacing-sm);
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
  height: 32px;
  border: 1px solid var(--border-color-base);
  border-radius: var(--border-radius-md);
  background-color: transparent;
  color: var(--header-text);
  padding: 0 8px;
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
  box-sizing: border-box;
  height: 32px;
  cursor: pointer;
  padding: 0 10px;
  border: 1px solid var(--border-color-base);
  border-radius: var(--border-radius-md);
  background-color: transparent;
  transition: background-color var(--transition-duration-fast) var(--transition-timing-function),
    border-color var(--transition-duration-fast) var(--transition-timing-function);
}

.user-info:hover {
  border-color: var(--color-primary);
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
  margin-left: auto;
  flex-shrink: 0;
  color: var(--color-primary);
  font-size: var(--font-size-sm);
}
</style>

<style>
/* 下拉菜单渲染在 body 下，scoped 样式不生效；固定宽度，长机构名换行而不是撑宽菜单 */
.user-menu-popper .el-dropdown-menu {
  width: 260px;
  box-sizing: border-box;
}

.user-menu-popper .user-menu-identity {
  padding: 8px 16px 10px;
  border-bottom: 1px solid var(--dropdown-border);
}

.user-menu-popper .user-menu-name {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--dropdown-text);
  word-break: break-all;
}

.user-menu-popper .user-menu-organ {
  margin-top: 2px;
  font-size: var(--font-size-xs);
  line-height: 1.5;
  color: var(--text-color-secondary);
  word-break: break-all;
}

/* 身份列表区块：自带下边框与"退出登录"分隔；列表约 5 条高度后滚动，退出登录始终可见 */
.user-menu-popper .user-menu-switch {
  border-bottom: 1px solid var(--dropdown-border);
}

.user-menu-popper .user-menu-identities {
  max-height: 260px;
  overflow-y: auto;
}

.user-menu-popper .user-menu-title {
  padding: 8px 16px 4px;
  font-size: var(--font-size-xs);
  color: var(--text-color-placeholder);
}

/* 身份项：机构名（最多两行）在上、姓名在下，勾选靠右 */
.user-menu-popper .el-dropdown-menu__item:has(.identity-text) {
  align-items: center;
  padding-top: 6px;
  padding-bottom: 6px;
  line-height: 1.4;
}

.user-menu-popper .identity-text {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
}

.user-menu-popper .identity-organ {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  font-weight: 500;
  word-break: break-all;
  white-space: normal;
}

.user-menu-popper .identity-user {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-size-xs);
  color: var(--text-color-secondary);
}

.user-menu-popper .check-icon {
  flex-shrink: 0;
  color: var(--color-primary);
}
</style>
