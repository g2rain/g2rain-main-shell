<template>
  <div v-if="loading" class="shell-loading">
    <el-icon class="is-loading" :size="32">
      <Loading />
    </el-icon>
    <p v-if="text" class="loading-text">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
import { Loading } from '@element-plus/icons-vue';

defineProps<{
  loading: boolean;
  text?: string;
}>();
</script>

<style scoped>
.shell-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
}

.is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin-top: var(--spacing-md);
  color: var(--text-color-secondary);
  font-size: var(--font-size-sm);
}
</style>
