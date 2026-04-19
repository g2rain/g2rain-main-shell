/**
 * 页面资源相关 API
 */

import { getHttpClient } from '@/components/http';

/**
 * 从后端获取页面按钮权限等资源
 * @returns 资源数据
 */
export async function getPageResources(): Promise<Record<string, any>> {
  try {
    // 实际项目中替换为接口调用：
    const httpClient = getHttpClient('default');
    const res = await httpClient.get<Record<string, any>>('/api/resource/page');
    return res.data || {};
  } catch (error) {
    console.warn('[PageResourceAPI] 获取页面资源失败:', error);
    return {};
  }
}
