/**
 * 菜单 / Tab 标题解析：menu_code 为 i18n key，menuName 为页面默认文案
 */

import { t } from './index';

export interface MenuTitleSource {
  menuCode?: string;
  title: string;
}

export function resolveMenuTitle(source: MenuTitleSource): string {
  const code = source.menuCode?.trim();
  if (code) {
    return t(code, source.title);
  }
  return source.title;
}
