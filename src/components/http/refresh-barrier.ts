/**
 * Token 刷新「屏障」协调器（单例）
 * 与 SSO `ensureAccessToken` / `requestRefreshToken` 配对的屏障状态机
 *
 * 设计背景：
 * - 业务侧通过 `sso.ensureAccessToken()` 单飞刷新；刷新前会先 `waitForRefresh()` 注册一条屏障 Promise。
 * - `requestRefreshToken` 在成功/失败时必须调用 `resolveRefresh()` / `rejectRefresh()`，与屏障对齐，
 *   使 `ensureAccessToken` 内 `await barrier` 能结束，避免逻辑漏唤醒时无限挂起。
 * - 并发「排队」由 `ensureAccessToken` 的共享 Promise 完成，此处不再维护 per-request 的 config 队列。
 *
 * 10s 超时：兜底「未 resolve/reject」的异常路径，与底层 HTTP timeout 互补（防编排层死锁）
 */
export class PendingRequestManager {
  private isRefreshPending = false;

  private refreshPromise: Promise<void> | null = null;
  private resolveRefreshPromise: (() => void) | null = null;
  private rejectRefreshPromise: ((error: Error) => void) | null = null;
  private refreshTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /**
   * 注册或复用「等待刷新完成」的屏障 Promise。
   * 首次调用创建 Promise；同一轮刷新内后续调用复用同一实例。
   */
  waitForRefresh(): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshPending = true;

    this.refreshPromise = new Promise<void>((resolve, reject) => {
      this.resolveRefreshPromise = resolve;
      this.rejectRefreshPromise = reject;
    });

    this.refreshTimeoutId = setTimeout(() => {
      this.rejectRefresh(new Error('TOKEN_REFRESH_TIMEOUT'));
    }, 10000);

    return this.refreshPromise;
  }

  /**
   * 刷新成功：解除屏障并清理超时定时器。
   */
  resolveRefresh(): void {
    if (!this.isRefreshPending && !this.refreshPromise) {
      return;
    }

    this.isRefreshPending = false;
    this.clearRefreshTimeout();

    this.resolveRefreshPromise?.();
    this.resetRefreshPromise();
  }

  /**
   * 刷新失败：拒绝屏障（`ensureAccessToken` 内 `await barrier` 会 reject）。
   */
  rejectRefresh(error: Error): void {
    if (!this.isRefreshPending && !this.refreshPromise) {
      return;
    }

    this.isRefreshPending = false;
    this.clearRefreshTimeout();

    this.rejectRefreshPromise?.(error);
    this.resetRefreshPromise();
  }

  /**
   * 强制结束当前屏障（如拦截器 catch 中清理），等价于以 TOKEN_REFRESH_CLEARED 拒绝。
   */
  clearPendingRequests(): void {
    this.rejectRefresh(new Error('TOKEN_REFRESH_CLEARED'));
  }

  private clearRefreshTimeout(): void {
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
  }

  private resetRefreshPromise(): void {
    this.refreshPromise = null;
    this.resolveRefreshPromise = null;
    this.rejectRefreshPromise = null;
  }
}

export const pendingRequestManager = new PendingRequestManager();
