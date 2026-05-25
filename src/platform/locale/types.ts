/**
 * Shell 层地域语言（Locale）类型
 */

/** 可选语言项（code 即 BCP 47 locale，如 zh-CN） */
export interface LocaleOption {
  code: string;
  name: string;
}

/** 主应用通过 qiankun props 传给子应用 */
export interface SubAppLocaleProps {
  locale: string;
}
