import { AppError } from './AppError';
import type { AppErrorOptions } from './types';
import type { Result } from '@/components/http/types';

/**
 * 后端 Result<T> 对应的错误类型
 * - 与 Result 字段保持一致：status、errorCode、errorMessage、requestId 等
 */
export class BackendError<T = any> extends AppError {
  override source: 'BACKEND' = 'BACKEND';
  result?: Result<T>;

  constructor(result: Result<T>, options: Partial<AppErrorOptions> = {}) {
    super(result.errorMessage || '后端请求失败', {
      errorCode: result.errorCode,
      status: result.status,
      source: 'BACKEND',
      requestId: result.requestId,
      requestTime: result.requestTime,
      detail: result.data,
      ...options,
    });

    this.result = result;
  }
}
