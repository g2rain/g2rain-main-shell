// Result 类型直接复用 HTTP 组件定义，避免重复定义
export type { Result } from '@/components/http/types';

// 错误来源：后端 / 前端 / 未知
export type ErrorSource = 'BACKEND' | 'FRONTEND' | 'UNKNOWN';

// 前端错误码（用于 token 过期、路由不存在等）
export enum FrontendErrorCode {
  TOKEN_EXPIRED = 'FRONTEND.TOKEN_EXPIRED',
  ROUTE_NOT_FOUND = 'FRONTEND.ROUTE_NOT_FOUND',
  NETWORK_ERROR = 'FRONTEND.NETWORK_ERROR',
  UNAUTHORIZED = 'FRONTEND.UNAUTHORIZED',
  FORBIDDEN = 'FRONTEND.FORBIDDEN',
  UNKNOWN = 'FRONTEND.UNKNOWN',
  TOKEN_REFRESH_TIMEOUT = 'FRONTEND.TOKEN_REFRESH_TIMEOUT',
  MOCK_DATA_NOT_FOUND = 'FRONTEND.MOCK_DATA_NOT_FOUND',
  NO_LOGIN = 'FRONTEND.NO_LOGIN',
  API_PERMISSION_DENIED = 'FRONTEND.API_PERMISSION_DENIED',
  TOKEN_REFRESH_FAILED = 'FRONTEND.TOKEN_REFRESH_FAILED',
  BUSINESS_ERROR = 'FRONTEND.BUSINESS_ERROR',
}

// AppError 构造参数
export interface AppErrorOptions {
  errorCode?: string; // errorCode（后端）或前端自定义错误码
  status?: number; // HTTP 状态码或后端 Result.status
  source?: ErrorSource; // 错误来源
  requestId?: string; // 后端返回的 requestId
  requestTime?: string; // 后端返回的 requestTime
  detail?: any; // 额外数据（如 Result.data 或 axios 响应）
  cause?: unknown; // 原始异常，用于保留堆栈
}
