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
          :key="tab.key"
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
import { toRouterRecordPath } from '@shared/router-path.util';
import MicroAppPage from '@/shell/layout/MicroAppPage.vue';
import { activateSubTabRuntime } from '@/shell/layout/sub-tab-runtime';

const router = useRouter();
const tabStore = useTabStore();
const runtimeStore = useRuntimeStore();

const tabs = computed(() => tabStore.tabList);
const activeTabKeyModel = computed<string>({
  get: () => tabStore.activeTabKey,
  set: (val) => {
    tabStore.setActiveTab(val);
  },
});

watch(
  () => tabStore.activeTabKey,
  async (newKey, oldKey) => {
    try {
      const oldTab = oldKey ? tabStore.getTabByKey(oldKey) : undefined;
      const newTab = newKey ? tabStore.getTabByKey(newKey) : undefined;

      if (oldTab?.isSubTab()) {
        try {
          const instanceId = oldTab.key;
          const oldInstance = runtimeStore.getInstanceById(instanceId);
          if (oldInstance && oldInstance.status === 'mounted') {
            runtimeStore.updateInstanceStatus(instanceId, 'inactive');
          }
        } catch (error) {
          console.error(`[TabBar] 旧子 Tab 置为 inactive 失败: ${oldTab.key}`, error);
        }
      }

      if (newTab?.isSubTab()) {
        await activateSubTabRuntime(newTab.key);
        return;
      }
    } catch (e) {
      console.error('[TabBar] activeTabKey watcher 未预期的错误:', e);
    }
  },
  { flush: 'post' },
);

const handleTabRemove = async (key: string) => {
  const tab = tabStore.getTabByKey(key);
  const wasActive = tabStore.activeTabKey === key;

  if (tab?.isSubTab()) {
    try {
      const instanceId = tab.key;
      const instance = runtimeStore.getInstanceById(instanceId);

      if (instance) {
        await runtimeStore.destroyApp(instanceId);
        console.log(`[TabBar] 已销毁子应用实例: ${instanceId}`);
      }
    } catch (error) {
      console.error(`[TabBar] 销毁子应用实例失败: ${key}`, error);
    }
  }

  tabStore.removeTab(key);

  await nextTick();

  const nextKey = tabStore.activeTabKey;
  const nextTab = nextKey ? tabStore.getTabByKey(nextKey) : undefined;

  // 关闭任意 Tab 后若当前仍是子 Tab：统一再走激活链（避免 sibling 关闭后 DOM 脱节白屏）；会带来地址栏同步等副作用
  if (nextTab?.isSubTab()) {
    await activateSubTabRuntime(nextKey);
  }

  if (!wasActive) {
    return;
  }

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
