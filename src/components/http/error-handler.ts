import { normalizeAxiosError, type AppError } from '@/components/error';

/**
 * 处理 HTTP 错误
 * @param error Axios 错误对象
 * @returns 处理后的错误（统一为 AppError）
 */
export function handleError(error: any): Promise<never> {
  const appError: AppError = normalizeAxiosError(error);

  console.error('[HTTP Error Handler] 处理错误:', {
    name: appError.name,
    message: appError.message,
    errorCode: appError.errorCode,
    status: appError.status,
    source: appError.source,
    requestId: appError.requestId,
    requestTime: appError.requestTime,
    detail: appError.detail,
    cause: appError.cause,
    stack: appError.stack,
  });

  // 这里暂时仅日志输出，后续可以接入全局消息组件进行展示
  return Promise.reject(appError);
}

/**
 * 处理认证失败
 * @param accessTokenStore Token Store 实例
 */
export function handleAuthFailure(accessTokenStore: any): void {
  // 设置 isAuthenticated 为未认证
  if (accessTokenStore.client !== null) {
    accessTokenStore.client.isAuthenticated = false;
  }
}