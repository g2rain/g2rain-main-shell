/**
 * 请求挂起队列管理
 * 用于在 Token 刷新期间管理挂起的 HTTP 请求
 */

import type { InternalAxiosRequestConfig } from 'axios';
import type { HttpAuthSession } from './types';

type PendingRequest = {
  resolve: (value: InternalAxiosRequestConfig) => void;
  reject: (error: Error) => void;
  config: InternalAxiosRequestConfig;
};

/**
 * 请求挂起队列管理
 */
export class PendingRequestManager {
  private isRefreshPending = false;
  private pendingRequests: PendingRequest[] = [];

  private refreshPromise: Promise<void> | null = null;
  private resolveRefreshPromise: (() => void) | null = null;
  private rejectRefreshPromise: ((error: Error) => void) | null = null;
  private refreshTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /**
   * 等待刷新完成
   * 如果已经在刷新，返回现有的 Promise；否则创建新的 Promise
   */
  waitForRefresh(): Promise<void> {
    // 如果已经在刷新，返回现有的 Promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // 标记为正在刷新
    this.isRefreshPending = true;

    // 创建新的 Promise
    this.refreshPromise = new Promise<void>((resolve, reject) => {
      this.resolveRefreshPromise = resolve;
      this.rejectRefreshPromise = reject;
    });

    // 设置 10 秒超时保护
    this.refreshTimeoutId = setTimeout(() => {
      this.rejectRefresh(new Error('TOKEN_REFRESH_TIMEOUT'));
    }, 10000);

    return this.refreshPromise;
  }

  /**
   * 添加挂起的请求
   */
  addPendingRequest(
    config: InternalAxiosRequestConfig,
    resolve: (value: InternalAxiosRequestConfig) => void,
    reject: (error: Error) => void,
  ): void {
    this.pendingRequests.push({ config, resolve, reject });
  }

  /**
   * 刷新成功，通知所有挂起的请求继续执行
   */
  resolveRefresh(authSession: HttpAuthSession): void {
    if (!this.isRefreshPending && !this.refreshPromise) {
      return;
    }

    this.isRefreshPending = false;
    this.clearRefreshTimeout();

    // 通知所有挂起的请求
    this.pendingRequests.forEach(({ config, resolve }) => {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${authSession.tokenString}`;
      resolve(config);
    });
    this.pendingRequests = [];

    // 解析刷新 Promise
    this.resolveRefreshPromise?.();
    this.resetRefreshPromise();
  }

  /**
   * 刷新失败，拒绝所有挂起的请求
   */
  rejectRefresh(error: Error): void {
    if (!this.isRefreshPending && !this.refreshPromise) {
      return;
    }

    this.isRefreshPending = false;
    this.clearRefreshTimeout();

    // 拒绝所有挂起的请求
    this.pendingRequests.forEach(({ reject }) => {
      reject(error);
    });
    this.pendingRequests = [];

    // 拒绝刷新 Promise
    this.rejectRefreshPromise?.(error);
    this.resetRefreshPromise();
  }

  /**
   * 清除所有挂起的请求
   */
  clearPendingRequests(): void {
    this.rejectRefresh(new Error('TOKEN_REFRESH_CLEARED'));
  }

  /**
   * 检查是否正在刷新
   */
  isRefreshing(): boolean {
    return this.isRefreshPending;
  }

  /**
   * 清除刷新超时定时器
   */
  private clearRefreshTimeout(): void {
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
  }

  /**
   * 重置刷新 Promise 相关状态
   */
  private resetRefreshPromise(): void {
    this.refreshPromise = null;
    this.resolveRefreshPromise = null;
    this.rejectRefreshPromise = null;
  }
}

// 创建全局的请求挂起管理器单例
export const pendingRequestManager = new PendingRequestManager();
