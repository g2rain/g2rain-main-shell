/**
 * 认证处理器接口
 * 用于处理 token 刷新等认证相关操作
 */

import type { Client } from '@/components/http';

/**
 * Token 刷新结果
 */
export interface TokenRefreshResult {
  /** 访问令牌 */
  token: string;
  /** Token 的 kid（密钥 ID） */
  tokenKid: string;
  /** 客户端信息（可选） */
  client?: Client;
}

/**
 * 认证处理器接口
 */
export interface AuthHandler {
  /**
   * 刷新 token
   * @returns 返回刷新后的 token 信息
   * @throws 如果刷新失败，抛出错误
   */
  refreshToken(): Promise<TokenRefreshResult>;
}
