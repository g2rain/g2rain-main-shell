import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { JWK, JWTHeaderParameters, JWTPayload } from 'jose';

/**
 * API 响应类型定义
 */
export interface Result<T = any> {
  requestId: string; // 请求id
  requestTime: string; // 请求时间
  status: number; // 状态, 200成功; 500失败
  errorCode: string; // 错误码
  errorMessage: string; // 错误消息
  data: T;
}

/**
 * 默认响应类型（标准 Result 格式）
 */
export type DefaultResponseType<T = any> = Result<T>;

/**
 * 直接返回数据的响应类型（不包装 Result）
 */
export type DirectResponseType<T = any> = T;

/**
 * HttpClient 对外暴露的能力（支持自定义响应类型）
 * @template ResponseType 响应类型，默认为 Result<any>
 */
export interface HttpClient<ResponseType = Result<any>> {
  request<T = any>(config: AxiosRequestConfig): Promise<ResponseType extends Result<any> ? Result<T> : T>;
  get<T = any>(url: string, params?: any, config?: Partial<AxiosRequestConfig>): Promise<ResponseType extends Result<any> ? Result<T> : T>;
  post<T = any>(url: string, data?: any, config?: Partial<AxiosRequestConfig>): Promise<ResponseType extends Result<any> ? Result<T> : T>;
  put<T = any>(url: string, data?: any, config?: Partial<AxiosRequestConfig>): Promise<ResponseType extends Result<any> ? Result<T> : T>;
  delete<T = any>(url: string, params?: any, config?: Partial<AxiosRequestConfig>): Promise<ResponseType extends Result<any> ? Result<T> : T>;
  patch<T = any>(url: string, data?: any, config?: Partial<AxiosRequestConfig>): Promise<ResponseType extends Result<any> ? Result<T> : T>;
}

/**
 * 对外暴露的 HttpClient 实例类型定义
 * @template ResponseType 响应类型
 */
export interface HttpClientInstance<ResponseType = Result<any>> {
  axios: AxiosInstance;
  client: HttpClient<ResponseType>;
}

/**
 * DPoP 签名相关类型定义
 */

/**
 * DPoP Header 类型
 */
export interface DpopHeader extends JWTHeaderParameters {
  typ: string; // 类型
  alg: string; // 算法
  ph_alg: string; // 参数hash算法
  jwk: JWK; // 公钥
  kid: string; // clientId
}

/**
 * DPoP Payload 类型
 */
export interface DpopPayload extends JWTPayload {
  htu: string; // 链接地址
  htm: string; // HTTP方法
  iat?: number; // 有效期时间
  jti?: string; // 随机值
  acd: string; // 应用编码
  pha: string; // 请求参数SHA256哈希值
}

/**
 * 认证客户端类型（统一类型定义）
 * - 用于 DPoP 签名、HTTP 认证会话等场景
 * - 由 platform 层实现并提供给 components 层使用
 */
export interface Client {
  clientId: string; // 终端ID
  publicKey: JWK; // 公钥
  privateKey: JWK; // 私钥
  isAuthenticated: boolean; // 是否认证
}

/**
 * HTTP 认证会话上下文
 * - 由上层（platform/runtime）实现，供 Http 组件通过回调获取
 */
export interface HttpAuthSession {
  /** 当前客户端（用于 DPoP 签名等场景） */
  client: Client | null;
  /** 是否已登录 */
  isLogin: boolean;
  /** 访问 token 是否仍然有效 */
  isAccessTokenValid: boolean;
  /** token 是否已被标记为过期（用于触发刷新流程） */
  tokenExpired: boolean;
  /** 原始 token 字符串 */
  tokenString: string | null;
  /** 标记 token 是否过期 */
  setTokenExpired(expired: boolean): void;
}

/**
 * HttpClient 实例的配置选项
 * @template ResponseType 响应类型
 */
export interface HttpClientOptions<ResponseType = Result<any>> {
  /**
   * 基础地址（通常为 contextPath 或网关前缀）
   */
  baseURL?: string;

  /**
   * 是否启用认证相关拦截器（默认 true）
   */
  withAuth?: boolean;

  /**
   * 响应类型（可选，用于类型推断）
   * 如果不提供，则使用默认的 Result<T> 格式
   */
  responseType?: ResponseType;

  /**
   * 是否直接返回响应数据（不包装 Result）
   * 如果为 true，则响应数据直接返回，不进行 Result 格式检查
   * 默认为 false，使用标准的 Result<T> 格式
   */
  isDirectResponse?: boolean;

  /**
   * 提供认证会话上下文的回调
   * - 由上层实现，Http 组件只依赖该抽象接口
   */
  authSessionProvider?: () => HttpAuthSession;

  /**
   * 统一的认证异常处理回调
   * - 例如：NO_LOGIN / TOKEN_REFRESH_FAILED 时触发 SSO 跳转
   */
  authErrorHandler?: (
    reason: 'NO_LOGIN' | 'TOKEN_REFRESH_FAILED',
    error: unknown,
  ) => Promise<void> | void;
}

/**
 * 预置的 HttpClient 类型
 */
export type HttpClientType = 'default' | 'auth';

/**
 * 响应类型映射
 * 为每个 HttpClientType 定义对应的响应类型
 */
export type ResponseTypeMap = {
  default: Result<any>;
  auth: any; // auth 类型直接返回数据，不包装 Result
};
