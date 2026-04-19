// platform/micro-frontend/micro-frontend.type.ts
/**
 * 微前端抽象类型和接口
 * 使用 runtime.type.ts 中定义的类型
 */

import type { RuntimeInstance, RuntimeAdapter, AppDefinition } from '@platform/types';
import type { EventAdapter, MicroAppMessageUnion } from '@/components/micro-app';

/**
 * 微前端管理器接口
 * 基于 RuntimeAdapter，提供更高级的管理能力
 */
export interface AppManager {
  /** 获取运行时适配器 */
  getAdapter(): RuntimeAdapter;
  /** 获取事件适配器 */
  getEventAdapter(): EventAdapter;
  /** 注册微应用定义 */
  registerAppDefinition(app: AppDefinition): void;
  /** 取消注册微应用定义 */
  unregisterAppDefinition(appKey: string): void;
  /** 创建并挂载运行时实例 */
  mountInstance(instance: RuntimeInstance): Promise<void>;
  /** 卸载运行时实例 */
  unmountInstance(instanceId: string): Promise<void>;
  /** 销毁运行时实例 */
  destroyInstance(instanceId: string): Promise<void>;
  /** 根据 tabKey 获取运行时实例 */
  getInstanceByTabKey(tabKey: string): RuntimeInstance | undefined;
  /** 根据 appKey 获取所有运行时实例 */
  getInstancesByAppKey(appKey: string): RuntimeInstance[];
  /** 获取所有运行时实例 */
  getAllInstances(): RuntimeInstance[];
  /** 设置全局 props（会传递给所有微应用） */
  setGlobalProps(props: Record<string, any>): void;
  /** 初始化事件监听器 */
  initEventListeners(): void;
  /** 清理事件监听器 */
  cleanupEventListeners(): void;
  /** 发送事件到子应用 */
  emitEvent(message: MicroAppMessageUnion): void;
}

