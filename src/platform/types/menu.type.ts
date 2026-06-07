export type MenuItemType = 'main' | 'sub' | 'group';

export interface MenuItem {
  key: string;                 // 全局唯一（TabTypes / App 的逻辑主键）
  /** 菜单编码，与 i18n_message.message_code / resource_menu.menu_code 一致 */
  menuCode: string;
  /** 默认展示名（后台 menu_name，i18n 未配置时使用） */
  title: string;
  type: MenuItemType;
  children?: MenuItem[];

  /**
   * 主应用页面路由（仅 main）
   * 例如：/main/home
   */
  routePath?: string;

  /**
   * 子应用相关字段（仅 sub）
   */
  name?: string;               // 子应用名称（标识实际的子应用，用于 runtime 注册）
  activeRule?: string;         // 子应用激活规则（如 '/sub-app-1'）
  entry?: string;              // 子应用入口地址
}
