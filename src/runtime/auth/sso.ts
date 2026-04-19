/**
 * SSO 认证服务
 * 处理单点登录相关的认证流程
 */

import { env, getPathWithContextPath } from '@shared/env';
import { useAccessTokenStore } from '@platform/stores/token.store';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { dpopSign, fetchIamKeyId, fetchIamPublicKey } from '@/components/http/sign';
import { watch } from 'vue';
import { Generator } from '@shared/utils/generator';
import { generateClient } from '@shared/utils/jwt.util';
import { getHttpClient, HttpClient, type Result } from '@/components/http';
import { pendingRequestManager } from '@/components/http/pending-request-manager';
import type { AuthHandler, TokenRefreshResult } from '@/platform/apps/auth-handler.type';
import type { Client } from '@/components/http';

class SSOService implements AuthHandler {
  private isAuthenticationPending: boolean = false;
  private isRefreshPending: boolean = false;
  private pendingSubscribers: ((token: string) => void)[] = [];
  private refreshPromise: Promise<{ token: string; tokenKid: string }> | null = null;
  private stopWatchTokenExpired: (() => void) | null = null;
  private stopWatchLogged: (() => void) | null = null;

  // 添加一个获取 store 的方法
  private getAccessTokenStore() {
    return useAccessTokenStore();
  }

  public async redirectToSSO(): Promise<void> {
    try {
      const accessTokenStore = this.getAccessTokenStore();

      // 如果 client 不存在，则初始化
      if (!accessTokenStore.client) {
        const client = await generateClient();
        accessTokenStore.client = client;
      }

      if (!accessTokenStore.client) {
        throw new Error('Client not initialized. Failed to generate client.');
      }

      const ssoBaseUrl = env.VITE_SSO_BASE_URL;
      const authEndpoint = env.VITE_AUTH_END_POINT;
      const redirectUriPath = env.VITE_REDIRECT_URI;

      // 构建完整的回调地址：当前应用的 base URL + context path + redirect URI
      const currentOrigin = window.location.origin;
      // 使用 getPathWithContextPath 函数处理路径拼接，避免双斜杠
      const fullRedirectPath = getPathWithContextPath(redirectUriPath);
      // 直接拼接 origin 和路径，确保路径以 / 开头
      const redirectUri = currentOrigin + (fullRedirectPath.startsWith('/') ? fullRedirectPath : '/' + fullRedirectPath);
      // 构建SSO认证URL
      const ssoUrl = new URL(ssoBaseUrl + authEndpoint);

      const params = new URLSearchParams({
        clientId: accessTokenStore.client.clientId,
        redirectUri: redirectUri,
        responseType: 'code',
        publicKey: JSON.stringify(accessTokenStore.client.publicKey),
      });

      ssoUrl.search = params.toString();

      // 跳转到SSO页面
      window.location.href = ssoUrl.toString();
    } catch (error) {
      console.error('SSO redirect error:', error);
      throw new Error('Failed to redirect to SSO');
    }
  }

  /**
   * 跳转到 SSO 的首页（Index.html）
   * 场景：需要进入 SSO 控制台 / 首页，而不是登录回调流程时使用
   */
  public async redirectToSSOIndex(): Promise<void> {
    try {
      const ssoBaseUrl = env.VITE_SSO_BASE_URL;
      // 默认跳转到 SSO 应用根下的 index.html
      const ssoIndexUrl = new URL('/auth/index.html', ssoBaseUrl);
      window.location.href = ssoIndexUrl.toString();
    } catch (error) {
      console.error('SSO index redirect error:', error);
      throw new Error('Failed to redirect to SSO index');
    }
  }

  // 创建 token
  public async generateToken(code: string): Promise<void> {
    if (this.isAuthenticationPending) {
      // 如果正在刷新，返回一个 Promise 等待刷新完成
      return new Promise((resolve) => {
        this.pendingSubscribers.push(() => {
          resolve();
        });
      });
    }

    this.isAuthenticationPending = true;
    // 使用按类型区分的 HttpClientInstance：auth 类型用于创建 token 相关的请求
    const httpClient = getHttpClient('auth');

    const accessTokenStore = this.getAccessTokenStore();
    const data = { code, grantType: 'authorization_code' };
    // 构建请求配置
    const headers: {
      DPoP: string;
      'Application-DPoP': string;
      'Content-Type': string;
    } = {
      DPoP: '',
      'Application-DPoP': '',
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    const jti = Generator.random();
    // 确保 data 为字符串类型
    const request: AxiosRequestConfig = {
      headers: headers, // 设置header
      params: '', // 可以根据需要附加参数
      data: data, // 刷新 token 时通常不需要传递数据
    };
    const dataArrayBuffer = await request.data.arrayBuffer;
    headers.DPoP = await dpopSign(
      env.VITE_TOKEN_END_POINT,
      'post',
      '',
      dataArrayBuffer,
      env.VITE_APPLICATION_CODE,
      accessTokenStore.client,
      jti,
    );
    headers['Application-DPoP'] = await this.callSignApi(
      httpClient,
      data,
      headers.DPoP,
      jti,
    );

    await httpClient
      .post<{ token: string; keyId: string }>(env.VITE_TOKEN_END_POINT, data, request)
      .then(async (response) => {
        // 返回的是 Result<{ token: string; keyId: string }> 格式
        const result = response as Result<{ token: string; keyId: string }>;
        if (result.status !== 200 && result.status !== 0) {
          throw new Error('GENERATE_TOKEN_FAILURE');
        }
        const { token, keyId } = result.data;
        // 获取 IAM keyId 和公钥（复用 auth 类型 HttpClient）
        const iamKeyId = await fetchIamKeyId(httpClient);
        const publicKey = await fetchIamPublicKey(httpClient);
        // 更新 token
        await this.getAccessTokenStore().setTokens(token, keyId, iamKeyId, publicKey);
      })
      .catch((error) => {
        // 刷新失败，清除 token
        this.pendingSubscribers = [];
        throw error;
      })
      .finally(() => {
        this.isAuthenticationPending = false;
      });
  }

  // 获取应用的签名
  public async callSignApi(
    httpClient: HttpClient,
    data: any,
    headerDPoP: string,
    jti: string,
  ): Promise<string> {
    try {
      const response = await httpClient.post<{ token: string }>('/lua/sign_code?jti=' + jti, data, {
        headers: {
          'Content-Type': 'application/json',
          DPoP: headerDPoP,
        },
      });
      // auth 类型的客户端返回的是直接数据，不是 Result 格式
      // 响应格式为 { token: "..." }，需要返回 token 属性的值
      const responseData = response as any as { token: string };
      return responseData.token;
    } catch (error) {
      console.error('Error calling sign API:', error);
      throw new Error('Failed to call sign API');
    }
  }

  /**
   * 刷新 token（实现 AuthHandler 接口）
   * @returns 返回刷新后的 token 信息，包含 client
   */
  public async refreshToken(): Promise<TokenRefreshResult> {
    const tokenStore = this.getAccessTokenStore();

    // 1. 先检查当前 access token 是否仍然有效，如果未过期则直接返回当前 token
    if (tokenStore.isAccessTokenValid && tokenStore.tokenString) {
      const httpClient = getHttpClient('auth');
      const iamKeyId = await fetchIamKeyId(httpClient);

      return {
        token: tokenStore.tokenString,
        tokenKid: iamKeyId,
        client: tokenStore.client as Client | undefined,
      };
    }

    // 2. 如果 token 已过期，则调用刷新逻辑获取新的 token
    const result = await this.requestRefreshToken({ grantType: 'refresh_token' });
    const latestStore = this.getAccessTokenStore();

    return {
      token: result.token,
      tokenKid: result.tokenKid,
      client: latestStore.client as Client | undefined,
    };
  }

  /**
   * 刷新 token 的“实际调用者”（发起 HTTP 请求到 token endpoint）
   * 刷新成功后会写入 tokenStore，并返回 token（以及内部所需的 keyId）
   */
  public async requestRefreshToken( requestData: { grantType: string , userId?: string | number | null}): Promise<{ token: string; tokenKid: string }> {
    // 如果正在刷新，返回现有的 Promise
    if (this.isRefreshPending && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshPending = true;
    const tokenStore = this.getAccessTokenStore();

    // 创建刷新 Promise
    this.refreshPromise = (async () => {
      try {
        if (!tokenStore.isLogin) {
          throw new Error('NO_LOGIN');
        }

        const httpClient = getHttpClient('auth');

        // 构建请求配置
        const bodyString = JSON.stringify(requestData);
        const bodyBytes = new TextEncoder().encode(bodyString);
        const jti = Generator.random();

        // 先计算 DPoP，再构建 headers
        const dpop = await dpopSign(
          env.VITE_TOKEN_END_POINT,
          'post',
          '',
          bodyBytes.buffer,
          env.VITE_APPLICATION_CODE,
          tokenStore.client,
          jti,
        );

        const headers: {
          Authorization: string;
          DPoP: string;
          'Content-Type': string;
        } = {
          Authorization: `Bearer ${tokenStore.tokenString}`,
          DPoP: dpop,
          'Content-Type': 'application/x-www-form-urlencoded',
        };

        // 调用刷新 token 接口
        // 返回的是 Result<{ token: string; keyId: string }> 格式
        const response = await httpClient.post<{ token: string; keyId: string }>(env.VITE_TOKEN_END_POINT, requestData, {
          headers,
        });

        const responseResult = response as Result<{ token: string; keyId: string }>;
        if (responseResult.status !== 200 && responseResult.status !== 0) {
          throw new Error('REFRESH_TOKEN_FAILURE');
        }

        const { token, keyId } = responseResult.data;
        // 获取 IAM keyId 和公钥
        const iamKeyId = await fetchIamKeyId(httpClient);
        const publicKey = await fetchIamPublicKey(httpClient);
        // 更新 token
        await tokenStore.setTokens(token, keyId, iamKeyId, publicKey);

        const tokenResult = { token, tokenKid: keyId };

        // 刷新成功，通知所有挂起的请求继续执行
        const latestTokenStore = this.getAccessTokenStore();
        pendingRequestManager.resolveRefresh({
          tokenString: latestTokenStore.tokenString,
          isAccessTokenValid: latestTokenStore.isAccessTokenValid,
          tokenExpired: latestTokenStore.tokenExpired,
          isLogin: latestTokenStore.isLogin,
          client: latestTokenStore.client,
          setTokenExpired: (expired: boolean) => latestTokenStore.setTokenExpired(expired),
        });

        return tokenResult;
      } catch (error) {
        console.error('刷新 token 失败:', error);

        // 刷新失败，通知所有挂起的请求失败
        const refreshError = error instanceof Error ? error : new Error('TOKEN_REFRESH_FAILED');
        pendingRequestManager.rejectRefresh(refreshError);

        throw refreshError;
      } finally {
        this.isRefreshPending = false;
        this.refreshPromise = null;
        // 重置 tokenExpired 状态
        const tokenStore = this.getAccessTokenStore();
        tokenStore.setTokenExpired(false);
      }
    })();

    return this.refreshPromise;
  }

  /**
   * 切换 token（根据 userId 获取新 token）
   * @param userId 目标用户标识
   * @returns 返回切换后的 token 信息，包含 client
   */
  public async switchToken(userId: string | number): Promise<TokenRefreshResult> {
    const result = await this.requestRefreshToken({ grantType: 'exchange_token', userId: userId });
    const latestStore = this.getAccessTokenStore();

    return {
      token: result.token,
      tokenKid: result.tokenKid,
      client: latestStore.client as Client | undefined,
    };
  }

  /**
   * 启动 Token 状态监听
   * 监听 token 变化并自动处理刷新或跳转
   */
  public start(): void {
    // 如果已经有 watch 在运行，先停止
    this.stop();
    const tokenStore = this.getAccessTokenStore();
    const currentPath = window.location.pathname;

    // SSO 回调路径（与 VITE_CONTEXT_PATH 无关：以 /sso_callback 结尾即可）
    if (currentPath.endsWith('/sso_callback')) {
      console.log('[SSOService] Current path is SSO callback, skipping SSO redirect.');
      return;
    }
    // 立即检查 isLogin 状态，确保首次加载时如果未登录跳转到 SSO
    if (!tokenStore.isLogin && (!tokenStore.status || tokenStore.status === 'NORMAL')) {
      this.redirectToSSO().catch((error) => {
        console.error('[SSOService] 启动时跳转 SSO 失败:', error);
      });
    }

    // 监听 tokenExpired 状态，自动刷新 token
    this.stopWatchTokenExpired = watch(
      () => tokenStore.tokenExpired,
      async (tokenExpired) => {
        if (tokenExpired && tokenStore.isLogin && !this.isRefreshPending) {
          try {
            await this.requestRefreshToken({ grantType: 'refresh_token' });
          } catch (error) {
            console.error('[SSOService] 自动刷新 token 失败:', error);
            // 刷新失败，可能需要重新登录
            if (tokenStore.status === 'NORMAL') {
              await this.redirectToSSO();
            }
          }
        }
      },
    );

    // 监听 logged 状态
    this.stopWatchLogged = watch(
      () => tokenStore.logged, // 监听 tokenStore.logged
      async (newLogged) => {
        // 如果状态是 SSO 或 LOGOUT 时，不执行跳转
        if (tokenStore.status === 'SSO' || tokenStore.status === 'LOGOUT') {
          return; // 不执行跳转
        }

        // 如果用户未登录且状态为 NORMAL，执行跳转
        if (!newLogged && tokenStore.status === 'NORMAL') {
          await this.redirectToSSO();
        }
      },
      { immediate: true }, // 立即执行一次检查
    );

    console.log('[SSOService] 已启动 Token 状态监听');
  }

  /**
   * 停止 Token 状态监听（用于清理）
   */
  public stop(): void {
    if (this.stopWatchTokenExpired) {
      this.stopWatchTokenExpired();
      this.stopWatchTokenExpired = null;
    }
    if (this.stopWatchLogged) {
      this.stopWatchLogged();
      this.stopWatchLogged = null;
    }
  }
}

export const sso = new SSOService();
