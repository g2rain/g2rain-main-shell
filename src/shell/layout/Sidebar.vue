<template>
  <el-scrollbar class="sidebar-scrollbar">
    <Menu :menu-items="menuItems" :active-tab-key="activeTabKey" />
  </el-scrollbar>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import Menu from '@/shell/components/Menu.vue';
import { useTabStore } from '@platform/stores';
import { useMenuStore } from '@platform/stores/menu.store';

// 1. Pinia 状态（激活 TabTypes Key + 添加 TabTypes 方法）
const tabStore = useTabStore();
const menuStore = useMenuStore();
const route = useRoute();

// 从 store 中获取菜单项（computed 已实现响应式，菜单变化时自动更新）
const menuItems = computed(() => menuStore.menuItems);

// 当前激活的 Tab key（computed 响应式）
const activeTabKey = computed(() => tabStore.activeTabKey);

// 当还没有激活的 Tab 时，仅在当前已是壳默认入口路径下用 defaultMenu 补首页 Tab（深链不抢激活）
watchEffect(() => {
  if (tabStore.activeTabKey || !menuStore.defaultMenu) {
    return;
  }

  if (route.path !== '/' && route.path !== '/home') {
    return;
  }

  tabStore.addTabFromMenuItem(menuStore.defaultMenu);
  console.log(
    '[Sidebar] activeTabKey 为空，已根据 defaultMenu 自动激活首页 Tab:',
    menuStore.defaultMenu.routePath,
  );
});

</script>

<style scoped>
.sidebar-scrollbar {
  height: 100%;
  background-color: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
}
</style>
