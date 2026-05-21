/**
 * Runtime Store
 * 运行时实例状态管理
 *
 * 只负责：
 * - 运行时实例状态管理（app 的运行实例）
 * - 微前端管理器（QiankunManager）
 */

import { defineStore } from 'pinia';
import { QiankunManager } from '@/platform/apps';
import type { AppManager } from '@/platform/apps/app-manager.type';
import type { MicroAppMessageUnion } from '@/components/micro-app';
import type { AppDefinition, RuntimeInstance, TabClass } from '@platform/types';
import { useTabStore } from '@platform/stores/tab.store';
import { useAccessTokenStore } from '@platform/stores/token.store';
import { decodeProtectedHeader } from 'jose';

/**
 * 同一子应用实例（Tab key / instanceId）上的 mount、unmount、remount、destroy 必须串行执行，
 * 否则在 qiankun mountPromise 未结束时的切换/关闭会与 DOM、适配器 Map 产生竞态，表现为白屏。
 */
const microInstanceOpTails = new Map<string, Promise<unknown>>();
function enqueueMicroInstanceOp(instanceId: string, op: () => Promise<void>): Promise<void> {
  const prev = microInstanceOpTails.get(instanceId) ?? Promise.resolve();
  const next = prev.catch(() => { }).then(op);
  microInstanceOpTails.set(instanceId, next);
  void next.finally(() => {
    if (microInstanceOpTails.get(instanceId) === next) {
      microInstanceOpTails.delete(instanceId);
    }
  });
  return next as Promise<void>;
}

export const useRuntimeStore = defineStore('runtime', {
  state: () => ({
    /** 当前运行的运行时实例映射（instanceId -> RuntimeInstance） */
    instances: new Map<string, RuntimeInstance>(),
    /** 微前端管理器 */
    manager: null as AppManager | null,
    /**
     * 当前激活的运行时实例 ID（主应用路由时为 null）
     * 注意：首次激活子应用 tab 时，实例可能尚未创建，因此需要用 id 表达“期望激活的实例”
     */
    currentInstanceId: null as string | null,
    /** 实例尚未创建时暂存的子应用内部路径（刷新/网关恢复） */
    pendingLastActivePaths: {} as Record<string, string>,
  }),

  getters: {
    /**
     * 获取微前端管理器（懒加载）
     */
    getManager(state): AppManager {
      if (!state.manager) {
        state.manager = new QiankunManager();
      }
      return state.manager;
    },

    /**
     * 获取所有运行时实例列表
     */
    allInstances(state): RuntimeInstance[] {
      return Array.from(state.instances.values());
    },

    /**
     * 根据 instanceId 获取运行时实例
     */
    getInstanceById: (state) => (instanceId: string): RuntimeInstance | undefined => {
      return state.instances.get(instanceId);
    },

    /**
     * 根据 tabKey 获取运行时实例
     */
    getInstanceByTabKey: (state) => (tabKey: string): RuntimeInstance | undefined => {
      return Array.from(state.instances.values()).find(
        (instance) => instance.tabKey === tabKey,
      );
    },

    /**
     * 根据 appKey 获取所有运行时实例
     */
    getInstancesByAppKey: (state) => (appKey: string): RuntimeInstance[] => {
      return Array.from(state.instances.values()).filter(
        (instance) => instance.app.appKey === appKey,
      );
    },

    /**
     * 根据 app.name 获取所有运行时实例（qiankun 使用 name 作为应用唯一标识）
     */
    getInstancesByAppName: (state) => (appName: string): RuntimeInstance[] => {
      return Array.from(state.instances.values()).filter(
        (instance) => instance.app.name === appName,
      );
    },

    /**
     * 当前激活的运行时实例（若实例尚未创建则为 null）
     */
    currentInstance(state): RuntimeInstance | null {
      if (!state.currentInstanceId) return null;
      return state.instances.get(state.currentInstanceId) || null;
    },
  },

  actions: {
    /**
     * 从 TabClass 构建 RuntimeInstance
     * 统一由 runtime.store 负责实例结构和 initialRoute 计算
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

      // 从 token store 获取 token 信息
      const tokenStore = useAccessTokenStore();
      let tokenProps: Record<string, any> = {};

      if (tokenStore.tokenString && tokenStore.token) {
        let tokenKid: string | undefined;
        try {
          const header = decodeProtectedHeader(tokenStore.tokenString);
          tokenKid = header.kid || undefined;
        } catch (error) {
          console.warn('[RuntimeStore] 解析 tokenKid 失败:', error);
        }

        tokenProps = {
          token: tokenStore.tokenString,
          tokenKid,
          client: tokenStore.client || undefined,
        };
      }

      const containerId = `sub-app-container-${tab.key}`;

      // 使用 runtime 实例中记录的 lastActivePath 作为优先恢复路径
      const lastActivePath = this.getLastActivePath(instanceId);
      let initialRoute = tab.initialPath || undefined;
      if (lastActivePath) {
        initialRoute = lastActivePath || '/';
        console.log(
          `[RuntimeStore] 从 lastActivePath 提取子应用路由: ${lastActivePath} -> ${initialRoute}`,
        );
      }

      const entryOrigin: string = app.entry;

      return {
        instanceId,
        tabKey: tab.key,
        app,
        containerId,
        status: 'created',
        props: {
          mainAppInfo: { name: '主应用' },
          appKey: tab.key,
          activeRule: app.activeRule,
          entryOrigin, // 添加 entryOrigin，用于子应用的后端请求
          ...tokenProps,
          initialRoute,
        },
      };
    },
    /**
     * 添加运行时实例
     */
    addInstance(instance: RuntimeInstance) {
      this.instances.set(instance.instanceId, instance);
      console.log(`[RuntimeStore] 已添加运行时实例: ${instance.instanceId}`);

      // 如果该实例正是“期望激活”的实例，则保持 currentInstanceId 不变即可（getter 会返回它）
    },

    /**
     * 移除运行时实例
     */
    removeInstance(instanceId: string) {
      const removed = this.instances.delete(instanceId);
      if (removed) {
        console.log(`[RuntimeStore] 已移除运行时实例: ${instanceId}`);
      } else {
        console.warn(`[RuntimeStore] 运行时实例不存在: ${instanceId}`);
      }

      // 如果移除的是当前激活的 instance，清空 currentInstance
      if (this.currentInstanceId === instanceId) {
        const tabStore = useTabStore();
        const activeTab = tabStore.activeTab;
        if (activeTab?.isSubTab()) {
          // 如果还有激活的子应用 tab，切换 currentInstanceId
          this.currentInstanceId = activeTab.key;
        } else {
          // 否则设为 null（可能是主应用 tab 或没有 tab）
          this.currentInstanceId = null;
        }
      }
    },

    /**
     * 更新运行时实例状态
     */
    updateInstanceStatus(instanceId: string, status: RuntimeInstance['status']) {
      const instance = this.instances.get(instanceId);
      if (instance) {
        // 创建新对象以确保响应式更新
        this.instances.set(instanceId, {
          ...instance,
          status,
        });
        console.log(`[RuntimeStore] 已更新实例状态: ${instanceId} => ${status}`);
      } else {
        console.warn(`[RuntimeStore] 运行时实例不存在: ${instanceId}`);
      }
    },

    /**
     * 记录子应用 Tab 失去焦点时的完整路径（用于恢复子应用内部路由）
     */
    setLastActivePath(instanceId: string, path: string) {
      const instance = this.instances.get(instanceId);
      if (instance) {
        this.instances.set(instanceId, { ...instance, lastActivePath: path });
        delete this.pendingLastActivePaths[instanceId];
        return;
      }
      this.pendingLastActivePaths[instanceId] = path;
    },

    /**
     * 获取子应用 Tab 的最后激活路径
     */
    getLastActivePath(instanceId: string): string | undefined {
      return (
        this.instances.get(instanceId)?.lastActivePath ??
        this.pendingLastActivePaths[instanceId]
      );
    },

    /**
     * 清空所有运行时实例（登出 / 切换租户）
     */
    clear() {
      this.instances.clear();
      this.pendingLastActivePaths = {};
      this.currentInstanceId = null;
      microInstanceOpTails.clear();
      console.log('[RuntimeStore] 已清空所有运行时实例');
    },

    /**
     * 等待指定实例上已排队的微前端异步操作全部完成（不改变业务状态，仅排空队列）
     */
    syncMicroInstanceOps(instanceId: string): Promise<void> {
      return enqueueMicroInstanceOp(instanceId, async () => { });
    },

    /**
     * 注册微应用定义
     */
    registerApp(app: AppDefinition) {
      const manager = this.getManager;
      manager.registerAppDefinition(app);
      console.log(`[RuntimeStore] 已注册微应用定义: ${app.appKey}`);
    },

    /**
     * 批量注册微应用定义
     */
    registerApps(apps: AppDefinition[]) {
      apps.forEach((app) => this.registerApp(app));
    },

    /**
     * 挂载运行时实例
     */
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
          // 先添加到 store（addInstance 会更新 currentInstance）
          this.addInstance(instance);
          // 设置状态为 loading
          this.updateInstanceStatus(id, 'loading');
          // 挂载实例
          const manager = this.getManager;
          await manager.mountInstance(instance);
          // 更新状态为 mounted
          this.updateInstanceStatus(id, 'mounted');
          console.log(`[RuntimeStore] 已挂载实例: ${instance.instanceId}`);
        } catch (error) {
          console.error(`[RuntimeStore] 挂载实例失败: ${instance.instanceId}`, error);
          // 如果挂载失败，更新状态为 created（保持实例存在，但标记为未挂载）
          this.updateInstanceStatus(id, 'created');
          throw error; // 重新抛出错误，让调用者知道失败
        }

      });
    },

    /**
     * 卸载运行时实例
     */
    async unmountApp(instanceId: string) {
      return enqueueMicroInstanceOp(instanceId, async () => {
        if (!this.getInstanceById(instanceId)) {
          return;
        }

        try {
          const manager = this.getManager;
          await manager.unmountInstance(instanceId);
          // 更新状态为 unmounted
          this.updateInstanceStatus(instanceId, 'unmounted');
          console.log(`[RuntimeStore] 已卸载实例: ${instanceId}`);
        } catch (error) {
          console.error(`[RuntimeStore] 卸载实例失败: ${instanceId}`, error);
          // 即使卸载失败，也尝试更新状态（避免状态不一致）
          const instance = this.getInstanceById(instanceId);
          if (instance) {
            this.updateInstanceStatus(instanceId, 'unmounted');
          }
          throw error; // 重新抛出错误，让调用者知道失败
        }
      });
    },

    /**
     * 重新挂载已存在的运行时实例（Tab 切回时使用，避免 destroy -> reload）
     */
    async remountApp(instanceId: string) {
      return enqueueMicroInstanceOp(instanceId, async () => {
        const instance = this.instances.get(instanceId);
        if (!instance) {
          console.warn(`[RuntimeStore] 运行时实例不存在，无法重新挂载: ${instanceId}`);
          return;
        }

        try {
          // 设置状态为 loading
          this.updateInstanceStatus(instanceId, 'loading');
          const manager = this.getManager;
          await manager.mountInstance(instance);
          this.updateInstanceStatus(instanceId, 'mounted');
          console.log(`[RuntimeStore] 已重新挂载实例: ${instanceId}`);
        } catch (error) {
          console.error(`[RuntimeStore] 重新挂载实例失败: ${instanceId}`, error);
          // 如果重新挂载失败，保持 unmounted 状态
          this.updateInstanceStatus(instanceId, 'unmounted');
          throw error; // 重新抛出错误，让调用者知道失败
        }
      });
    },

    /**
     * 销毁运行时实例
     */
    async destroyApp(instanceId: string) {
      return enqueueMicroInstanceOp(instanceId, async () => {
        const manager = this.getManager;
        await manager.destroyInstance(instanceId);
        // 从 store 中移除
        this.removeInstance(instanceId);
        console.log(`[RuntimeStore] 已销毁实例: ${instanceId}`);
      });
    },

    /**
     * 发送事件到子应用
     * 直接发送一个规范化的微前端消息对象
     */
    emitEvent(message: MicroAppMessageUnion) {
      const manager = this.getManager;
      manager.emitEvent(message);
    },

    /**
     * 初始化事件监听器
     * 委托给 AppManager 处理
     * 注意：主应用不主动推送 token 更新，子应用需要时通过 REQUEST_TOKEN 事件请求
     */
    initEventListeners() {
      const manager = this.getManager;
      manager.initEventListeners();
      console.log('[RuntimeStore] 事件监听器已初始化');
    },

    /**
     * 清理事件监听器
     * 委托给 AppManager 处理
     */
    cleanupEventListeners() {
      const manager = this.getManager;
      manager.cleanupEventListeners();
      console.log('[RuntimeStore] 事件监听器已清理');
    },
  },
});
