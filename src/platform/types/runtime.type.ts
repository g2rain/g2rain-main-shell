import type { AppDefinition } from './app.type';

/**
 * 微前端运行时类型
 */
export type RuntimeType = 'qiankun' | 'wujie' | 'iframe';

/**
 * 子应用运行实例（Instance）
 * 一个 TabTypes 对应一个 RuntimeInstance
 */
export interface RuntimeInstance {
  /** 实例唯一标识（通常 = tab.key） */
  instanceId: string;

  /** 所属 TabTypes */
  tabKey: string;

  /** 应用定义 */
  app: AppDefinition;

  /** 容器节点 ID */
  containerId: string;

  /** 当前运行状态 */
  status: 'created' | 'loading' | 'mounted' | 'inactive' | 'unmounted';

  /**
   * 最近一次 Tab 失去焦点时记录的完整路径（仅子应用实例有意义）
   * 用于下次重新激活 Tab 时恢复子应用内部路由
   */
  lastActivePath?: string;

  /** 运行时注入能力 */
  props?: Record<string, any>;
}

/**
 * Runtime Adapter 能力定义
 * qiankun / wujie / iframe 都必须实现
 */
export interface RuntimeAdapter {
  type: RuntimeType;

  /**
   * 创建并挂载实例
   */
  mount(instance: RuntimeInstance): Promise<void>;

  /**
   * 卸载实例（但不销毁 TabTypes）
   */
  unmount(instanceId: string): Promise<void>;

  /**
   * 销毁实例（TabTypes 关闭）
   */
  destroy(instanceId: string): Promise<void>;
}
