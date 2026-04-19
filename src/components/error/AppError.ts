import type { AppErrorOptions, ErrorSource } from './types';

/**
 * 应用内统一错误基类
 * - 保留完整堆栈信息
 * - 兼容后端错误和前端错误
 */
export class AppError extends Error {
  errorCode?: string;
  status?: number;
  source: ErrorSource;
  requestId?: string;
  requestTime?: string;
  detail?: any;
  cause?: unknown;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);

    this.name = new.target.name;
    this.errorCode = options.errorCode;
    this.status = options.status;
    this.source = options.source ?? 'UNKNOWN';
    this.requestId = options.requestId;
    this.requestTime = options.requestTime;
    this.detail = options.detail;
    this.cause = options.cause;

    // 修正原型链，保证 instanceof 正常工作
    Object.setPrototypeOf(this, new.target.prototype);

    // 保留完整堆栈，便于排查问题
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, new.target);
    }
  }
}
