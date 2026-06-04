<!-- src/shell/components/MenuItem.vue -->
<template>
  <!-- 有子菜单：渲染 el-sub-menu -->
  <el-sub-menu v-if="menuItem.children && menuItem.children.length > 0" :index="menuItem.key">
    <template #title>
      <el-icon :size="18"><MenuIcon /></el-icon>
      <span>{{ resolveMenuTitle(menuItem) }}</span>
    </template>
    <!-- 递归渲染子菜单项 -->
    <MenuItem v-for="child in menuItem.children" :key="child.key" :menu-item="child" />
  </el-sub-menu>

  <!-- 无子菜单：渲染 el-menu-item -->
  <el-menu-item v-else :index="menuItem.key">
    <el-icon :size="18"><MenuIcon /></el-icon>
    <span>{{ resolveMenuTitle(menuItem) }}</span>
  </el-menu-item>
</template>

<script setup lang="ts">
import { Menu as MenuIcon } from '@element-plus/icons-vue';
import type { MenuItem } from '@platform/types';
import { resolveMenuTitle } from '@platform/i18n';

defineProps<{
  menuItem: MenuItem;
}>();
</script>
