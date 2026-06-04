<template>
  <el-tabs
    v-model="activeTabKeyModel"
    type="card"
    closable
    @tab-remove="handleTabRemove"
  >
    <el-tab-pane
      v-for="tab in tabs"
      :key="tab.key"
      :label="tabLabels[tab.key]"
      :name="tab.key"
    >
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
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useTabStore } from '@platform/stores';
import { useRuntimeStore } from '@platform/stores/runtime.store';
import { useLocaleStore } from '@platform/stores/locale.store';
import MicroAppPage from '@/shell/layout/MicroAppPage.vue';
import { QiankunManager } from '@/platform/apps';
import { wrapActiveRule } from '@/shared/url.util';
import { resolveMenuTitle } from '@platform/i18n';

const router = useRouter();
const tabStore = useTabStore();
const runtimeStore = useRuntimeStore();
const { locale: userLocale } = storeToRefs(useLocaleStore());

const tabLabels = computed(() => {
  void userLocale.value;
  const labels: Record<string, string> = {};
  for (const tab of tabStore.tabs) {
    labels[tab.key] = resolveMenuTitle(tab);
  }
  return labels;
});

/** 单调递增；每次进入 activateSubTabRuntime 都会 +1，用于作废过期的异步链 */
let latestSubTabNavSerial = 0;

/** 仍是「当前激活 Tab」且未被更新的点击作废 */
function isCurrentActivation(tabKey: string, serial: number, tabStore: ReturnType<typeof useTabStore>): boolean {
  return tabStore.activeTabKey === tabKey && serial === latestSubTabNavSerial;
}

/** 异步链已过期：若误把该 Tab 标成 mounted，降回 inactive */
function reconcileStaleActivationChain(
  tabKey: string,
  serial: number,
  tabStore: ReturnType<typeof useTabStore>,
  runtimeStore: ReturnType<typeof useRuntimeStore>): void {

  if (isCurrentActivation(tabKey, serial, tabStore)) {
    return;
  }

  const inst = runtimeStore.getInstanceById(tabKey);
  if (inst?.status === 'mounted') {
    runtimeStore.updateInstanceStatus(tabKey, 'inactive');
  }
}

async function activateSubTabRuntime(tabKey: string): Promise<void> {
  const serial = ++latestSubTabNavSerial;
  const tabStore = useTabStore();
  const runtimeStore = useRuntimeStore();

  const tab = tabStore.getTabByKey(tabKey);
  if (!tab?.isSubTab()) {
    return;
  }

  if (!isCurrentActivation(tabKey, serial, tabStore)) {
    return;
  }

  // 1) 先从 runtime 中读取 lastActivePath，如果有则同步到浏览器地址栏（须与 ROUTE_CHANGE 的 fullPath 语义一致，避免二次 replaceState 抖动）
  const lastActivePath = runtimeStore.getLastActivePath(tab.key);
  const rawPath = lastActivePath ?? tab.initialPath;
  if (rawPath) {
    const pathname = wrapActiveRule(tab.app.activeRule, rawPath);
    const url = `${window.location.origin}${pathname}`;
    window.history.replaceState({ ...window.history.state || {}, microApp: true }, '', url);
  }

  await runtimeStore.syncMicroInstanceOps(tabKey);
  if (!isCurrentActivation(tabKey, serial, tabStore)) {
    return;
  }

  let existing = runtimeStore.getInstanceById(tabKey);
  if (!existing) {
    const instance = runtimeStore.buildInstanceFromTab(tab);
    if (!instance) {
      console.warn(`[sub-tab-runtime] 无法构建实例: ${tabKey}`);
      return;
    }

    await runtimeStore.mountApp(instance);
    reconcileStaleActivationChain(tabKey, serial, tabStore, runtimeStore);
    return;
  }

  if (existing.status === 'unmounted' || existing.status === 'created'){
    await runtimeStore.remountApp(tabKey);
    reconcileStaleActivationChain(tabKey, serial, tabStore, runtimeStore);
    return;
  }

  if (existing.status === 'loading') {
    await runtimeStore.syncMicroInstanceOps(tabKey);
    if (!isCurrentActivation(tabKey, serial, tabStore)) {
      return;
    }

    existing = runtimeStore.getInstanceById(tabKey);
    if (!existing) {
      return;
    }

    if (existing.status === 'unmounted' || existing.status === 'created') {
      await runtimeStore.remountApp(tabKey);
      reconcileStaleActivationChain(tabKey, serial, tabStore, runtimeStore);
      return;
    }

    if (existing.status !== 'mounted' && existing.status !== 'inactive') {
      return;
    }
  }

  await nextTick();
  await waitNextPaint();
  if (!isCurrentActivation(tabKey, serial, tabStore)) {
    return;
  }

  if (isSubAppVueRootVisiblyEmpty(tabKey)) {
    await runtimeStore.remountApp(tabKey);
    reconcileStaleActivationChain(tabKey, serial, tabStore, runtimeStore);
    return;
  }

  const latest = runtimeStore.getInstanceById(tabKey);
  if (latest?.status === 'inactive' && isCurrentActivation(tabKey, serial, tabStore)) {
    const built = runtimeStore.buildInstanceFromTab(tab);
    const route = built?.props?.initialRoute;
    if (route != null && String(route) !== '') {
      const mgr = runtimeStore.getManager as QiankunManager;
      await mgr.updateInstanceProps(tabKey, { initialRoute: route });
      if (!isCurrentActivation(tabKey, serial, tabStore)) {
        return;
      }
    }
    runtimeStore.updateInstanceStatus(tabKey, 'mounted');
  }
}

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
  set: (val) => tabStore.setActiveTab(val),
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
        await activateSubTabRuntime(newTab.key);
        return;
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
