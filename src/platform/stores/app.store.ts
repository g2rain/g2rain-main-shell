/**
 * 微应用 Store
 * 管理微应用定义列表
 */

import { defineStore } from 'pinia';
import type { AppDefinition, MenuItem } from '@platform/types';
import { joinUrlSegments } from '@shared/url.util';

export const useMicroAppStore = defineStore('microApp', {
  state: () => ({
    apps: [] as AppDefinition[], // 微应用定义列表
    initialized: false, // 是否已初始化
  }),
  getters: {
    /**
     * 根据 appKey 获取微应用配置
     */
    getAppByKey: (state) => (appKey: string): AppDefinition | undefined => {
      return state.apps.find((app) => app.appKey === appKey);
    },
    /**
     * 根据 name 获取微应用配置
     */
    getAppByName: (state) => (name: string): AppDefinition | undefined => {
      return state.apps.find((app) => app.name === name);
    },
  },
  actions: {
    /**
     * 幂等写入/更新微应用定义（作为 AppDefinition 的唯一数据源）
     */
    upsertApp(app: AppDefinition) {
      const idx = this.apps.findIndex((a) => a.appKey === app.appKey);
      if (idx >= 0) {
        this.apps[idx] = app;
      } else {
        this.apps.push(app);
      }
    },

    /**
     * 删除微应用定义
     */
    removeApp(appKey: string) {
      this.apps = this.apps.filter((a) => a.appKey !== appKey);
    },

    /**
     * 从菜单初始化微应用列表
     */
    initializeFromMenu(menuItems: MenuItem[]) {
      // 如果已初始化，跳过
      if (this.initialized) {
        console.log('[MicroAppStore] 微应用列表已初始化，跳过');
        return;
      }

      const apps: AppDefinition[] = [];

      const traverse = (items: MenuItem[]) => {
        items.forEach((item) => {
          if (item.type === 'sub' && item.name && item.activeRule) {
            // 检查是否已存在（去重）
            if (!apps.some((app) => app.appKey === item.key)) {
              if (!item.entry) {
                console.warn('[MicroAppStore] 子应用菜单缺少 entry，跳过:', item);
                return;
              }
              apps.push({
                appKey: item.key,
                name: item.name, // 使用 menuItem.name 作为 runtime 注册名
                entry: joinUrlSegments(item.entry, item.activeRule),
                activeRule: item.activeRule,
              });
            }
          }
          if (item.children && item.children.length > 0) {
            traverse(item.children);
          }
        });
      };

      traverse(menuItems);
      this.apps = apps;
      this.initialized = true;
      console.log('[MicroAppStore] 已初始化微应用列表:', apps);
    },

    /**
     * 重置微应用状态
     */
    reset() {
      this.apps = [];
      this.initialized = false;
    },
  },
});
