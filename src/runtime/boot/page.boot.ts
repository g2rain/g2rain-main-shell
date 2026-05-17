/**
 * 页面资源启动服务
 * 用于从后端加载菜单、页面按钮等资源，并初始化菜单数据到 menu.store.ts
 */

import { watch } from 'vue';
import { useMenuStore } from '@platform/stores/menu.store';
import { useMicroAppStore } from '@platform/stores/app.store';
import { useAccessTokenStore } from '@platform/stores/token.store';
import { getMenuList } from '@/runtime/api/menu.api';
import type { MenuItem } from '@platform/types';

class PageBoot {
  private stopWatch: (() => void) | null = null; // watch 停止函数

  /**
   * 创建默认菜单项
   * 包含首页和初始化相关的菜单
   */
  private createDefaultMenus(): MenuItem[] {
    // 创建首页菜单项
    const homeMenu: MenuItem = {
      key: 'main',
      title: '首页',
      type: 'main',
      routePath: '/',
    };

    // 创建初始化菜单项（包含子菜单）
    const initMenu: MenuItem = {
      key: 'init',
      title: '初始化',
      type: 'group',
      children: [
        {
          key: 'init-passport',
          title: '账号管理',
          type: 'main',
          routePath: '/passport',
        },
        {
          key: 'init-tenant_provision',
          title: '租户初始化',
          type: 'main',
          routePath: '/tenant_provision',
        },
      ],
    };

    return [homeMenu, initMenu];
  }

  /**
   * 初始化菜单
   * 从后端加载菜单数据，存储到 menu.store
   */
  async initMenu(): Promise<void> {
    try {
      const tokenStore = useAccessTokenStore();
      const menuStore = useMenuStore();

      // 创建默认菜单项
      const defaultMenus = this.createDefaultMenus();
      const defaultMenu = defaultMenus[0]; // 首页菜单用于单独存储

      // 1. 检查 token 是否已初始化
      if (!tokenStore.isLogin) {
        console.warn('[PageBoot] Token 未初始化，等待 token 初始化完成...');
        return;
      }

      // 2. 如果菜单已初始化，跳过
      if (menuStore.initialized) {
        console.log('[PageBoot] 菜单已初始化，跳过');
        return;
      }

      // 3. 获取菜单列表
      const menuList = await getMenuList();

      // 4. 将默认菜单添加到菜单列表的开头
      const finalMenuList = [...defaultMenus, ...menuList];

      // 5. 存储到 menu store 中，供其他组件使用
      //    - defaultMenu：单独存储首页菜单，便于 TabBoot 等模块使用
      //    - menuItems：仅存储后端返回的菜单列表
      menuStore.setDefaultMenu(defaultMenu);
      menuStore.setMenuItems(finalMenuList);

      // 6. 初始化微应用列表（从菜单中提取微应用定义）
      const microAppStore = useMicroAppStore();
      if (!microAppStore.initialized) {
        microAppStore.initializeFromMenu(finalMenuList);
      }

      console.log('[PageBoot] 菜单和微应用列表初始化完成');
    } catch (error) {
      console.error('[PageBoot] 初始化菜单失败:', error);
      throw error;
    }
  }

  /**
   * 启动资源服务
   * 监听 token 登录状态，自动初始化菜单
   * 应该在应用启动时调用一次
   */
  start(): void {
    const tokenStore = useAccessTokenStore();
    const menuStore = useMenuStore();

    // 如果已经有 watch 在运行，先停止
    if (this.stopWatch) {
      this.stopWatch();
    }

    // 检查是否已经登录，如果已登录但菜单未加载，则先加载菜单
    if (tokenStore.isLogin && !menuStore.initialized) {
      console.log('[PageBoot] 检测到已登录但菜单未加载，立即加载菜单');
      this.initMenu().catch((error) => {
        console.error('[PageBoot] 启动时加载菜单失败:', error);
      });
    }

    // 监听 token 登录状态，当登录后自动初始化（用于处理延迟登录的场景）
    this.stopWatch = watch(
      () => tokenStore.isLogin,
      async (isLogin) => {
        if (isLogin) {
          await this.initMenu();
        }
      },
    );

    console.log('[PageBoot] 已开始监听 token 状态变化');
  }

  /**
   * 停止监听（用于清理）
   */
  stop(): void {
    if (this.stopWatch) {
      this.stopWatch();
      this.stopWatch = null;
    }
  }

  /**
   * 重置初始化状态（用于登出后重新初始化）
   */
  reset(): void {
    const menuStore = useMenuStore();
    menuStore.reset();
  }
}

export const pageBoot = new PageBoot();
