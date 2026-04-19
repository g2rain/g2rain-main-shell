/**
 * 视图路由映射工具类
 *
 * 使用说明：
 * 1. 在 views 目录下创建新的 Vue 组件
 * 2. 在此文件中添加对应的路由路径到组件的映射
 * 3. 路由路径格式：/path/to/page（必须以 / 开头）
 * 4. 组件路径使用 @/views/ 别名
 *
 * 示例：
 * '/main/example/page': () => import('@/views/example/Page.vue'),
 */

import type { IRouteMap, ComponentLoader } from '@/runtime/router/route-map.interface';

/**
 * 路由路径到组件的映射表
 * 键：路由路径（如 '/system/user'）
 * 值：组件加载函数（返回 Promise）
 */
export const routeComponentMap: Record<string, ComponentLoader> = {
  // 系统设置
  '/main/passport': () => import('@/views/passport/index.vue'),

  // 可以在这里添加更多路由映射
  // '/main/example/page': () => import('@/views/example/Page.vue'),
  '/main/tenant-provision': () => import('@/views/tenant-provision/index.vue'),
};

/**
 * 根据路由路径获取组件加载函数
 * @param routePath 路由路径（如 '/system/user'）
 * @returns 组件加载函数，如果路径不存在则返回 undefined
 */
export function getRouteComponent(routePath: string): ComponentLoader | undefined {
  return routeComponentMap[routePath];
}

/**
 * 检查路由路径是否已注册
 * @param routePath 路由路径
 * @returns 是否已注册
 */
export function hasRouteComponent(routePath: string): boolean {
  return routePath in routeComponentMap;
}

/**
 * 获取所有已注册的路由路径
 * @returns 路由路径数组
 */
export function getAllRoutePaths(): string[] {
  return Object.keys(routeComponentMap);
}

/**
 * 视图路由映射适配器，实现 IRouteMap 接口
 */
export const viewsRouteMap: IRouteMap = {
  getRouteComponent,
  hasRouteComponent,
  getAllRoutePaths,
  getRouteMap: () => routeComponentMap,
};
