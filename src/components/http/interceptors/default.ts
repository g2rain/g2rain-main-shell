/**
 * Default 类型拦截器
 * 用于需要认证的业务接口，处理 Result 格式响应
 */

import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { dpopSign } from '../sign';
import { env } from '@shared/env';
import { handleError, handleAuthFailure } from '../error-handler';
import { pendingRequestManager } from '../refresh-barrier';
import { loadingManager } from '@/components/loading';
import { FrontendError, FrontendErrorCode } from '@/components/error';
import { t } from '@platform/i18n';
import { setupBaseRequestInterceptor, setupBaseResponseInterceptor, type InterceptorOptions } from './base';

/**
 * 设置 Default 类型的请求拦截器
 */
export function setupDefaultRequestInterceptor(instance: AxiosInstance, options?: InterceptorOptions): void {
  // 先设置基础拦截器
  setupBaseRequestInterceptor(instance);

  // 添加认证相关逻辑
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // 如果已经标记为使用 mock，跳过认证逻辑
      if ((config as any).__useMock) {
        return config;
      }

      let authSession = options?.authSessionProvider?.();

      if (!authSession) {
        throw new Error('NO_LOGIN');
      }

      // 除了创建 token，其他接口都需要验证 token
      if (!authSession.isLogin) {
        const error = new Error('NO_LOGIN');
        await options?.authErrorHandler?.('NO_LOGIN', error);
        throw error;
      }

      // access 无效：统一走 runtime 注入的 ensureAccessToken（单飞，不依赖 watch）
      if (!authSession.isAccessTokenValid) {
        if (!options?.ensureAccessToken) {
          throw new Error('ensureAccessToken is not configured');
        }

        try {
          await options.ensureAccessToken();
        } catch {
          const refreshError = new Error('TOKEN_REFRESH_FAILED');
          await options?.authErrorHandler?.('TOKEN_REFRESH_FAILED', refreshError);
          throw refreshError;
        }

        authSession = options?.authSessionProvider?.()!;
        if (!authSession.isAccessTokenValid || !authSession.tokenString) {
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
export function setupDefaultResponseInterceptor(instance: AxiosInstance, options?: InterceptorOptions): void {
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

      const ensure = options?.ensureAccessToken;
      if (!ensure) {
        loadingManager.hide();
        return Promise.reject(new Error('ensureAccessToken is not configured'));
      }

      await ensure({ force: true });

      const session = options?.authSessionProvider?.();
      if (!session?.isAccessTokenValid || !session.tokenString) {
        loadingManager.hide();
        handleAuthFailure(session ?? authSession);
        return Promise.reject(error);
      }

      // 刷新成功后重试
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${session.tokenString}`;
      return instance(originalRequest).then(
        (r) => r,
        (retryErr) => {
          throw retryErr;
        },
      );
    } catch (refreshError) {
      const session = options?.authSessionProvider?.();
      pendingRequestManager.clearPendingRequests();
      loadingManager.hide();
      await options?.authErrorHandler?.('TOKEN_REFRESH_FAILED', refreshError);
      handleAuthFailure(session ?? authSession);
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
          throw new FrontendError(data.errorMessage || t('G2_ERR_BUSINESS', '请求失败'), {
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
export function setupDefaultInterceptors(instance: AxiosInstance, options?: InterceptorOptions): void {
  setupDefaultRequestInterceptor(instance, options);
  setupDefaultResponseInterceptor(instance, options);
}
