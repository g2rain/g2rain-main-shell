import { AppError } from './AppError';
import type { AppErrorOptions } from './types';
import { FrontendErrorCode } from './types';

/**
 * 纯前端错误（token 过期、路由不存在等）
 */
export class FrontendError extends AppError {
  override source: 'FRONTEND' = 'FRONTEND';

  constructor(message: string, options: AppErrorOptions) {
    super(message, {
      ...options,
      source: 'FRONTEND',
    });
  }

  static tokenExpired(detail?: any): FrontendError {
    return new FrontendError('登录已过期，请重新登录', {
      errorCode: FrontendErrorCode.TOKEN_EXPIRED,
      detail,
    });
  }

  static routeNotFound(path: string): FrontendError {
    return new FrontendError('页面不存在', {
      errorCode: FrontendErrorCode.ROUTE_NOT_FOUND,
      detail: { path },
    });
  }

  static networkError(detail?: any): FrontendError {
    return new FrontendError('网络异常，请稍后重试', {
      errorCode: FrontendErrorCode.NETWORK_ERROR,
      detail,
    });
  }
}
