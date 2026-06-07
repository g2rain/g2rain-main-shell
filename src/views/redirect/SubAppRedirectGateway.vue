<!-- 子应用网关：/main/redirect/{context}/... -->
<template>
  <div class="redirect-gateway">
    <div class="loading-container">
      <div class="spinner"></div>
      <p>{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, type WatchStopHandle } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { sso } from '@runtime/auth';
import { useAccessTokenStore } from '@platform/stores/token.store';
import { useMenuStore } from '@platform/stores/menu.store';
import { useMicroAppStore } from '@platform/stores/app.store';
import { t } from '@platform/i18n';
import {
  saveReturnUrl,
  handleRedirectGatewayWhenAuthed,
} from '@runtime/navigation/sub-app-redirect';

const route = useRoute();
const router = useRouter();
const menuStore = useMenuStore();
const microAppStore = useMicroAppStore();
const message = ref(t('MS_RD_JUMP', '正在跳转...'));

const tryOpenTarget = async () => {
  if (!menuStore.initialized || !microAppStore.initialized) {
    return false;
  }
  return handleRedirectGatewayWhenAuthed(router, route.fullPath);
};

onMounted(async () => {
  const tokenStore = useAccessTokenStore();

  if (!tokenStore.isLogin) {
    message.value = t('MS_RD_JUMP_LOGIN', '正在跳转登录...');
    saveReturnUrl(route.fullPath);
    try {
      await sso.redirectToSSO();
    } catch (e) {
      console.error('[SubAppRedirectGateway] SSO 跳转失败:', e);
      message.value = t('MS_RD_JUMP_FAIL', '跳转登录失败');
    }
    return;
  }

  message.value = t('MS_RD_OPEN_APP', '正在打开应用...');
  if (await tryOpenTarget()) {
    return;
  }

  let stop: WatchStopHandle | null = null;
  stop = watch(
    () => [menuStore.initialized, microAppStore.initialized] as const,
    async ([menuReady, microReady]) => {
      if (!menuReady || !microReady) {
        return;
      }
      if (await tryOpenTarget()) {
        stop?.();
        stop = null;
      }
    },
    { immediate: true },
  );
});
</script>

<style scoped>
.redirect-gateway {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 40vh;
  text-align: center;
}

.loading-container {
  padding: var(--spacing-xl);
}

.spinner {
  border: 4px solid var(--loading-spinner-border, #f3f3f3);
  border-top: 4px solid var(--loading-spinner-active, #3498db);
  border-radius: 50%;
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
</style>
