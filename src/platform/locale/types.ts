/**
 * Shell 层地域语言（Locale）类型
 */

/** 可选语言项（列表 + 当前选中） */
export interface LocaleOption {
  /** 区域标识，如 zh-CN */
  code: string;
  /** 展示名称 */
  name: string;
  /** 语言编码，如 zh（由 code 解析，供 i18n 等接口使用） */
  languageCode: string;
  /** 国家/地区编码，如 CN（由 code 解析） */
  regionCode: string;
}

/** 主应用通过 qiankun props 传给子应用的语言信息 */
export interface SubAppLocaleProps {
  localeCode: string;
}
