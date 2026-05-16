/**
 * SSO 认证服务
 * 处理单点登录相关的认证流程
 */

import { env, getPathWithContextPath } from '@shared/env';
import { useAccessTokenStore } from '@platform/stores/token.store';
import type { AxiosRequestConfig } from 'axios';
import { dpopSign, fetchIamKeyId, fetchIamPublicKey } from '@/components/http/sign';
import { watch } from 'vue';
import { Generator } from '@shared/utils/generator';
import { generateClient } from '@shared/utils/jwt.util';
import { getHttpClient, HttpClient, type Result, type EnsureAccessTokenOptions } from '@/components/http';
import { pendingRequestManager } from '@/components/http/refresh-barrier';
import type { AuthHandler, TokenRefreshResult } from '@/platform/apps/auth-handler.type';
import type { Client } from '@/components/http';

class SSOService implements AuthHandler {
  private isAuthenticationPending: boolean = false;
  private isRefreshPending: boolean = false;
  private pendingSubscribers: ((token: string) => void)[] = [];
  private refreshPromise: Promise<{ token: string; tokenKid: string }> | null = null;
  /** HTTP 层「保证 access 可用」单飞 Promise，与 requestRefreshToken 内单飞配合 */
  private ensureAccessTokenPromise: Promise<void> | null = null;
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
      const redirectUri = currentOrigin + fullRedirectPath;
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

  /**
   * 在发业务请求或重试之前调用，保证当前 Pinia 里的 access token 仍然可用；若已过期则发起一次刷新。
   *
   * 并发时大家会撞上同一段刷新逻辑，因此用 `ensureAccessTokenPromise` 做单飞：后来的调用不再新开刷新，
   * 而是附在同一条 Promise 上，等前一次跑完即可——效果上等价于「多人共用一个闸机」。
   *
   * 「屏障」指的是：刷新链路在 `requestRefreshToken` 里是分几步走的异步过程，单靠「函数返回」
   * 并不能可靠地告诉外层的 `await`「整段流程已经收尾」。于是在真正刷新前先向 `pendingRequestManager`
   * 登记一条待完成的 Promise，刷新成功或失败时由同一套代码路径去 resolve / reject 它。
   * 这样 `await barrier` 等到的就是「token 已落库、可以安心继续」或「刷新已失败、应走错误处理」，
   * 而不是某一步中间态；若编排有疏漏，还有超时兜底，避免永远挂死在这条等待上。
   *
   * `force: true`：网关已明确判过期（如业务码 `gateway.40002`、HTTP 401）时使用，
   * 跳过「本地 JWT 仍显示未过期」的早退，避免重试仍带旧 access。
   */
  public async ensureAccessToken(opts?: EnsureAccessTokenOptions): Promise<void> {
    const store = this.getAccessTokenStore();
    if (!opts?.force && store.isAccessTokenValid) {
      return;
    }

    if (!store.isLogin) {
      throw new Error('NO_LOGIN');
    }

    if (this.ensureAccessTokenPromise) {
      return this.ensureAccessTokenPromise;
    }

    const run = (async () => {
      const barrier = pendingRequestManager.waitForRefresh();
      await this.requestRefreshToken({ grantType: 'refresh_token' });
      await barrier;
    })();

    this.ensureAccessTokenPromise = run.finally(() => {
      this.ensureAccessTokenPromise = null;
    });

    return this.ensureAccessTokenPromise;
  }

  // 获取应用的签名
  public async callSignApi(httpClient: HttpClient, data: any, headerDPoP: string, jti: string): Promise<string> {
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
   * 刷新 token（实现 AuthHandler 接口；供微前端 `TOKEN_INVALID` 等「外部已判失效」场景）
   * 始终强制走刷新编排，避免本地 JWT 仍显示未过期时把旧 token 回传给子应用。
   */
  public async refreshToken(): Promise<TokenRefreshResult> {
    await this.ensureAccessToken({ force: true });
    const latestStore = this.getAccessTokenStore();
    const httpClient = getHttpClient('auth');
    const iamKeyId = await fetchIamKeyId(httpClient);

    return {
      token: latestStore.tokenString!,
      tokenKid: iamKeyId,
      client: latestStore.client as Client | undefined,
    };
  }

  /**
   * 刷新 token 的“实际调用者”（发起 HTTP 请求到 token endpoint）
   * 刷新成功后会写入 tokenStore，并返回 token（以及内部所需的 keyId）
   */
  public async requestRefreshToken(requestData: { grantType: string, userId?: string | number | null }): Promise<{ token: string; tokenKid: string }> {
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

        // 刷新成功：解除 pending 屏障（与 ensureAccessToken 内 waitForRefresh 对齐）
        pendingRequestManager.resolveRefresh();

        return tokenResult;
      } catch (error) {
        console.error('刷新 token 失败:', error);

        // 刷新失败：拒绝屏障，使 ensureAccessToken 内 await barrier 失败
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

    // 监听 tokenExpired 状态（UI / 兼容）：统一走 ensureAccessToken，不依赖 false→true 才触发
    this.stopWatchTokenExpired = watch(
      () => tokenStore.tokenExpired,
      async (tokenExpired) => {
        if (tokenExpired && tokenStore.isLogin) {
          try {
            await this.ensureAccessToken();
          } catch (error) {
            console.error('[SSOService] 自动刷新 token 失败:', error);
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
