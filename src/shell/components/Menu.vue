<!-- src/shell/components/Menu.vue -->
<template>
  <el-menu :default-active="activeKey" class="app-menu" mode="vertical" @select="handleMenuSelect">
    <MenuItemComponent v-for="item in menuItems" :key="item.key" :menu-item="item" />
  </el-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTabStore } from '@platform/stores';
import type { MenuItem } from '@platform/types';
import MenuItemComponent from './MenuItem.vue';

// 1. 接收父组件传递的参数
const props = defineProps<{
  menuItems: MenuItem[]; // 当前层级的菜单数组（根菜单/子菜单）
  activeTabKey: string; // 当前激活的 TabTypes Key（用于菜单高亮）
}>();

// 依赖注入
const route = useRoute();
const tabStore = useTabStore();

// 计算当前激活的菜单（根据当前路由或激活的 TabTypes）
const activeKey = computed(() => {
  // 优先匹配当前激活的 TabTypes key
  if (tabStore.activeTabKey) return tabStore.activeTabKey;
  // 否则匹配当前路由路径（主应用页面）
  return route.path;
});

// 菜单点击事件：根据类型添加对应的 TabTypes
const handleMenuSelect = (key: string) => {
  // 根据 key 找到当前点击的菜单配置（递归查找，支持多级）
  const findMenuItem = (items: MenuItem[], targetKey: string): MenuItem | null => {
    for (const item of items) {
      if (item.key === targetKey) return item;
      if (item.children) {
        const childItem = findMenuItem(item.children, targetKey);
        if (childItem) return childItem;
      }
    }
    return null;
  };

  const menuItem = findMenuItem(props.menuItems, key);
  if (!menuItem) return;

  // 菜单分组（type='group'）：不执行任何操作，仅用于菜单分组
  if (menuItem.type === 'group') {
    return;
  }

  // 统一由 tabStore 根据菜单项类型自动判断并添加 TabTypes
  // 路由跳转和地址栏修改由 TabBar.vue 的 watch(activeTabKey) 统一处理
  tabStore.addTabFromMenuItem(menuItem);
};
</script>

<style scoped>
.app-menu {
  width: var(--sidebar-width);
  border-right: 1px solid var(--sidebar-border);
  background-color: var(--sidebar-bg);
}

/* 一级子菜单项样式 */
.app-menu :deep(.el-sub-menu .el-menu-item) {
  padding-left: 40px !important;
}

/* 二级子菜单项样式 */
.app-menu :deep(.el-sub-menu .el-sub-menu .el-menu-item) {
  padding-left: 60px !important;
}

/* 三级及以上子菜单项样式 */
.app-menu :deep(.el-sub-menu .el-sub-menu .el-sub-menu .el-menu-item) {
  padding-left: 80px !important;
}

/* 子菜单图标样式 */
.app-menu :deep(.el-sub-menu .el-menu-item .el-icon),
.app-menu :deep(.el-menu-item .el-icon) {
  margin-right: var(--spacing-sm);
}

.app-menu :deep(.el-sub-menu__title .el-icon) {
  margin-right: var(--spacing-sm);
}

/* 激活菜单项样式 */
.app-menu :deep(.el-menu-item.is-active) {
  color: var(--sidebar-menu-active);
}
</style>
