/**
 * 路由映射接口
 * 定义路由映射工具类需要实现的功能
 */

/**
 * 组件加载函数类型
 */
export type ComponentLoader = () => Promise<any>;

/**
 * 路由映射接口
 * 所有路由映射工具类都应该实现此接口
 */
export interface IRouteMap {
  /**
   * 根据路由路径获取组件加载函数
   * @param routePath 路由路径（如 '/system/user'）
   * @returns 组件加载函数，如果路径不存在则返回 undefined
   */
  getRouteComponent(routePath: string): ComponentLoader | undefined;

  /**
   * 检查路由路径是否已注册
   * @param routePath 路由路径
   * @returns 是否已注册
   */
  hasRouteComponent(routePath: string): boolean;

  /**
   * 获取所有已注册的路由路径
   * @returns 路由路径数组
   */
  getAllRoutePaths(): string[];

  /**
   * 获取路由映射表
   * @returns 路由映射表
   */
  getRouteMap(): Record<string, ComponentLoader>;
}
