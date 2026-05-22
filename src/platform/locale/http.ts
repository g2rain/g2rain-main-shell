/**
 * 将当前 Locale 写入 HTTP 请求头
 */

import type { InternalAxiosRequestConfig } from 'axios';
import { useLocaleStore } from '@platform/stores/locale.store';

export const ACCEPT_LANGUAGE_HEADER = 'Accept-Language';

/**
 * 若已选择语言且请求未显式设置 Accept-Language，则注入当前 locale code（如 zh-CN）
 */
export function applyAcceptLanguageHeader(config: InternalAxiosRequestConfig): void {
  const localeStore = useLocaleStore();
  const acceptLanguage = localeStore.acceptLanguage;
  if (!acceptLanguage) {
    return;
  }

  config.headers = config.headers || {};
  const headers = config.headers as Record<string, string | undefined>;
  if (headers[ACCEPT_LANGUAGE_HEADER] != null && headers[ACCEPT_LANGUAGE_HEADER] !== '') {
    return;
  }

  headers[ACCEPT_LANGUAGE_HEADER] = acceptLanguage;
}
