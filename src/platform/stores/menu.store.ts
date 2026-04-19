import { defineStore } from 'pinia';
import type { MenuItem } from '@platform/types';

export const useMenuStore = defineStore('menu', {
  state: () => ({
    menuItems: [] as MenuItem[], // 菜单配置列表（不包含默认首页菜单）
    defaultMenu: null as MenuItem | null, // 默认首页菜单
    initialized: false, // 菜单是否已初始化
  }),
  getters: {
    /**
     * 获取主应用页面的菜单项
     */
    mainMenuItems(state): MenuItem[] {
      return state.menuItems.filter((item) => item.type === 'main');
      },

    /**
     * 获取所有子应用菜单项
     */
    subMenuItems(state): MenuItem[] {
      return state.menuItems.filter((item) => item.type === 'sub');
      },
  },
  actions: {
    /**
     * 初始化菜单配置
     */
    initializeFromMenu(items: MenuItem[]) {
      this.menuItems = items;
      this.initialized = true;
    },

    /**
     * 设置菜单项（别名，兼容旧代码）
     */
    setMenuItems(items: MenuItem[]) {
      this.initializeFromMenu(items);
    },

    /**
     * 设置默认首页菜单
     */
    setDefaultMenu(menu: MenuItem) {
      this.defaultMenu = menu;
    },
    
    /**
     * 重置菜单状态（用于登出）
     */
    reset() {
      this.menuItems = [];
      this.defaultMenu = null;
      this.initialized = false;
    },
  },
});
