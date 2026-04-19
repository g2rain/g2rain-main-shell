/**
 * 服务器返回的菜单数据结构
 * 对应后端 AuthorityMenuVo 类
 */
export interface AuthorityMenuVo {
  /** 菜单标识 */
  id: number;
  /** 父菜单标识 */
  parentId: number | null;
  /** 应用编码 */
  applicationCode: string;
  /** 访问地址 */
  endpointUrl: string;
  /** 应用路径 */
  contextPath: string;
  /** 菜单名称 */
  menuName: string;
  /** 菜单编码 */
  menuCode: string;
  /** 链接路径 */
  linkPath: string | null;
  /** 展示图标 */
  icon: string | null;
  /** 菜单排序 */
  menuSortOrder: number | null;
  /** 子菜单列表 */
  subMenus?: AuthorityMenuVo[];
}
