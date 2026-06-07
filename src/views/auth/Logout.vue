<!-- views/auth/Logout.vue -->
<template>
  <div class="logout-page">
    <div class="logout-container">
      <div class="logo-section">
        <h1 class="app-title">{{ $t('MS_HDR_LOGO', '谷雨开源SaaS平台') }}</h1>
        <p class="app-subtitle">{{ $t('MS_AU_LOGOUT_SUB', '企业级应用管理解决方案') }}</p>
      </div>

      <div class="content-section">
        <div class="logout-icon">
          <el-icon :size="64" color="var(--color-primary)">
            <User />
          </el-icon>
        </div>
        <h2 class="logout-title">{{ $t('MS_AU_LOGOUT_TITLE', '您已安全退出') }}</h2>
        <p class="logout-description">
          {{ $t('MS_AU_LOGOUT_DESC_PREFIX', '感谢您使用 谷雨开源SaaS平台。您的账户已在本应用退出，如果要彻底退出请访问') }}
          <a href="javascript:void(0);" class="sso-link" @click.prevent="handleGotoSsoIndex">
            {{ $t('MS_AU_IAM_LINK', '谷雨开源SaaS平台 IAM系统') }}
          </a>
          {{ $t('MS_AU_LOGOUT_DESC_SUFFIX', '，系统将在') }} {{ countdown }}
          {{ $t('MS_AU_LOGOUT_COUNTDOWN', '秒后自动跳转。') }}
        </p>
        <p class="logout-tip">
          {{ $t('MS_AU_LOGOUT_TIP', '如需继续使用，请重新登录。') }}
        </p>
      </div>

      <div class="action-section">
        <el-button type="primary" size="large" @click="handleLogin" class="login-button">
          <el-icon><Lock /></el-icon>
          {{ $t('MS_AU_RELOGIN', '重新登录') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { User, Lock } from '@element-plus/icons-vue';
import { sso } from '@runtime/auth';

const countdown = ref(5);
let timer: number | null = null;

const handleLogin = () => {
  // 跳转到 SSO 登录页面
  sso.redirectToSSO();
};

const handleGotoSsoIndex = () => {
  sso.redirectToSSOIndex();
};

onMounted(() => {
  timer = window.setInterval(() => {
    if (countdown.value > 1) {
      countdown.value -= 1;
    } else {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
      sso.redirectToSSOIndex();
    }
  }, 1000);
});

onUnmounted(() => {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
});
</script>

<style scoped>
.logout-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--bg-color-page) 0%, var(--bg-color-base) 100%);
  padding: var(--spacing-lg);
}

.logout-container {
  max-width: 500px;
  width: 100%;
  padding: var(--spacing-xl);
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  text-align: center;
}

.logo-section {
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color-base);
}

.app-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-color-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.app-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-color-secondary);
  margin: 0;
}

.content-section {
  margin: var(--spacing-xl) 0;
}

.logout-icon {
  margin-bottom: var(--spacing-lg);
  display: flex;
  justify-content: center;
}

.logout-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-color-primary);
  margin: 0 0 var(--spacing-md) 0;
}

.logout-description {
  font-size: var(--font-size-base);
  color: var(--text-color-secondary);
  line-height: 1.6;
  margin: 0 0 var(--spacing-sm) 0;
}

.logout-tip {
  font-size: var(--font-size-sm);
  color: var(--text-color-placeholder);
  margin: 0;
}

.sso-link {
  color: var(--color-primary);
  cursor: pointer;
  text-decoration: underline;
}

.action-section {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-color-base);
}

.login-button {
  width: 100%;
  padding: var(--spacing-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
}

.login-button :deep(.el-icon) {
  margin-right: var(--spacing-xs);
}
</style>
