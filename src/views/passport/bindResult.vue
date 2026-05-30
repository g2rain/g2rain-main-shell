<template>
  <div class="bind-result-page">
    <el-card shadow="never" class="bind-result-page__card">
      <div class="bind-result-page__icon" :class="success ? 'is-success' : 'is-error'">
        <el-icon :size="48">
          <CircleCheck v-if="success" />
          <CircleClose v-else />
        </el-icon>
      </div>
      <h2 class="bind-result-page__title">{{ title }}</h2>
      <p v-if="detail" class="bind-result-page__detail">{{ detail }}</p>
      <p v-if="errorCode" class="bind-result-page__code">错误码：{{ errorCode }}</p>
      <div class="bind-result-page__actions">
        <el-button type="primary" @click="goPassport">返回账号安全</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CircleCheck, CircleClose } from '@element-plus/icons-vue';
import { getPathWithContextPath } from '@shared/env';

const route = useRoute();
const router = useRouter();

const success = computed(() => route.query.success === '1');
const errorCode = computed(() => {
  const code = route.query.code;
  return typeof code === 'string' ? code : '';
});
const detail = computed(() => {
  const msg = route.query.message;
  if (typeof msg === 'string' && msg) {
    try {
      return decodeURIComponent(msg);
    } catch {
      return msg;
    }
  }
  return success.value ? '' : '绑定未完成，请返回账号页重新发起。';
});

const title = computed(() => (success.value ? '钉钉绑定成功' : '钉钉绑定失败'));

function goPassport() {
  router.push(getPathWithContextPath('/passport'));
}
</script>

<style scoped>
.bind-result-page {
  min-height: 100%;
  padding: 40px 20px;
  box-sizing: border-box;
  background: #f5f7fa;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.bind-result-page__card {
  width: 100%;
  max-width: 480px;
  text-align: center;
  padding: 32px 24px;
}

.bind-result-page__icon {
  margin-bottom: 16px;
}

.bind-result-page__icon.is-success {
  color: #67c23a;
}

.bind-result-page__icon.is-error {
  color: #f56c6c;
}

.bind-result-page__title {
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 600;
}

.bind-result-page__detail {
  margin: 0 0 8px;
  color: #606266;
  line-height: 1.6;
}

.bind-result-page__code {
  margin: 0 0 24px;
  font-size: 12px;
  color: #909399;
}

.bind-result-page__actions {
  display: flex;
  justify-content: center;
}
</style>
