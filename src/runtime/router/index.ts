import { watch } from 'vue';
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import type { App } from 'vue';
import { env, getRouterHistoryBase } from '@shared/env';
import {
  isPathUnderContextPath,
  resolveMenuRoutePath,
  toRouterRecordPath,
} from '@shared/router-path.util';
import { getShellRoutes } from '@/shell/route-map';
import { authRoutes } from './auth';
import { useMenuStore } from '@platform/stores/menu.store';
import { useTabStore } from '@platform/stores';
import type { MenuItem } from '@platform/types';
import type { IRouteMap } from './route-map.interface';

const routes: RouteRecordRaw[] = [
  ...authRoutes,
  ...getShellRoutes(),
  // 静默的兜底路由，只用于匹配，避免 Vue Router 警告
  {
    path: '/:pathMatch(.*)*',
    name: 'MicroAppFallback',
    component: {
      render: () => null, // 不渲染任何内容
    },
    meta: {
      microApp: true,
    },
  },
];

const createAppRouter = () => {
  // 与 vite.config base（由 VITE_CONTEXT_PATH 推导）对齐，深链刷新与静态资源一致
  return createRouter({
    history: createWebHistory(getRouterHistoryBase()),
    routes,
  });
};

const router = createAppRouter();

/**
 * 已注册的路由映射列表
 */
const registeredRouteMaps: IRouteMap[] = [];

/**
 * 注册路由映射
 * @param routeMap 路由映射实例
 */
export function registerRouteMap(routeMap: IRouteMap): void {
  if (!registeredRouteMaps.includes(routeMap)) {
    registeredRouteMaps.push(routeMap);
    console.log('[Router] 注册路由映射:', routeMap);
  }
}

/**
 * 根据路由路径查找组件加载函数
 * 按注册顺序遍历所有已注册的路由映射，返回第一个匹配的组件
 * @param routePath 路由路径
 * @returns 组件加载函数，如果未找到则返回 undefined
 */
export function findRouteComponent(routePath: string) {
  for (const routeMap of registeredRouteMaps) {
    const component = routeMap.getRouteComponent(routePath);
    if (component) {
      return component;
    }
  }
  return undefined;
}

/**
 * 从菜单项转换为路由配置
 */
function menuItemToRoute(item: MenuItem): RouteRecordRaw | null {
  if (item.type !== 'main' || !item.routePath) {
    return null;
  }

  // 根据 routePath 生成路由名称（将路径转换为驼峰命名）
  const routeName =
    item.routePath?.replace(/\/([a-zA-Z0-9])/g, (_, c) => c.toUpperCase()) || 'Home';

  // 从已注册的路由映射中查找组件
  const componentLoader = findRouteComponent(item.routePath);

  if (!componentLoader) {
    console.warn(
      `[Router] 路由 ${item.routePath} 未在任何已注册的路由映射中定义，请添加映射`,
    );
    return null;
  }

  return {
    path: toRouterRecordPath(item.routePath),
    name: routeName,
    component: componentLoader,
    meta: {
      title: item.title,
      requiresAuth: true,
    },
  };
}

/**
 * 递归收集所有主应用路由
 */
function collectMainRoutes(menuItems: MenuItem[]): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = [];

  const traverse = (items: MenuItem[]) => {
    items.forEach((item) => {
      if (item.type === 'main' && item.routePath) {
        const route = menuItemToRoute(item);
        if (route) {
          // 检查路由是否已存在（避免重复添加）
          if (!routes.some((r) => r.path === route.path)) {
            routes.push(route);
          }
        }
      }

      // 递归处理子菜单
      if (item.children && item.children.length > 0) {
        traverse(item.children);
      }
    });
  };

  traverse(menuItems);
  return routes;
}

/**
 * 初始化动态路由
 * 根据菜单数据添加主应用路由
 */
function initDynamicRoutes(): void {
  const menuStore = useMenuStore();

  if (!menuStore.initialized || menuStore.menuItems.length === 0) {
    return;
  }

  // 收集所有主应用路由
  const dynamicRoutes = collectMainRoutes(menuStore.menuItems);

  // 添加动态路由
  dynamicRoutes.forEach((route) => {
    // 检查路由是否已存在
    if (!router.getRoutes().some((r) => r.path === route.path)) {
      router.addRoute(route);
      console.log('[Router] 添加动态路由:', route.path, route.name);
    }
  });

  console.log('[Router] 动态路由初始化完成，共添加', dynamicRoutes.length, '个路由');
}

/**
 * 从菜单中查找对应的菜单项（通过 routePath 匹配）
 */
function findMenuItemByRoutePath(menuItems: MenuItem[], routePath: string): MenuItem | null {
  for (const item of menuItems) {
    if (item.routePath === routePath && item.type === 'main') {
      return item;
    }
    if (item.children && item.children.length > 0) {
      const found = findMenuItemByRoutePath(item.children, routePath);
      if (found) return found;
    }
  }
  return null;
}

export const setupRouter = (app: App<Element>) => {
  app.use(router);

  const ctx = env.VITE_CONTEXT_PATH.replace(/\/$/, '') || '';
  const defaultHomePath = '/home';
  const shellReady = () =>
    router.getRoutes().some((r) => r.path === defaultHomePath || r.path === '/');

  // 添加路由守卫，确保访问主应用路由时能正确显示页面
  router.beforeEach((to, from, next) => {
    // 先获取 store 实例
    const menuStore = useMenuStore();
    const tabStore = useTabStore();

    // 处理 context 根路径：重定向到默认工作台
    if (
      to.path === '/' ||
      to.path === env.VITE_CONTEXT_PATH ||
      to.path === `${ctx}/` ||
      to.path === ctx
    ) {
      return menuStore.initialized && shellReady() ? next({ path: defaultHomePath }) : next();
    }

    // 微应用路由(通过 MicroAppFallback 匹配)直接放行
    if (to.meta.microApp) {
      next();
      return;
    }

    // 非主应用 context 下的路径（如子应用独立前缀）直接放行
    if (!isPathUnderContextPath(to.path)) {
      next();
      return;
    }

    // 对于其他主应用路由，如果菜单已初始化，自动创建对应的 TabTypes
    if (menuStore.initialized && to.matched.length > 0) {
      const menuItem = findMenuItemByRoutePath(
        menuStore.menuItems,
        resolveMenuRoutePath(to.path),
      );
      if (menuItem && menuItem.type === 'main' && menuItem.routePath) {
        // 检查 TabTypes 是否已存在
        if (tabStore.tabs.some((t) => t.key === menuItem.key)) {
          // TabTypes 已存在，激活它
          tabStore.setActiveTab(menuItem.key);
        } else {
          tabStore.addMainTab(menuItem.key, menuItem.title, menuItem.routePath);
        }
      }
    }

    next();
  });

  // 在 setupRouter 内部初始化动态路由监听（确保 Pinia 已初始化）
  const menuStore = useMenuStore();

  watch(
    () => menuStore.initialized,
    (initialized) => {
      if (!initialized) {
        return;
      }

      initDynamicRoutes();

      const { path } = router.currentRoute.value;
      const atShellEntry =
        path === '/' ||
        path === env.VITE_CONTEXT_PATH ||
        path === ctx ||
        path === `${ctx}/`;
      if (!atShellEntry) {
        return;
      }

      if (!shellReady()) {
        return;
      }

      router.replace({ path: defaultHomePath, force: true });
    },
    { immediate: true },
  );
};

export default router;

