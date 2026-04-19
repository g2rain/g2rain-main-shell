<template>
  <el-tabs v-model="activeTabKeyModel" type="card" closable @tab-remove="handleTabRemove">
    <el-tab-pane v-for="tab in tabs" :key="tab.key" :label="tab.title" :name="tab.key">
      <!-- 主应用页面 -->
      <template v-if="tab.type === 'main'">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </template>

      <!-- 子应用页面 -->
      <template v-else-if="tab.type === 'sub' && tab.app">
        <MicroAppPage
          :app-key="tab.key"
          :app="tab.app"
          :initial-path="tab.initialPath"
        />
      </template>
    </el-tab-pane>
  </el-tabs>
</template>

<script setup lang="ts">
import { computed, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useTabStore } from '@platform/stores';
import { useRuntimeStore } from '@platform/stores/runtime.store';
import MicroAppPage from '@/shell/layout/MicroAppPage.vue';

const router = useRouter();
const tabStore = useTabStore();
const runtimeStore = useRuntimeStore();

/** 等两帧 paint，便于子应用 DOM 提交后再检测 #app */
function waitNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

/**
 * qiankun 已注入 wrapper，但子应用 Vue 根 #app 下无子节点 —— 与「壳在、界面白屏」一致
 */
function isSubAppVueRootVisiblyEmpty(instanceId: string): boolean {
  const container = document.getElementById(`sub-app-container-${instanceId}`);
  if (!container) return false;
  const wrapper = container.querySelector('[id^="__qiankun_microapp_wrapper_"]');
  if (!wrapper) return false;
  const appRoot = container.querySelector('#app');
  if (!appRoot) return true;
  return appRoot.childElementCount === 0;
}

// 这里不要直接把 storeToRefs 的 ref 透传给 ElementPlus（它期望 string/number）
const tabs = computed(() => tabStore.tabList);
const activeTabKeyModel = computed<string>({
  get: () => tabStore.activeTabKey,
  set: (val) => {
    tabStore.setActiveTab(val);
  },
});

// 根据 activeTabKey 变化，创建 / 切换 RuntimeInstance
watch(
  () => tabStore.activeTabKey,
  async (newKey, oldKey) => {
    try {
      const oldTab = oldKey ? tabStore.getTabByKey(oldKey) : undefined;
      const newTab = newKey ? tabStore.getTabByKey(newKey) : undefined;

      // 旧 Tab 失去焦点：如果是子应用，仅记录路径，不再卸载实例（支持多 Tab 多活）
      if (oldTab?.isSubTab()) {
        try {
          const instanceId = oldTab.key;
          const currentPath = window.location.pathname;
          runtimeStore.setLastActivePath(instanceId, currentPath);
          // 将状态设置为 inactive
          const oldInstance = runtimeStore.getInstanceById(instanceId);
          if (oldInstance && oldInstance.status === 'mounted') {
            runtimeStore.updateInstanceStatus(instanceId, 'inactive');
          }
        } catch (error) {
          console.error(`[TabBar] 记录旧 Tab 路径失败: ${oldTab.key}`, error);
          // 继续执行，不阻止新 Tab 的激活
        }
      }

      // 新 Tab 被激活：如果是子应用，则创建或恢复 RuntimeInstance，并同步浏览器地址为 lastActivePath
      if (newTab?.isSubTab()) {
        try {
          const instanceId = newTab.key;

          // 1) 先从 runtime 中读取 lastActivePath，如果有则同步到浏览器地址栏
          const lastActivePath = runtimeStore.getLastActivePath(instanceId);
          if (lastActivePath) {
            const url = lastActivePath.startsWith('http')
              ? lastActivePath
              : `${window.location.origin}${lastActivePath}`;

            window.history.replaceState({ ...window.history.state || {}, microApp: true }, '', url);
          }

          // 2) 再处理实例挂载 / 重新挂载
          const existing = runtimeStore.getInstanceById(instanceId);

          if (!existing) {
            const instance = runtimeStore.buildInstanceFromTab(newTab);
            if (!instance) {
              console.warn(`[TabBar] 无法构建实例，跳过挂载: ${instanceId}`);
              return;
            }
            await runtimeStore.mountApp(instance);
            return;
          }

          // 如果实例存在，根据状态决定是重新挂载还是激活
          if (existing.status === 'unmounted') {
            await runtimeStore.remountApp(instanceId);
            return;
          }

          // 仍在创建/加载中，避免与首次 mount 竞态
          if (existing.status === 'created' || existing.status === 'loading') {
            return;
          }

          await nextTick();
          await waitNextPaint();

          if (isSubAppVueRootVisiblyEmpty(instanceId)) {
            if ((import.meta.env as any).DEV) {
              console.warn(
                `[TabBar] 子应用 #sub-app-container-${instanceId} 内 #app 无子节点，执行强制 remount`,
              );
            }
            await runtimeStore.remountApp(instanceId);
            return;
          }

          if (existing.status === 'inactive') {
            runtimeStore.updateInstanceStatus(instanceId, 'mounted');
          }
        } catch (error) {
          console.error(`[TabBar] 激活新 Tab 失败: ${newTab.key}`, error);
          // 错误已记录，不重新抛出以避免 Vue 警告
        }
      }
    } catch (e) {
      console.error('[TabBar] activeTabKey watcher 未预期的错误:', e);
      // 确保错误被完全捕获，不重新抛出
    }
  },
  { flush: 'post' },
);

/**
 * 关闭 TabTypes
 */
const handleTabRemove = async (key: string) => {
  const tab = tabStore.getTabByKey(key);
  const wasActive = tabStore.activeTabKey === key;

  // 如果是子应用 tab，先销毁对应的 RuntimeInstance
  if (tab?.isSubTab()) {
    try {
      const instanceId = tab.key;
      const instance = runtimeStore.getInstanceById(instanceId);

      if (instance) {
        // 先卸载（如果已挂载）
        if (instance.status === 'mounted') {
          await runtimeStore.unmountApp(instanceId);
        }
        // 然后销毁实例
        await runtimeStore.destroyApp(instanceId);
        console.log(`[TabBar] 已销毁子应用实例: ${instanceId}`);
      }
    } catch (error) {
      console.error(`[TabBar] 销毁子应用实例失败: ${key}`, error);
      // 继续执行，即使销毁失败也要移除 tab
    }
  }

  // 移除 tab
  tabStore.removeTab(key);

  if (!wasActive) return;

  const nextTab = tabs.value.find((tab) => tab.key === tabStore.activeTabKey);
  if (!nextTab) {
    router.push({ path: '/home' });
  }
};
</script>

<style scoped>
:deep(.el-tabs) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

:deep(.el-tabs__content) {
  flex: 1;
  overflow: visible; /* 让内容溢出，由父容器 .app-content 处理滚动 */
  display: flex;
  flex-direction: column;
  min-height: 0; /* 确保 flex 子元素可以缩小 */
}

:deep(.el-tab-pane) {
  min-height: 100%; /* 最小高度为父容器高度，但允许内容超出 */
  overflow: visible; /* 让内容溢出，由父容器处理滚动 */
  display: flex;
  flex-direction: column;
}
</style>
