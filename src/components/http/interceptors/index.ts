/**
 * 拦截器导出入口
 * 根据 HttpClientType 选择对应的拦截器
 */

import type { AxiosInstance } from 'axios';
import type { HttpClientType } from '../types';
import { setupDefaultInterceptors } from './default';
import { setupAuthInterceptors } from './auth';
import type { InterceptorOptions } from './base';

/**
 * 设置拦截器
 * 根据 HttpClientType 选择对应的拦截器实现
 */
export function setupInterceptors(
  instance: AxiosInstance,
  type: HttpClientType,
  options?: InterceptorOptions,
): void {
  switch (type) {
    case 'default':
      setupDefaultInterceptors(instance, options);
      break;
    case 'auth':
      setupAuthInterceptors(instance, options);
      break;
    default:
      // 默认使用 default 拦截器
      setupDefaultInterceptors(instance, options);
  }
}

// 导出类型
export type { InterceptorOptions } from './base';
