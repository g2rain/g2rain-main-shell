/**
 * 菜单相关 API
 */

import type { MenuItem, MenuItemType } from '@platform/types';
import type { AuthorityMenuVo } from './menu.type';
import { env } from '@shared/env';
import { getHttpClient } from '@/components/http';

/**
 * 开发环境：按子应用 `applicationCode` 覆盖菜单里的 `endpointUrl`（本地联调）
 * - 仅本地 `vite` 开发模式（`import.meta.env.MODE === 'development'`）时生效
 * - key 须与后端 `AuthorityMenuVo.applicationCode` 一致
 * - 生产构建仍使用接口返回的 `endpointUrl`
 */
export const DEV_SUB_APP_ENTRY_BY_APPLICATION_CODE: Record<string, string> = {
  // 示例：'g2rain-manager-app': 'http://localhost:3001/manager/',
  'g2rain-manager-app': '//localhost:3001',
};

function resolveSubAppEntryInDev(
  applicationCode: string,
  serverEndpointUrl: string | undefined,
): string | undefined {
  if (import.meta.env.MODE === 'development') {
    const override = DEV_SUB_APP_ENTRY_BY_APPLICATION_CODE[applicationCode];
    if (override) {
      return override;
    }
  }
  const trimmed = serverEndpointUrl?.trim();
  return trimmed || undefined;
}

/**
 * 将服务器返回的菜单数据转换为前端使用的菜单项
 * @param serverMenu 服务器返回的菜单数据
 * @returns 前端菜单项
 */
function convertMenuToMenuItem(serverMenu: AuthorityMenuVo): MenuItem {
  // 判断 type
  let type: MenuItemType;
  if (serverMenu.applicationCode === env.VITE_APPLICATION_CODE) {
    type = 'main';
  } else if (!serverMenu.linkPath || serverMenu.linkPath.trim() === '') {
    type = 'group';
  } else {
    type = 'sub';
  }

  const menuItem: MenuItem = {
    key: String(serverMenu.id),
    title: serverMenu.menuName,
    type,
  };

  // 根据 type 设置不同的字段
  if (type === 'main') {
    // 主应用页面路由
    if (serverMenu.linkPath) {
      menuItem.routePath = serverMenu.linkPath;
    }
  } else if (type === 'sub') {
    // 子应用相关字段
    menuItem.name = serverMenu.applicationCode;
    if (serverMenu.contextPath) {
      menuItem.activeRule = serverMenu.contextPath;
    }
    const entry = resolveSubAppEntryInDev(
      serverMenu.applicationCode,
      serverMenu.endpointUrl || undefined,
    );
    if (entry) {
      menuItem.entry = entry;
    }
    if (serverMenu.linkPath) {
      menuItem.routePath = serverMenu.linkPath;
    }
  }

  // 递归处理子菜单
  if (serverMenu.subMenus && serverMenu.subMenus.length > 0) {
    menuItem.children = serverMenu.subMenus.map((subMenu) => convertMenuToMenuItem(subMenu));
  }

  return menuItem;
}

/**
 * 从后端获取菜单列表
 * @returns 菜单项列表
 */
export async function getMenuList(): Promise<MenuItem[]> {
  try {
    const httpClient = getHttpClient('default');
    const res = await httpClient.get<AuthorityMenuVo[]>('/basis/authority/menus', undefined, {
      headers: {
        // 'x-g2rain-mock': 'true',
      },
    });
    
    // 将服务器返回的数据转换为前端使用的格式
    const serverMenus = res.data || [];
    return serverMenus.map((menu) => convertMenuToMenuItem(menu));
  } catch (error) {
    console.warn('[MenuAPI] 获取菜单列表失败:', error);
    throw error;
  }
}
