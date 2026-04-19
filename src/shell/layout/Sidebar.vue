<template>
  <el-scrollbar class="sidebar-scrollbar">
    <Menu :menu-items="menuItems" :active-tab-key="activeTabKey" />
  </el-scrollbar>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue';
import Menu from '@/shell/components/Menu.vue';
import { useTabStore } from '@platform/stores';
import { useMenuStore } from '@platform/stores/menu.store';

// 1. Pinia 状态（激活 TabTypes Key + 添加 TabTypes 方法）
const tabStore = useTabStore();
const menuStore = useMenuStore();

// 从 store 中获取菜单项（computed 已实现响应式，菜单变化时自动更新）
const menuItems = computed(() => menuStore.menuItems);

// 当前激活的 Tab key（computed 响应式）
const activeTabKey = computed(() => tabStore.activeTabKey);

// 当还没有激活的 Tab 时，如果有 defaultMenu，则自动使用 defaultMenu 作为激活 Tab
watchEffect(() => {
  if (!tabStore.activeTabKey && menuStore.defaultMenu) {
    tabStore.addTabFromMenuItem(menuStore.defaultMenu);
    // addTabFromMenuItem 内部会设置 activeTabKey
    console.log(
      '[Sidebar] activeTabKey 为空，已根据 defaultMenu 自动激活首页 Tab:',
      menuStore.defaultMenu.routePath,
    );
  }
});

</script>

<style scoped>
.sidebar-scrollbar {
  height: 100%;
  background-color: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
}
</style>
