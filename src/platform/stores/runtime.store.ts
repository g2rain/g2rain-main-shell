import { defineStore } from 'pinia';
import { QiankunManager } from '@/platform/apps';
import type { AppManager } from '@/platform/apps/app-manager.type';
import type { MicroAppMessageUnion } from '@/components/micro-app';
import type { AppDefinition, RuntimeInstance, TabClass } from '@platform/types';
import { useTabStore } from '@platform/stores/tab.store';
import { useAccessTokenStore } from '@platform/stores/token.store';
import { useLocaleStore } from '@platform/stores/locale.store';
import { buildSubAppLocaleProps } from '@platform/locale';
import { decodeProtectedHeader } from 'jose';
import { getMainPlatform } from '../main-platform';
import { isLegacyApplication } from '../legacy';
import { clearPendingAuthForInstance } from '@/components/micro-app';
import { createInstanceQueue } from '../apps/instance-queue';

const microInstanceQueue = createInstanceQueue();
function enqueueMicroInstanceOp(instanceId: string, op: () => Promise<void>): Promise<void> {
  return microInstanceQueue.enqueue(instanceId, op);
}

export const useRuntimeStore = defineStore('runtime', {
  state: () => ({
    instances: new Map<string, RuntimeInstance>(),
    manager: null as AppManager | null,
    currentInstanceId: null as string | null,
    pendingLastActivePaths: {} as Record<string, string>,
  }),

  getters: {
    getManager(state): AppManager {
      if (!state.manager) {
        state.manager = new QiankunManager();
      }
      return state.manager;
    },

    allInstances(state): RuntimeInstance[] {
      return Array.from(state.instances.values());
    },

    getInstanceById: (state) => (instanceId: string): RuntimeInstance | undefined => {
      return state.instances.get(instanceId);
    },

    getInstanceByTabKey: (state) => (tabKey: string): RuntimeInstance | undefined => {
      return Array.from(state.instances.values()).find(
        (instance) => instance.tabKey === tabKey,
      );
    },

    getInstancesByAppKey: (state) => (appKey: string): RuntimeInstance[] => {
      return Array.from(state.instances.values()).filter(
        (instance) => instance.app.appKey === appKey,
      );
    },

    getInstancesByAppName: (state) => (appName: string): RuntimeInstance[] => {
      return Array.from(state.instances.values()).filter(
        (instance) => instance.app.name === appName,
      );
    },

    currentInstance(state): RuntimeInstance | null {
      if (!state.currentInstanceId) return null;
      return state.instances.get(state.currentInstanceId) || null;
    },
  },

  actions: {
    /**
     * 核心公开 props 经 buildPublicProps（无 Token）；legacy 仅边缘注入 Token。
     */
    buildInstanceFromTab(tab: TabClass): RuntimeInstance | null {
      if (!tab.isSubTab() || !tab.app) {
        return null;
      }

      const instanceId = tab.key;
      const app = tab.app;

      if (!app.entry) {
        console.error('[RuntimeStore] 子应用 entry 为空，跳过挂载:', app);
        return null;
      }

      const containerId = `sub-app-container-${tab.key}`;

      const lastActivePath = this.getLastActivePath(instanceId);
      let initialRoute = tab.initialPath || undefined;
      if (lastActivePath) {
        initialRoute = lastActivePath || '/';
        console.log(
          `[RuntimeStore] 从 lastActivePath 提取子应用路由: ${lastActivePath} -> ${initialRoute}`,
        );
      }

      const entryOrigin: string = app.entry;
      const localeStore = useLocaleStore();
      const localeProps = buildSubAppLocaleProps(localeStore.locale) ?? {};

      const main = getMainPlatform();
      const publicProps = main.buildPublicProps(
        {
          applicationCode: app.applicationCode,
          viewId: tab.key,
          instanceId,
          mode: 'integrated',
          contextPath: app.activeRule || '/',
          ...(initialRoute ? { initialRoute } : {}),
          ...(localeStore.locale ? { locale: localeStore.locale } : {}),
        },
        {
          activeRule: app.activeRule,
          entryOrigin,
        },
      );

      let props: Record<string, unknown> = {
        mainAppInfo: { name: '主应用' },
        ...publicProps,
        ...localeProps,
      };

      if (isLegacyApplication(app.applicationCode)) {
        const tokenStore = useAccessTokenStore();
        if (tokenStore.tokenString && tokenStore.token) {
          let tokenKid: string | undefined;
          try {
            const header = decodeProtectedHeader(tokenStore.tokenString);
            tokenKid = header.kid || undefined;
          } catch (error) {
            console.warn('[RuntimeStore] 解析 tokenKid 失败:', error);
          }
          props = {
            ...props,
            token: tokenStore.tokenString,
            tokenKid,
            client: tokenStore.client || undefined,
          };
        }
      }

      return {
        instanceId,
        tabKey: tab.key,
        app,
        containerId,
        status: 'created',
        props,
      };
    },

    pushLocaleToSubApps() {
      const localeStore = useLocaleStore();
      const localeProps = buildSubAppLocaleProps(localeStore.locale);
      if (!localeProps) {
        return;
      }

      const manager = this.getManager as QiankunManager;
      manager.setGlobalProps(localeProps);

      for (const instance of this.allInstances) {
        if (!instance.app?.appKey) {
          continue;
        }
        instance.props = { ...instance.props, ...localeProps };
        if (
          instance.status === 'mounted' ||
          instance.status === 'inactive' ||
          instance.status === 'loading'
        ) {
          void manager.updateInstanceProps(instance.instanceId, localeProps);
          try {
            void getMainPlatform().notifyLocale(instance.instanceId, localeStore.locale);
          } catch {
            // Main platform may not have snapshot yet
          }
        }
      }
    },

    addInstance(instance: RuntimeInstance) {
      this.instances.set(instance.instanceId, instance);
      console.log(`[RuntimeStore] 已添加运行时实例: ${instance.instanceId}`);
    },

    removeInstance(instanceId: string) {
      const removed = this.instances.delete(instanceId);
      if (removed) {
        console.log(`[RuntimeStore] 已移除运行时实例: ${instanceId}`);
      } else {
        console.warn(`[RuntimeStore] 运行时实例不存在: ${instanceId}`);
      }

      if (this.currentInstanceId === instanceId) {
        const tabStore = useTabStore();
        const activeTab = tabStore.activeTab;
        if (activeTab?.isSubTab()) {
          this.currentInstanceId = activeTab.key;
        } else {
          this.currentInstanceId = null;
        }
      }
    },

    updateInstanceStatus(instanceId: string, status: RuntimeInstance['status']) {
      const instance = this.instances.get(instanceId);
      if (instance) {
        this.instances.set(instanceId, {
          ...instance,
          status,
        });
        console.log(`[RuntimeStore] 已更新实例状态: ${instanceId} => ${status}`);
      } else {
        console.warn(`[RuntimeStore] 运行时实例不存在: ${instanceId}`);
      }
    },

    setLastActivePath(instanceId: string, path: string) {
      const instance = this.instances.get(instanceId);
      if (instance) {
        this.instances.set(instanceId, { ...instance, lastActivePath: path });
        delete this.pendingLastActivePaths[instanceId];
        return;
      }
      this.pendingLastActivePaths[instanceId] = path;
    },

    getLastActivePath(instanceId: string): string | undefined {
      return (
        this.instances.get(instanceId)?.lastActivePath ??
        this.pendingLastActivePaths[instanceId]
      );
    },

    clear() {
      this.instances.clear();
      this.pendingLastActivePaths = {};
      this.currentInstanceId = null;
      microInstanceQueue.clearAll();
      console.log('[RuntimeStore] 已清空所有运行时实例');
    },

    syncMicroInstanceOps(instanceId: string): Promise<void> {
      return enqueueMicroInstanceOp(instanceId, async () => { });
    },

    registerApp(app: AppDefinition) {
      const manager = this.getManager;
      manager.registerAppDefinition(app);
      console.log(`[RuntimeStore] 已注册微应用定义: ${app.appKey}`);
    },

    registerApps(apps: AppDefinition[]) {
      apps.forEach((app) => this.registerApp(app));
    },

    async mountApp(instance: RuntimeInstance) {
      const id = instance.instanceId;
      return enqueueMicroInstanceOp(id, async () => {
        if (!instance.app.entry) {
          console.error('[RuntimeStore] 子应用 entry 为空，拒绝挂载:', instance);
          return;
        }

        const cur = this.getInstanceById(id);
        if (cur?.status === 'mounted' || cur?.status === 'inactive') {
          return;
        }

        try {
          this.addInstance(instance);
          this.updateInstanceStatus(id, 'loading');
          const manager = this.getManager;
          await manager.mountInstance(instance);
          this.updateInstanceStatus(id, 'mounted');
          console.log(`[RuntimeStore] 已挂载实例: ${instance.instanceId}`);
        } catch (error) {
          console.error(`[RuntimeStore] 挂载实例失败: ${instance.instanceId}`, error);
          this.updateInstanceStatus(id, 'created');
          throw error;
        }
      });
    },

    async unmountApp(instanceId: string) {
      return enqueueMicroInstanceOp(instanceId, async () => {
        if (!this.getInstanceById(instanceId)) {
          return;
        }

        try {
          const manager = this.getManager;
          await manager.unmountInstance(instanceId);
          this.updateInstanceStatus(instanceId, 'unmounted');
          console.log(`[RuntimeStore] 已卸载实例: ${instanceId}`);
        } catch (error) {
          console.error(`[RuntimeStore] 卸载实例失败: ${instanceId}`, error);
          const instance = this.getInstanceById(instanceId);
          if (instance) {
            this.updateInstanceStatus(instanceId, 'unmounted');
          }
          throw error;
        }
      });
    },

    async remountApp(instanceId: string) {
      return enqueueMicroInstanceOp(instanceId, async () => {
        const instance = this.instances.get(instanceId);
        if (!instance) {
          console.warn(`[RuntimeStore] 运行时实例不存在，无法重新挂载: ${instanceId}`);
          return;
        }

        try {
          this.updateInstanceStatus(instanceId, 'loading');
          const manager = this.getManager;
          await manager.mountInstance(instance);
          this.updateInstanceStatus(instanceId, 'mounted');
          console.log(`[RuntimeStore] 已重新挂载实例: ${instanceId}`);
        } catch (error) {
          console.error(`[RuntimeStore] 重新挂载实例失败: ${instanceId}`, error);
          this.updateInstanceStatus(instanceId, 'unmounted');
          throw error;
        }
      });
    },

    async destroyApp(instanceId: string) {
      return enqueueMicroInstanceOp(instanceId, async () => {
        const manager = this.getManager;
        await manager.destroyInstance(instanceId);
        try {
          getMainPlatform().releaseInstance(instanceId);
        } catch {
          // ignore if platform not ready
        }
        clearPendingAuthForInstance(instanceId);
        this.removeInstance(instanceId);
        console.log(`[RuntimeStore] 已销毁实例: ${instanceId}`);
      });
    },

    async updateInstanceProps(instanceId: string, props: Readonly<Record<string, unknown>>) {
      return enqueueMicroInstanceOp(instanceId, async () => {
        const manager = this.getManager as QiankunManager;
        await manager.updateInstanceProps(instanceId, props as Record<string, unknown>);
        const instance = this.instances.get(instanceId);
        if (instance) {
          instance.props = { ...instance.props, ...props };
        }
      });
    },

    emitEvent(message: MicroAppMessageUnion) {
      const manager = this.getManager;
      manager.emitEvent(message);
    },

    initEventListeners() {
      const manager = this.getManager;
      manager.initEventListeners();
      console.log('[RuntimeStore] 事件监听器已初始化');
    },

    cleanupEventListeners() {
      const manager = this.getManager;
      manager.cleanupEventListeners();
      console.log('[RuntimeStore] 事件监听器已清理');
    },
  },
});
