import type { Result } from '@/components/http/types';
import { BackendError } from './BackendError';
import { AppError } from './AppError';
import { FrontendErrorCode } from './types';
import { FrontendError } from './FrontendError';
import { t } from '@platform/i18n';

/**
 * 从后端 Result 构建 BackendError
 */
export function createBackendErrorFromResult<T = any>(
  result: Result<T>,
  cause?: unknown,
): BackendError<T> {
  return new BackendError(result, { cause });
}

/**
 * 从 axios 错误对象构建统一的 AppError
 */
export function normalizeAxiosError(error: any): AppError {
  // 已经是应用内错误，直接返回
  if (error instanceof AppError) {
    return error;
  }

  const response = error?.response;
  const data = response?.data;

  // 后端返回了标准 Result 结构（包含 errorCode / errorMessage）
  if (data && typeof data === 'object' && 'errorCode' in data && 'errorMessage' in data) {
    return createBackendErrorFromResult(data as Result, error);
  }

  // 没有响应 -> 认为是网络错误
  if (!response) {
    return FrontendError.networkError(error);
  }

  // 兜底：未知错误
  return new AppError(error.message || t('G2_ERR_UNKNOWN', '请求失败'), {
    status: response.status,
    detail: data,
    cause: error,
  });
}
