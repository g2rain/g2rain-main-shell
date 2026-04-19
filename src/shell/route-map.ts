import { getPathWithContextPath } from '@shared/env';
import { toRouterRecordPath } from '@shared/router-path.util';
import type { IRouteMap, ComponentLoader } from '@/runtime/router/route-map.interface';

/**
 * Shell 路由映射工具类
 *
 * 使用说明：
 * 1. 在 shell/pages 目录下创建新的 Vue 组件
 * 2. 在此文件中添加对应的路由路径到组件的映射
 * 3. 路由路径格式：/path/to/page（必须以 / 开头）
 * 4. 组件路径使用 @/shell/pages/ 别名
 *
 * 示例：
 * '/': () => import('@/shell/pages/Workspace.vue'),
 * '/home': () => import('@/shell/pages/Workspace.vue'),
 */

/**
 * Shell 路由路径到组件的映射表
 * 键：路由路径（如 '/' 或 '/home'）
 * 值：组件加载函数（返回 Promise）
 */
export const shellRouteComponentMap: Record<string, ComponentLoader> = {
  // 首页：根据 contextPath 生成 / 和 /home 对应的完整路径
  [getPathWithContextPath('/')]: () => import('@/shell/pages/Workspace.vue'),
  [getPathWithContextPath('/home')]: () => import('@/shell/pages/Workspace.vue'),

  // 可以在这里添加更多 shell 路由映射
  // '/main/example': () => import('@/shell/pages/Example.vue'),
};

/**
 * 根据路由路径获取 Shell 组件加载函数
 * @param routePath 路由路径（如 '/' 或 '/home'）
 * @returns 组件加载函数，如果路径不存在则返回 undefined
 */
export function getShellRouteComponent(routePath: string): ComponentLoader | undefined {
  return shellRouteComponentMap[routePath];
}

/**
 * 检查 Shell 路由路径是否已注册
 * @param routePath 路由路径
 * @returns 是否已注册
 */
export function hasShellRouteComponent(routePath: string): boolean {
  return routePath in shellRouteComponentMap;
}

/**
 * 获取所有已注册的 Shell 路由路径
 * @returns 路由路径数组
 */
export function getAllShellRoutePaths(): string[] {
  return Object.keys(shellRouteComponentMap);
}

/**
 * 将 Shell 路由映射转换为路由配置数组
 * @returns 路由配置数组
 */
export function getShellRoutes(): import('vue-router').RouteRecordRaw[] {
  const routes = Object.entries(shellRouteComponentMap).map(([fullPath, component]) => {
    const path = toRouterRecordPath(fullPath);
    return {
      path,
      name: path?.replace(/\/([a-zA-Z0-9])/g, (_, c) => c.toUpperCase()) || 'Home',
      component,
      meta: {
        title:
          fullPath === getPathWithContextPath('/') ||
          fullPath === getPathWithContextPath('/home')
            ? '首页'
            : '',
        requiresAuth: true,
      },
    };
  });

  console.log('[ShellRouteMap] getShellRoutes 注册的 Shell 路由:', routes);
  console.log('[ShellRouteMap] shellRouteComponentMap 原始映射:', shellRouteComponentMap);

  return routes;
}

/**
 * Shell 路由映射适配器，实现 IRouteMap 接口
 */
export const shellRouteMap: IRouteMap = {
  getRouteComponent: getShellRouteComponent,
  hasRouteComponent: hasShellRouteComponent,
  getAllRoutePaths: getAllShellRoutePaths,
  getRouteMap: () => shellRouteComponentMap,
};
