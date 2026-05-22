/**
 * 前端国际化文案包 API（免登录）
 */

import { getHttpClient, type Result } from '@/components/http';

export interface I18nLocaleMessage {
  messageCode: string;
  messageText: string;
  extendField?: string;
}

/**
 * 拉取本 Shell 页面 UI 文案
 * GET /api/infra/i18n_message/locale
 */
export async function fetchI18nLocaleMessages(languageCode: string, regionCode: string,): Promise<I18nLocaleMessage[]> {
  const httpClient = getHttpClient('auth');
  const result = (await httpClient.get('/api/infra/i18n_message/locale', {
    tag: 'MAIN_SHELL',
    languageCode,
    regionCode,
    messageUsageCode: 'UI_MESSAGE',
  })) as Result<I18nLocaleMessage[]>;

  return result.data ?? [];
}
