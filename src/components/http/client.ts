/**
 * HTTP 客户端初始化与实例工厂
 *
 * 原先位于 `index.ts` 中的具体实现迁移至此，
 * 方便 `index.ts` 只承担导出和实例选择的职责。
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosAdapter,
} from 'axios';
import { setupInterceptors, type InterceptorOptions } from './interceptors';
import { defaultParamsSerializer } from './params-serializer';
import { applyFormSerializer } from './request-body';
import { getMockResponse } from './mock-utils';
import type {
  HttpClient,
  HttpClientInstance,
  HttpClientOptions,
  DefaultResponseType,
  HttpClientType,
  Result,
} from './types';

/**
 * 创建底层 Axios 实例（带自定义 adapter 以支持 mock）
 */
function createAxiosInstance(baseURL?: string): AxiosInstance {
  // 自定义 adapter：优先处理 mock，回退到默认 adapter
  const customAdapter: AxiosAdapter = async (config) => {
    // 约定：由拦截器设置 __useMock 标记
    if ((config as any).__useMock) {
      try {
        return await getMockResponse(config as any);
      } catch (error: any) {
        // 如果 mock 数据不存在且是 header 强制要求，抛出错误
        if (error.message && error.message.includes('Mock data not found')) {
          throw error;
        }
        // 否则继续正常请求流程
      }
    }

    const defaultAdapter = axios.getAdapter(['xhr', 'http']);
    return (defaultAdapter as AxiosAdapter)(config);
  };

  const instance = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
    adapter: customAdapter,
    responseType: 'json',
  });

  // 统一初始化全局 paramsSerializer，确保所有带 params 的请求使用同一套序列化逻辑
  (instance.defaults as any).paramsSerializer = {
    serialize: defaultParamsSerializer,
  };

  return instance;
}

/**
 * 按配置创建 HttpClient 实例
 * @template ResponseType 响应类型
 */
export function createHttpClient<ResponseType = DefaultResponseType>(
  options: HttpClientOptions<ResponseType> = {},
  type: HttpClientType = 'default',
): HttpClientInstance<ResponseType> {
  const {
    baseURL,
    withAuth = true,
    responseType,
    isDirectResponse = false,
    authSessionProvider,
    authErrorHandler,
  } = options;

  const axiosInstance = createAxiosInstance(baseURL);

  // 组装拦截器
  const interceptorOptions: InterceptorOptions = {
    authSessionProvider,
    authErrorHandler,
    withAuth,
  };

  setupInterceptors(axiosInstance, type, interceptorOptions);

  // 封装高阶 HttpClient
  const client: HttpClient<ResponseType> = {
    async request<T = any>(config: AxiosRequestConfig): Promise<ResponseType extends Result<any> ? Result<T> : T> {
      // 处理请求体序列化（表单等）
      const finalConfig = await applyFormSerializer(config);
      const response = await axiosInstance.request(finalConfig);
      
      // 根据配置决定返回格式
      // 如果 isDirectResponse 为 true，直接返回数据（不包装 Result）
      // 否则返回 Result 格式
      if (isDirectResponse) {
        return response.data as ResponseType extends Result<any> ? Result<T> : T;
      }
      return response.data as ResponseType extends Result<any> ? Result<T> : T;
    },

    async get<T = any>(
      url: string,
      params?: any,
      config?: Partial<AxiosRequestConfig>,
    ): Promise<ResponseType extends Result<any> ? Result<T> : T> {
      return this.request<T>({
        url,
        method: 'GET',
        params,
        ...config,
      });
    },

    async post<T = any>(
      url: string,
      data?: any,
      config?: Partial<AxiosRequestConfig>,
    ): Promise<ResponseType extends Result<any> ? Result<T> : T> {
      return this.request<T>({
        url,
        method: 'POST',
        data,
        ...config,
      });
    },

    async put<T = any>(
      url: string,
      data?: any,
      config?: Partial<AxiosRequestConfig>,
    ): Promise<ResponseType extends Result<any> ? Result<T> : T> {
      return this.request<T>({
        url,
        method: 'PUT',
        data,
        ...config,
      });
    },

    async delete<T = any>(
      url: string,
      params?: any,
      config?: Partial<AxiosRequestConfig>,
    ): Promise<ResponseType extends Result<any> ? Result<T> : T> {
      return this.request<T>({
        url,
        method: 'DELETE',
        params,
        ...config,
      });
    },

    async patch<T = any>(
      url: string,
      data?: any,
      config?: Partial<AxiosRequestConfig>,
    ): Promise<ResponseType extends Result<any> ? Result<T> : T> {
      return this.request<T>({
        url,
        method: 'PATCH',
        data,
        ...config,
      });
    },
  };

  return {
    axios: axiosInstance,
    client,
  };
}

