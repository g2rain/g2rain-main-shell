// platform/micro-frontend/micro-frontend.base.ts
/**
 * 微前端抽象基类
 * 提供公共逻辑，实现 AppManager 接口
 */

import type { AppManager } from './app-manager.type';
import type { RuntimeInstance, RuntimeAdapter, AppDefinition } from '@platform/types';
import type { EventAdapter, MicroAppMessageUnion } from '@/components/micro-app';
import { WindowEventAdapter } from '@/components/micro-app/event-windows-adapter';
import type { MicroAppMessageProcessorImpl } from '@/components/micro-app/message-processor';
import { initMicroAppMessageHandlers } from './message-handlers';
import { useMicroAppStore } from '@platform/stores/app.store';
import { useRuntimeStore } from '@platform/stores/runtime.store';

export abstract class BaseAppManager implements AppManager {
  /** 运行时适配器 */
  protected abstract adapter: RuntimeAdapter;
  /** 事件适配器 */
  protected abstract eventAdapter: EventAdapter;
  /** 全局 props */
  protected globalProps: Record<string, any> = {};

  /**
   * 获取运行时适配器
   */
  getAdapter(): RuntimeAdapter {
    return this.adapter;
  }

  /**
   * 获取事件适配器
   */
  getEventAdapter(): EventAdapter {
    return this.eventAdapter;
  }

  /**
   * 注册微应用定义
   * 微应用定义由 MicroAppStore 通过菜单初始化统一管理，这里保留空实现仅满足接口约束。
   */
  registerAppDefinition(_app: AppDefinition): void {
    // no-op
  }

  /**
   * 取消注册微应用定义
   */
  unregisterAppDefinition(appKey: string): void {
    // 先销毁所有相关实例
    const instances = this.getInstancesByAppKey(appKey);
    instances.forEach((instance) => {
      this.destroyInstance(instance.instanceId);
    });
    // 不再删除微应用定义：微应用定义由 MicroAppStore 管理且不支持运行时删除
  }

  /**
   * 创建并挂载运行时实例
   */
  async mountInstance(instance: RuntimeInstance): Promise<void> {
    // 检查应用定义是否存在
    const microAppStore = useMicroAppStore();
    const appDef = microAppStore.getAppByKey(instance.app.appKey);
    if (!appDef) {
      throw new Error(
        `[BaseAppManager] 应用定义不存在，无法挂载实例: ${instance.app.appKey}`,
      );
    }

    // 更新实例 props（状态由 runtime.store 统一管理）
    instance.props = { ...this.globalProps, ...instance.props };

    // 调用适配器挂载
    await this.adapter.mount(instance);
    // 注意：状态更新由 runtime.store 统一管理，这里不再直接修改 status

    console.log(`[BaseAppManager] 已挂载实例: ${instance.instanceId}`);
  }

  /**
   * 卸载运行时实例
   */
  async unmountInstance(instanceId: string): Promise<void> {
    const runtimeStore = useRuntimeStore();
    const instance = runtimeStore.getInstanceById(instanceId);
    if (!instance) {
      console.warn(`[BaseAppManager] 实例不存在: ${instanceId}`);
      return;
    }

    await this.adapter.unmount(instanceId);
    // 注意：状态更新由 runtime.store 统一管理，这里不再直接修改 status

    console.log(`[BaseAppManager] 已卸载实例: ${instanceId}`);
  }

  /**
   * 销毁运行时实例
   */
  async destroyInstance(instanceId: string): Promise<void> {
    const runtimeStore = useRuntimeStore();
    const instance = runtimeStore.getInstanceById(instanceId);
    if (!instance) {
      console.warn(`[BaseAppManager] 实例不存在: ${instanceId}`);
      return;
    }

    // 任一已进入 qiankun 生命周期或仍持有 DOM 的状态，都必须先走完整 unmount（仅 mounted 会漏掉 loading / inactive）
    const needsQiankunUnmount =
      instance.status === 'mounted' ||
      instance.status === 'loading' ||
      instance.status === 'inactive';
    if (needsQiankunUnmount) {
      await this.unmountInstance(instanceId);
    }

    // 调用适配器销毁
    await this.adapter.destroy(instanceId);

    // 清空容器内容
    const container = document.querySelector(`#${instance.containerId}`);
    if (container) {
      container.innerHTML = '';
      console.log(`[BaseAppManager] 已清空容器: ${instance.containerId}`);
    }
  }

  /**
   * 根据 tabKey 获取运行时实例
   */
  getInstanceByTabKey(tabKey: string): RuntimeInstance | undefined {
    const runtimeStore = useRuntimeStore();
    return runtimeStore.getInstanceByTabKey(tabKey);
  }

  /**
   * 根据 appKey 获取所有运行时实例
   */
  getInstancesByAppKey(appKey: string): RuntimeInstance[] {
    const runtimeStore = useRuntimeStore();
    return runtimeStore.getInstancesByAppKey(appKey);
  }

  /**
   * 获取所有运行时实例
   */
  getAllInstances(): RuntimeInstance[] {
    const runtimeStore = useRuntimeStore();
    return runtimeStore.allInstances;
  }

  /**
   * 设置全局 props
   */
  setGlobalProps(props: Record<string, any>): void {
    this.globalProps = { ...this.globalProps, ...props };
    // 更新所有已挂载实例的 props
    const runtimeStore = useRuntimeStore();
    runtimeStore.allInstances.forEach((instance) => {
      if (instance.status === 'mounted' && instance.props) {
        instance.props = { ...instance.props, ...this.globalProps };
      }
    });
    console.log('[BaseAppManager] 已更新全局 props');
  }

  /**
   * 初始化事件监听器
   * - 由 EventAdapter 完成底层 window 事件绑定
   * - 从 EventAdapter 获取 MicroAppMessageProcessorImpl
   * - 调用 initMicroAppMessageHandlers 完成处理器和 EventAdapter 的初始化
   */
  initEventListeners(): void {
    // 先让事件适配器完成底层 window 事件绑定
    this.eventAdapter.initEventListeners();

    const eventAdapter = this.getEventAdapter() as WindowEventAdapter;
    const messageProcessor =
      eventAdapter.getMessageProcessor?.() as MicroAppMessageProcessorImpl | undefined;

    if (messageProcessor) {
      initMicroAppMessageHandlers(messageProcessor, this.eventAdapter);
    } else {
      console.warn('[BaseAppManager] 无法获取 messageProcessor，路由变化监听未初始化');
    }
  }

  /**
   * 清理事件监听器
   */
  cleanupEventListeners(): void {
    this.eventAdapter.cleanupEventListeners();
  }

  /**
   * 发送事件到子应用
   */
  emitEvent(message: MicroAppMessageUnion): void {
    this.eventAdapter.emitEvent(message);
  }
}
