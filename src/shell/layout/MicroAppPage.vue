<template>
  <!-- 子应用挂载容器（每个子应用独立容器，避免冲突） -->
  <div :id="containerId" class="sub-app-container"></div>
</template>

<script setup lang="ts">
import type { AppDefinition } from '@platform/types';

// 接收父组件传递的子应用信息
const props = defineProps<{
  appKey: string; // Tab的key（与 menuItem key 一致）
  app: AppDefinition; // 微应用定义信息
  initialPath?: string; // 子应用初始内部路径（如 '/dict'）
}>();

// 生成唯一容器 ID（避免多个 TabTypes 容器冲突）
const containerId = `sub-app-container-${props.appKey}`;
</script>

<style scoped>
.sub-app-container {
  width: 100%;
  height: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  overflow: visible; /* 允许内容溢出，由父容器处理滚动 */
}

/* 确保 qiankun 包装器也有正确的高度 */
:deep([id^='__qiankun_microapp_wrapper_']) {
  width: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  overflow: visible; /* 允许内容溢出，由父容器处理滚动 */
}
</style>
