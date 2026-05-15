/**
 * TabTypes 类型定义和类
 */

import type { AppDefinition } from './app.type';
import type { MenuItem } from './menu.type';
import { useMicroAppStore } from '@platform/stores/app.store';

/**
 * TabTypes 类型
 */
export type TabType = 'main' | 'sub';

/**
 * TabTypes 基础接口
 */
export interface TabBase {
  /** TabTypes 唯一标识（与 MenuItem key 一致） */
  key: string;
  /** TabTypes 显示标题 */
  title: string;
  /** TabTypes 类型：主应用 / 子应用 */
  type: TabType;
}

/**
 * 主应用 TabTypes
 */
export interface MainTab extends TabBase {
  type: 'main';
  /** 主应用路由路径（如 '/main/home'） */
  routePath: string;
}

/**
 * 子应用 TabTypes
 */
export interface SubTab extends TabBase {
  type: 'sub';
  /** 微应用定义信息 */
  app: AppDefinition;
  /** 子应用内部路由路径（如 '/test/dict'） */
  initialPath?: string;
}

/**
 * TabTypes 联合类型
 */
export type TabTypes = MainTab | SubTab;

/**
 * TabTypes 类
 * 支持主应用路径和微应用 AppInfo
 */
export class TabClass {
  /** TabTypes 唯一标识 */
  public readonly key: string;
  /** TabTypes 显示标题 */
  public readonly title: string;
  /** TabTypes 类型 */
  public readonly type: TabType;
  /** 主应用路由路径（仅主应用 TabTypes 有值） */
  public readonly routePath?: string;
  /** 微应用定义信息（仅子应用 TabTypes 有值） */
  public readonly app?: AppDefinition;
  /** 子应用初始路径（仅子应用 TabTypes 有值） */
  public readonly initialPath?: string;

  /**
   * 创建主应用 TabTypes
   */
  static createMainTab(key: string, title: string, routePath: string): TabClass {
    return new TabClass({
      key,
      title,
      type: 'main',
      routePath,
    });
  }

  /**
   * 创建子应用 TabTypes
   */
  static createSubTab(key: string, title: string, app: AppDefinition, initialPath?: string): TabClass {
    return new TabClass({
      key,
      title,
      type: 'sub',
      app,
      initialPath,
    });
  }

  /**
   * 从 MenuItem 创建 TabTypes
   */
  static fromMenuItem(menuItem: MenuItem): TabClass | null {
    // 只处理 'main' 和 'sub' 类型的菜单项，忽略 'group' 类型
    if (menuItem.type === 'main') {
      if (!menuItem.routePath) {
        console.warn('[TabClass] 主应用菜单项缺少 routePath，无法创建 TabTypes:', menuItem);
        return null;
      }
      return TabClass.createMainTab(menuItem.key, menuItem.title, menuItem.routePath);
    } else if (menuItem.type === 'sub') {
      if (!menuItem.name) {
        console.warn('[TabClass] 子应用菜单项缺少 name，无法创建 TabTypes:', menuItem);
        return null;
      }

      // 优先从 MicroAppStore 中获取微应用定义，保证唯一的 AppDefinition 来源
      const microAppStore = useMicroAppStore();
      const appFromStore =
        microAppStore.getAppByKey(menuItem.key) ?? microAppStore.getAppByName(menuItem.name);

      if (!appFromStore) {
        console.warn(
          '[TabClass] 未在 MicroAppStore 中找到对应微应用定义，无法创建 TabTypes:',
          menuItem,
        );
        return null;
      }

      // 使用 store 中的 AppDefinition，initialPath 仍然来自菜单的 routePath（子应用内部初始路由）
      return TabClass.createSubTab(menuItem.key, menuItem.title, appFromStore, menuItem.routePath);
    }
    return null;
  }

  /**
   * 从 TabTypes 接口创建 TabClass
   */
  static fromTab(tab: TabTypes): TabClass {
    if (tab.type === 'main') {
      return TabClass.createMainTab(tab.key, tab.title, tab.routePath);
    } else {
      return TabClass.createSubTab(tab.key, tab.title, tab.app, tab.initialPath);
    }
  }

  /**
   * 构造函数
   */
  private constructor(data: MainTab | SubTab) {
    this.key = data.key;
    this.title = data.title;
    this.type = data.type;
    if (data.type === 'main') {
      this.routePath = data.routePath;
    } else {
      this.app = data.app;
      this.initialPath = data.initialPath;
    }
  }

  /**
   * 转换为 TabTypes 接口
   */
  toTab(): TabTypes {
    if (this.type === 'main') {
      return {
        key: this.key,
        title: this.title,
        type: 'main',
        routePath: this.routePath!,
      };
    } else {
      return {
        key: this.key,
        title: this.title,
        type: 'sub',
        app: this.app!,
        initialPath: this.initialPath,
      };
    }
  }

  /**
   * 判断是否为主应用 TabTypes
   */
  isMainTab(): this is TabClass & { type: 'main'; routePath: string } {
    return this.type === 'main';
  }

  /**
   * 判断是否为子应用 TabTypes
   */
  isSubTab(): this is TabClass & { type: 'sub'; app: AppDefinition } {
    return this.type === 'sub';
  }

  /**
   * 获取主应用路由路径（仅主应用 TabTypes）
   */
  getMainRoutePath(): string | undefined {
    return this.isMainTab() ? this.routePath : undefined;
  }

  /**
   * 获取微应用定义信息（仅子应用 TabTypes）
   */
  getApp(): AppDefinition | undefined {
    return this.isSubTab() ? this.app : undefined;
  }

  /**
   * 获取子应用激活规则（仅子应用 TabTypes）
   */
  getActiveRule(): string | undefined {
    return this.isSubTab() ? this.app?.activeRule : undefined;
  }

  /**
   * 获取子应用名称（仅子应用 TabTypes）
   */
  getAppName(): string | undefined {
    return this.isSubTab() ? this.app?.name : undefined;
  }

}
