import { AppError } from './AppError';
import type { AppErrorOptions } from './types';
import { FrontendErrorCode } from './types';
import { t } from '@platform/i18n';

/** 前端错误码 → i18n key（tag: G2RAIN_SHARED） */
const FRONTEND_I18N_KEY: Record<FrontendErrorCode, string> = {
  [FrontendErrorCode.TOKEN_EXPIRED]: 'G2_ERR_TOKEN_EXPIRED',
  [FrontendErrorCode.ROUTE_NOT_FOUND]: 'G2_ERR_ROUTE_NOT_FOUND',
  [FrontendErrorCode.NETWORK_ERROR]: 'G2_ERR_NETWORK',
  [FrontendErrorCode.UNAUTHORIZED]: 'G2_ERR_UNAUTHORIZED',
  [FrontendErrorCode.FORBIDDEN]: 'G2_ERR_FORBIDDEN',
  [FrontendErrorCode.UNKNOWN]: 'G2_ERR_UNKNOWN',
  [FrontendErrorCode.TOKEN_REFRESH_TIMEOUT]: 'G2_ERR_TOKEN_REFRESH_TIMEOUT',
  [FrontendErrorCode.MOCK_DATA_NOT_FOUND]: 'G2_ERR_MOCK_NOT_FOUND',
  [FrontendErrorCode.NO_LOGIN]: 'G2_ERR_NO_LOGIN',
  [FrontendErrorCode.API_PERMISSION_DENIED]: 'G2_ERR_API_DENIED',
  [FrontendErrorCode.TOKEN_REFRESH_FAILED]: 'G2_ERR_TOKEN_REFRESH_FAIL',
  [FrontendErrorCode.BUSINESS_ERROR]: 'G2_ERR_BUSINESS',
};

function frontendMessage(code: FrontendErrorCode, defaultText: string): string {
  return t(FRONTEND_I18N_KEY[code], defaultText);
}

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

  static tokenExpired(detail?: unknown): FrontendError {
    return new FrontendError(frontendMessage(FrontendErrorCode.TOKEN_EXPIRED, '登录已过期，请重新登录'), {
      errorCode: FrontendErrorCode.TOKEN_EXPIRED,
      detail,
    });
  }

  static routeNotFound(path: string): FrontendError {
    return new FrontendError(frontendMessage(FrontendErrorCode.ROUTE_NOT_FOUND, '页面不存在'), {
      errorCode: FrontendErrorCode.ROUTE_NOT_FOUND,
      detail: { path },
    });
  }

  static networkError(detail?: unknown): FrontendError {
    return new FrontendError(frontendMessage(FrontendErrorCode.NETWORK_ERROR, '网络异常，请稍后重试'), {
      errorCode: FrontendErrorCode.NETWORK_ERROR,
      detail,
    });
  }
}
