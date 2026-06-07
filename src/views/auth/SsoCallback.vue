<!-- views/auth/SsoCallback.vue -->
<template>
  <div class="sso-callback">
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p>{{ $t('MS_AU_SSO_PROC', '正在处理认证...') }}</p>
    </div>

    <div v-else-if="error" class="error-container">
      <h2>{{ $t('MS_AU_SSO_FAIL', '认证失败') }}</h2>
      <p>{{ error }}</p>
      <button class="retry-button" @click="retry">{{ $t('G2_BTN_RETRY', '重试') }}</button>
      <button class="login-button" @click="goToLogin">{{ $t('MS_AU_BACK_LOGIN', '返回登录') }}</button>
    </div>

    <div v-else class="success-container">
      <h2>{{ $t('MS_AU_SSO_OK', '认证成功') }}</h2>
      <p>{{ $t('MS_AU_SSO_REDIRECT', '正在跳转到应用...') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { sso } from '@runtime/auth';
import g2rainRouter from '@runtime/router/index.js';
import { useAccessTokenStore } from '@platform/stores/token.store.js';
import { t } from '@platform/i18n';

const isLoading = ref(true);
const error = ref<string | null>(null);

const extractCodeFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('code');
};

const extractClientIdFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('clientId');
};

const processCallback = () => {
  const accessTokenStore = useAccessTokenStore();
  accessTokenStore.status = 'SSO';
  const code = extractCodeFromUrl();
  const clientId = extractClientIdFromUrl();
  if (!code || !clientId) {
    error.value = t('MS_AU_NO_CODE', '未找到授权码或者客户端ID');
    isLoading.value = false;
    return;
  }

  // 初始化sso（同步启动，不阻塞）
  sso
    .generateToken(code)
    .then(() => g2rainRouter.replace('/home'))
      // 先进壳稳定入口，由 tab.boot / page.boot 在菜单就绪后 restoreAfterAuth 打开 return_url
    .catch((err) => {
      error.value = err instanceof Error ? err.message : t('MS_AU_SSO_ERR', '认证处理失败');
      isLoading.value = false;
    });
};

const retry = () => {
  isLoading.value = true;
  error.value = null;
  processCallback();
};

const goToLogin = () => {
  sso.redirectToSSO();
};

onMounted(() => {
  processCallback();
});
</script>

<style scoped>
.sso-callback {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  text-align: center;
  background-color: var(--bg-color-page);
}

.loading-container,
.error-container,
.success-container {
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-lg);
  background: var(--sso-container-bg);
  box-shadow: var(--shadow-base);
}

.spinner {
  border: 4px solid var(--loading-spinner-border);
  border-top: 4px solid var(--loading-spinner-active);
  border-radius: var(--border-radius-round);
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--spacing-md);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-container {
  border-left: 4px solid var(--sso-error-border);
}

.success-container {
  border-left: 4px solid var(--sso-success-border);
}

.retry-button,
.login-button {
  margin: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: opacity var(--transition-duration-fast) var(--transition-timing-function);
}

.retry-button:hover,
.login-button:hover {
  opacity: 0.8;
}

.retry-button {
  background: var(--sso-button-primary);
  color: var(--bg-color);
}

.login-button {
  background: var(--sso-button-secondary);
  color: var(--bg-color);
}
</style>
