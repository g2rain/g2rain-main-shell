/**
 * TabTypes Store
 * 管理 TabTypes 实例和激活状态
 */

import { defineStore } from 'pinia';
import { TabClass, type TabTypes } from '@platform/types';
import type { MenuItem } from '@platform/types';

export const useTabStore = defineStore('tab', {
  state: () => ({
    tabs: [] as TabClass[], // TabTypes 实例数组
    activeTabKey: '', // 当前激活的 TabTypes
  }),
  getters: {
    /**
     * 获取 TabTypes 接口数组（用于模板渲染）
     */
    tabList(state): TabTypes[] {
      return state.tabs.map((tab) => tab.toTab());
    },

    /**
     * 根据 key 获取 TabTypes
     */
    getTabByKey: (state) => (key: string): TabClass | undefined => {
      return state.tabs.find((tab) => tab.key === key);
    },

    /**
     * 获取当前激活的 TabTypes
     */
    activeTab(state): TabClass | undefined {
      return state.tabs.find((tab) => tab.key === state.activeTabKey);
    },
  },
  actions: {
    /**
     * 添加主应用 TabTypes
     */
    addMainTab(key: string, title: string, routePath: string) {
      const tabClass = TabClass.createMainTab(key, title, routePath);
      this.addTab(tabClass);
    },

    /**
     * 从菜单项添加 TabTypes
     */
    addTabFromMenuItem(menuItem: MenuItem) {
      const tabClass = TabClass.fromMenuItem(menuItem);
      if (tabClass) {
        this.addTab(tabClass);
      }
    },

    /**
     * 添加 TabTypes
     */
    addTab(tab: TabClass) {
      const exists = this.tabs.some((item) => item.key === tab.key);
      if (!exists) {
        this.tabs.push(tab);
      }

      // 激活该 TabTypes（并触发 runtime 同步）
      this.setActiveTab(tab.key);
    },

    /**
     * 关闭 TabTypes
     */
    removeTab(key: string) {
      const index = this.tabs.findIndex((tab) => tab.key === key);
      if (index === -1) {
        return;
      }

      const wasActive = this.activeTabKey === key;
      // 与 Chrome / VS Code 一致：关掉当前 Tab 时优先激活右侧；若是最右侧则激活左侧
      const preferRight = index < this.tabs.length - 1;

      this.tabs.splice(index, 1);

      if (!wasActive) {
        return;
      }

      if (this.tabs.length === 0) {
        this.activeTabKey = '';
        return;
      }

      const nextIndex = preferRight ? index : index - 1;
      this.setActiveTab(this.tabs[nextIndex].key);
    },

    /**
     * 设置激活的 TabTypes
     */
    setActiveTab(key: string) {
      const tab = this.tabs.find((tab) => tab.key === key);
      if (tab) {
        this.activeTabKey = key;
      }
    },

    // lastActivePath 已迁移到 runtime.store 的 RuntimeInstance 上维护
    // Tab store 不再保存运行态字段，避免 UI 状态和运行态耦合

    /**
     * 重置 TabTypes 状态
     */
    reset() {
      this.tabs = [];
      this.activeTabKey = '';
    },
  },
});
