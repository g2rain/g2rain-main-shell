/**
 * Default 类型拦截器
 * 用于需要认证的业务接口，处理 Result 格式响应
 */

import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { dpopSign } from '../sign';
import { env } from '@shared/env';
import { handleError, handleAuthFailure } from '../error-handler';
import { pendingRequestManager } from '../pending-request-manager';
import { loadingManager } from '@/components/loading';
import { FrontendError, FrontendErrorCode } from '@/components/error';
import {
  setupBaseRequestInterceptor,
  setupBaseResponseInterceptor,
  type InterceptorOptions,
} from './base';

/**
 * 设置 Default 类型的请求拦截器
 */
export function setupDefaultRequestInterceptor(
  instance: AxiosInstance,
  options?: InterceptorOptions,
): void {
  // 先设置基础拦截器
  setupBaseRequestInterceptor(instance);

  // 添加认证相关逻辑
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // 如果已经标记为使用 mock，跳过认证逻辑
      if ((config as any).__useMock) {
        return config;
      }

      const authSession = options?.authSessionProvider?.();

      if (!authSession) {
        throw new Error('NO_LOGIN');
      }

      // 除了创建 token，其他接口都需要验证 token
      if (!authSession.isLogin) {
        const error = new Error('NO_LOGIN');
        await options?.authErrorHandler?.('NO_LOGIN', error);
        throw error;
      }

      // 检查 token 是否需要刷新
      if (!authSession.isAccessTokenValid) {
        // 如果正在刷新，将请求挂起
        if (pendingRequestManager.isRefreshing()) {
          return new Promise<InternalAxiosRequestConfig>((resolve, reject) => {
            pendingRequestManager.addPendingRequest(config, resolve, reject);
          });
        }

        // 设置 token 过期状态，触发 sso.ts 中的 watch 来刷新 token
        if (!authSession.tokenExpired) {
          authSession.setTokenExpired(true);
        }

        // 等待刷新完成
        try {
          await pendingRequestManager.waitForRefresh();
        } catch (error) {
          console.log(error);
          const refreshError = new Error('TOKEN_REFRESH_FAILED');
          await options?.authErrorHandler?.('TOKEN_REFRESH_FAILED', refreshError);
          throw refreshError;
        }
      }

      // 添加 Authorization header
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${authSession.tokenString}`;

      // 生成 DPoP 签名（在 dpopSign 内部统一处理 params / data）
      const jti = crypto.randomUUID();
      const url = config.url ?? '';
      const method = (config.method ?? 'GET').toUpperCase();
      
      // 使用 axios 配置中的 paramsSerializer（来自 client.ts 默认设置），生成规范化查询字符串，仅用于 DPoP 签名
      let params: unknown = '';
      if (config.params != null) {
        const ps: any = (config as any).paramsSerializer;
        if (ps) {
          try {
            if (typeof ps === 'function') {
              params = ps(config.params);
            } else if (ps && typeof ps.serialize === 'function') {
              params = ps.serialize(config.params);
            } else {
              params = config.params;
            }
          } catch (e) {
            console.warn('[HTTP Interceptor] paramsSerializer 执行失败，使用原始 params:', e);
            params = config.params;
          }
        } else {
          params = config.params;
        }
      }
      
      const data = config.data ?? null;

      config.headers.DPoP = await dpopSign(
        url,
        method,
        params,
        data,
        env.VITE_APPLICATION_CODE,
        authSession.client,
        jti,
      );

      return config;
    },
    async (error) => Promise.reject(error),
  );
}

/**
 * 设置 Default 类型的响应拦截器
 */
export function setupDefaultResponseInterceptor(
  instance: AxiosInstance,
  options?: InterceptorOptions,
): void {
  // 先设置基础拦截器
  setupBaseResponseInterceptor(instance);

  const tryRefreshAndRetry = async (
    originalRequest: any,
    authSession: ReturnType<NonNullable<InterceptorOptions['authSessionProvider']>>,
    error: unknown,
  ) => {
    if (!originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    try {
      if (!authSession.isLogin) {
        loadingManager.hide();
        handleAuthFailure(authSession);
        await options?.authErrorHandler?.('NO_LOGIN', error);
        return Promise.reject(error);
      }

      // 如果正在刷新，等待刷新完成；否则触发刷新后等待完成
      if (pendingRequestManager.isRefreshing()) {
        await pendingRequestManager.waitForRefresh();
      } else {
        if (!authSession.tokenExpired) {
          authSession.setTokenExpired(true);
        }
        await pendingRequestManager.waitForRefresh();
      }

      // 刷新成功后重试
      if (authSession.isAccessTokenValid && authSession.tokenString) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${authSession.tokenString}`;
        return instance(originalRequest);
      }

      // 刷新完成但 token 仍不可用，视为认证失败
      loadingManager.hide();
      handleAuthFailure(authSession);
      return Promise.reject(error);
    } catch (refreshError) {
      pendingRequestManager.clearPendingRequests();
      loadingManager.hide();
      await options?.authErrorHandler?.('TOKEN_REFRESH_FAILED', refreshError);
      handleAuthFailure(authSession);
      return Promise.reject(refreshError);
    }
  };

  // 添加业务错误处理
  instance.interceptors.response.use(
    async (response: AxiosResponse) => {
      const { data } = response;
      const authSession = options?.authSessionProvider?.();

      // 处理业务错误码（Result 格式）
      if (data && typeof data === 'object') {
        if (data.status !== 200 && data.status !== 0) {
          const errorCode = data.errorCode as string | undefined;

          // token expired：尝试刷新并重试
          if (errorCode === 'gateway.40002' && authSession) {
            const businessError = new FrontendError(data.errorMessage || 'token expired', {
              errorCode: errorCode || FrontendErrorCode.TOKEN_EXPIRED,
              detail: data,
            });
            return tryRefreshAndRetry(response.config, authSession, businessError);
          }

          // token invalid：直接走认证失败
          if (errorCode === 'gateway.40001' && authSession) {
            const businessError = new FrontendError(data.errorMessage || 'token invalid', {
              errorCode: errorCode || FrontendErrorCode.UNAUTHORIZED,
              detail: data,
            });
            loadingManager.hide();
            handleAuthFailure(authSession);
            await options?.authErrorHandler?.('NO_LOGIN', businessError);
            throw businessError;
          }

          // 业务错误也要关闭 loading
          loadingManager.hide();
          // 打印响应数据，便于排查业务错误
          console.error('[Http][BusinessError] response:', response);
          throw new FrontendError(data.errorMessage || '请求失败', {
            errorCode: data.errorCode || FrontendErrorCode.BUSINESS_ERROR,
            detail: data,
          });
        }
      }

      return response;
    },
    async (error: any) => {
      const originalRequest = error.config;
      const authSession = options?.authSessionProvider?.();
      if (!authSession) {
        return handleError(error);
      }

      // token 过期，尝试刷新
      if (error.response?.status === 401) {
        return tryRefreshAndRetry(originalRequest, authSession, error);
      }

      // 其他错误处理
      return handleError(error);
    },
  );
}

/**
 * 设置 Default 类型的所有拦截器
 */
export function setupDefaultInterceptors(
  instance: AxiosInstance,
  options?: InterceptorOptions,
): void {
  setupDefaultRequestInterceptor(instance, options);
  setupDefaultResponseInterceptor(instance, options);
}
