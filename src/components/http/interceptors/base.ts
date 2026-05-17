/**
 * 基础拦截器实现
 * 包含所有 HttpClientType 共享的拦截器逻辑
 */

import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { loadingManager, shouldShowLoading } from '@/components/loading';
import { shouldUseMock } from '../mock-utils';
import type { HttpAuthSession, EnsureAccessTokenOptions } from '../types';

/**
 * 拦截器配置选项
 */
export interface InterceptorOptions {
  /**
   * 获取认证会话上下文的回调
   * - 由上层（platform/runtime）实现
   */
  authSessionProvider?: () => HttpAuthSession;

  /**
   * 统一的认证异常处理回调
   * - 例如：NO_LOGIN / TOKEN_REFRESH_FAILED 时触发 SSO 跳转
   */
  authErrorHandler?: (reason: 'NO_LOGIN' | 'TOKEN_REFRESH_FAILED', error: unknown) => Promise<void> | void;

  /**
   * 由 runtime 注入：刷新并写回 store（单飞）；`opts.force` 见 {@link EnsureAccessTokenOptions}
   */
  ensureAccessToken?: (opts?: EnsureAccessTokenOptions) => Promise<void>;

  /** 是否启用认证相关拦截器（默认 true） */
  withAuth?: boolean;
}

/**
 * 设置基础请求拦截器（共享逻辑）
 * 包括：loading 显示、mock 检查
 */
export function setupBaseRequestInterceptor(instance: AxiosInstance): void {
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // 非 mock 请求：显示 loading（排除特定接口）
      if (shouldShowLoading(config)) {
        const loadingText = (config as any).loadingText;
        loadingManager.show({ text: loadingText });
      }

      // 检查是否需要使用 mock
      if (shouldUseMock(config)) {
        // 标记为使用 mock，将在 adapter 中处理
        (config as any).__useMock = true;
        console.log('[HTTP Request] 已标记为使用 Mock，跳过认证和签名步骤');
        // Mock 请求不显示 loading，直接返回 config，跳过后续的认证和签名步骤
        return config;
      }

      return config;
    },
    (error) => {
      // 请求失败也要关闭 loading
      loadingManager.hide();
      return Promise.reject(error);
    },
  );
}

/**
 * 设置基础响应拦截器（共享逻辑）
 * 包括：loading 关闭
 */
export function setupBaseResponseInterceptor(instance: AxiosInstance): void {
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // 关闭 loading
      loadingManager.hide();
      return response;
    },
    async (error: any) => {
      // 非 401 或未进入刷新流程的错误，也要关闭 loading
      loadingManager.hide();
      return Promise.reject(error);
    },
  );
}
