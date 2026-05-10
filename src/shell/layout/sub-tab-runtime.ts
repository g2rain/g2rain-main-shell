/**
 * 子应用 Tab 运行时激活（单一路径）
 *
 * 快速连点菜单：多条 activate 异步链并发，仅用 activeTabKey 无法区分「同一 Tab 被新一轮点击取代」。
 * 使用全局 serial：仅「最后一次发起的激活」允许写地址栏并在 await 后继续收尾。
 */

import { nextTick } from 'vue';
import type { AppDefinition, TabClass } from '@platform/types';
import { useTabStore } from '@platform/stores/tab.store';
import { useRuntimeStore } from '@platform/stores/runtime.store';
import { QiankunManager } from '@/platform/apps';
import { toShellPath } from '@shared/sub-app-path';

/** 单调递增；每次进入 activateSubTabRuntime 都会 +1，用于作废过期的异步链 */
let latestSubTabNavSerial = 0;

function waitNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

/** qiankun 已注入 wrapper，但子应用 Vue 根 #app 下无子节点 —— 与「壳在、界面白屏」一致 */
function isSubAppVueRootVisiblyEmpty(instanceId: string): boolean {
  const container = document.getElementById(`sub-app-container-${instanceId}`);
  if (!container) return false;
  const wrapper = container.querySelector('[id^="__qiankun_microapp_wrapper_"]');
  if (!wrapper) return false;
  const appRoot = container.querySelector('#app');
  if (!appRoot) return true;
  return appRoot.childElementCount === 0;
}

function getSubTabShellPath(
  tab: TabClass & { type: 'sub'; app: AppDefinition },
  runtimeStore: ReturnType<typeof useRuntimeStore>,
): string {
  const stored = runtimeStore.getLastActivePath(tab.key);
  const seed = stored ?? tab.initialPath ?? '/';
  return toShellPath(tab.app.activeRule, seed);
}

function replaceSubTabAddressBar(
  tab: TabClass & { type: 'sub'; app: AppDefinition },
  runtimeStore: ReturnType<typeof useRuntimeStore>,
): void {
  const path = getSubTabShellPath(tab, runtimeStore);
  const url = `${window.location.origin}${path}`;
  window.history.replaceState({ ...(window.history.state || {}), microApp: true }, '', url);
}

/** 仍是「当前激活 Tab」且未被更新的点击作废 */
function isCurrentActivation(
  tabKey: string,
  serial: number,
  tabStore: ReturnType<typeof useTabStore>,
): boolean {
  return tabStore.activeTabKey === tabKey && serial === latestSubTabNavSerial;
}

/** 异步链已过期：若误把该 Tab 标成 mounted，降回 inactive */
function reconcileStaleActivationChain(
  tabKey: string,
  serial: number,
  tabStore: ReturnType<typeof useTabStore>,
  runtimeStore: ReturnType<typeof useRuntimeStore>,
): void {
  if (isCurrentActivation(tabKey, serial, tabStore)) {
    return;
  }
  const inst = runtimeStore.getInstanceById(tabKey);
  if (inst?.status === 'mounted') {
    runtimeStore.updateInstanceStatus(tabKey, 'inactive');
  }
}

export async function activateSubTabRuntime(tabKey: string): Promise<void> {
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

  replaceSubTabAddressBar(tab, runtimeStore);

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

  if (existing.status === 'unmounted' || existing.status === 'created') {
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
