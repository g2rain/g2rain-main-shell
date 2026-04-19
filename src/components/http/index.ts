/**
 * HTTP 客户端组件入口
 *
 * - 负责类型导出与实例选择（getHttpClient）
 * - 为每个 HttpClientType 维护对应的 HttpClientOptions，并提供更新方法
 * - 具体的初始化与实例工厂逻辑在 `client.ts` 中实现
 */

import type {
  HttpClient,
  HttpClientInstance,
  HttpClientOptions,
  HttpClientType,
  ResponseTypeMap,
  Result,
  HttpAuthSession,
} from './types';
import { createHttpClient } from './client';
import { env } from '@shared/env';

/**
 * 每个 HttpClientType 对应的默认配置
 * - default：默认业务客户端（带认证）
 * - auth：用于创建 token 相关的客户端（不走认证拦截器）
 */
const httpClientOptionsMap: {
  [K in HttpClientType]: HttpClientOptions<ResponseTypeMap[K]>;
} = {
  default: {
    baseURL: `${env.VITE_CONTEXT_PATH}/api`,
    withAuth: true,
    isDirectResponse: false, // 使用标准的 Result<T> 格式
  },
  auth: {
    baseURL: env.VITE_CONTEXT_PATH,
    withAuth: false,
    isDirectResponse: true, // 直接返回数据，不包装 Result
  },
};

/**
 * 每个 HttpClientType 对应的单例实例缓存
 */
const clientInstanceMap = new Map<HttpClientType, HttpClientInstance<any>>();

/**
 * 获取指定类型的 HttpClient 实例（单例）
 * @template T HttpClientType
 */
export function getHttpClient<T extends HttpClientType = 'default'>(
  type: T = 'default' as T,
): HttpClient<ResponseTypeMap[T]> {
  if (!clientInstanceMap.has(type)) {
    const options = httpClientOptionsMap[type] || {};
    clientInstanceMap.set(type, createHttpClient<ResponseTypeMap[T]>(options, type));
  }

  return clientInstanceMap.get(type)!.client as HttpClient<ResponseTypeMap[T]>;
}

/**
 * 覆盖指定类型的 HttpClientOptions，并重置对应单例
 * @template T HttpClientType
 */
export function setHttpClientOptions<T extends HttpClientType>(
  type: T,
  options: HttpClientOptions<ResponseTypeMap[T]>,
): void {
  httpClientOptionsMap[type] = options;
  clientInstanceMap.delete(type);
}

/**
 * 合并更新指定类型的 HttpClientOptions，并重置对应单例
 * @template T HttpClientType
 */
export function updateHttpClientOptions<T extends HttpClientType>(
  type: T,
  patch: Partial<HttpClientOptions<ResponseTypeMap[T]>>,
): void {
  httpClientOptionsMap[type] = {
    ...(httpClientOptionsMap[type] || {}),
    ...patch,
  };
  clientInstanceMap.delete(type);
}

/**
 * 更新指定类型的 baseURL，并重新创建 HttpClient 实例
 * @template T HttpClientType
 * @param type HttpClient 类型
 * @param baseURL 新的 baseURL
 */
export function updateHttpBaseURL<T extends HttpClientType>(
  type: T,
  baseURL: string,
): void {
  updateHttpClientOptions(type, { baseURL });
  // 如果实例已存在，立即重新创建
  if (clientInstanceMap.has(type)) {
    const options = httpClientOptionsMap[type] || {};
    clientInstanceMap.set(type, createHttpClient<ResponseTypeMap[T]>(options, type));
  }
}

export type {
  HttpClient,
  HttpClientInstance,
  HttpClientOptions,
  HttpClientType,
  Result,
  HttpAuthSession,
};

// 导出 DPoP 签名相关功能
export {
  dpopSign,
  generateDpopHeader,
  generateDpop,
  fetchIamKeyId,
  fetchIamPublicKey,
} from './sign';
export type { DpopHeader, DpopPayload, Client } from './types';
