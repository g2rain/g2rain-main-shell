/**
 * SSO 认证服务 — 使用 @g2rain/http auth/sign 客户端
 */

import { watch } from 'vue';
import {
  createDpopProof,
  type DpopClient,
  type EnsureAccessTokenOptions,
  type Result,
} from '@g2rain/http';
import {
  env,
  getApplicationCode,
  getAuthEndPoint,
  getPathWithContextPath,
  getRedirectUriPath,
  getSsoBaseUrl,
  getTokenEndPoint,
  isAuthPublicPath,
} from '@shared/env';
import { useAccessTokenStore } from '@platform/stores/token.store';
import { Generator } from '@shared/utils/generator';
import { generateClient } from '@shared/utils/jwt.util';
import type { AuthHandler, TokenRefreshResult } from '@/platform/apps/auth-handler.type';
import { saveReturnUrl, peekReturnUrl } from '@runtime/navigation/sub-app-redirect';
import {
  fetchIamKeyId,
  fetchIamPublicKey,
  getAuthHttpClient,
  getSignHttpClient,
  refreshBarrier,
} from '../http';

class SSOService implements AuthHandler {
  private isAuthenticationPending = false;
  private isRefreshPending = false;
  private pendingSubscribers: Array<() => void> = [];
  private refreshPromise: Promise<{ token: string; tokenKid: string }> | null = null;
  private ensureAccessTokenPromise: Promise<void> | null = null;
  private stopWatchTokenExpired: (() => void) | null = null;
  private stopWatchLogged: (() => void) | null = null;

  private getAccessTokenStore() {
    return useAccessTokenStore();
  }

  private createTokenProof(url: string, data: unknown, client: DpopClient | null, jti: string) {
    if (!client) throw new Error('DPoP client is required');
    return createDpopProof({
      url,
      method: 'post',
      params: '',
      data,
      applicationCode: getApplicationCode(),
      client,
      jti,
    });
  }

  private async callSignApi(data: unknown, headerDPoP: string, jti: string): Promise<string> {
    const http = getSignHttpClient();
    const response = await http.client.post<{ token: string }>(`/lua/sign_code?jti=${jti}`, data, {
      headers: {
        'Content-Type': 'application/json',
        DPoP: headerDPoP,
      },
    });
    const body = response as unknown as { token?: string };
    if (!body.token) {
      throw new Error('Failed to obtain Application-DPoP');
    }
    return body.token;
  }

  public async redirectToSSO(): Promise<void> {
    try {
      const accessTokenStore = this.getAccessTokenStore();

      if (!accessTokenStore.client) {
        accessTokenStore.client = await generateClient();
      }

      if (!accessTokenStore.client) {
        throw new Error('Client not initialized. Failed to generate client.');
      }

      const ssoBaseUrl = getSsoBaseUrl() || env.VITE_SSO_BASE_URL;
      if (!ssoBaseUrl) {
        throw new Error('VITE_SSO_BASE_URL is not configured');
      }

      const authEndpoint = getAuthEndPoint();
      const redirectUriPath = getRedirectUriPath();
      const currentOrigin = window.location.origin;
      const fullRedirectPath = getPathWithContextPath(redirectUriPath);
      const redirectUri = currentOrigin + fullRedirectPath;
      const ssoUrl = new URL(ssoBaseUrl + authEndpoint);

      const params = new URLSearchParams({
        clientId: accessTokenStore.client.clientId,
        redirectUri,
        responseType: 'code',
        publicKey: JSON.stringify(accessTokenStore.client.publicKey),
        applicationCode: getApplicationCode(),
      });

      ssoUrl.search = params.toString();

      if (!peekReturnUrl()) {
        saveReturnUrl();
      }

      window.location.href = ssoUrl.toString();
    } catch (error) {
      console.error('SSO redirect error:', error);
      throw new Error('Failed to redirect to SSO');
    }
  }

  public async redirectToSSOIndex(): Promise<void> {
    try {
      const ssoBaseUrl = getSsoBaseUrl() || env.VITE_SSO_BASE_URL;
      if (!ssoBaseUrl) {
        throw new Error('VITE_SSO_BASE_URL is not configured');
      }
      const ssoIndexUrl = new URL('/auth/index.html', ssoBaseUrl);
      window.location.href = ssoIndexUrl.toString();
    } catch (error) {
      console.error('SSO index redirect error:', error);
      throw new Error('Failed to redirect to SSO index');
    }
  }

  public async generateToken(code: string): Promise<void> {
    if (this.isAuthenticationPending) {
      return new Promise((resolve) => {
        this.pendingSubscribers.push(() => resolve());
      });
    }

    this.isAuthenticationPending = true;
    const store = this.getAccessTokenStore();
    const http = getAuthHttpClient();
    const data = { code, grantType: 'authorization_code' };
    const jti = Generator.random();
    const dpop = await this.createTokenProof(getTokenEndPoint(), data, store.client, jti);
    const applicationDpop = await this.callSignApi(data, dpop, jti);

    try {
      const response = await http.client.post<{ token: string; keyId: string }>(
        getTokenEndPoint(),
        data,
        {
          headers: {
            DPoP: dpop,
            'Application-DPoP': applicationDpop,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const result = response as unknown as Result<{ token: string; keyId: string }>;
      if (result.status !== 200 && result.status !== 0) {
        throw new Error('GENERATE_TOKEN_FAILURE');
      }
      const { token, keyId } = result.data;
      const signHttp = getSignHttpClient();
      const iamKeyId = await fetchIamKeyId(signHttp.client);
      const publicKey = await fetchIamPublicKey(signHttp.client);
      await store.setTokens(token, keyId, iamKeyId, publicKey);
      this.pendingSubscribers.splice(0).forEach((fn) => fn());
    } catch (error) {
      this.pendingSubscribers = [];
      throw error;
    } finally {
      this.isAuthenticationPending = false;
    }
  }

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
      const barrier = refreshBarrier.waitForRefresh();
      await this.requestRefreshToken({ grantType: 'refresh_token' });
      await barrier;
    })();

    this.ensureAccessTokenPromise = run.finally(() => {
      this.ensureAccessTokenPromise = null;
    });

    return this.ensureAccessTokenPromise;
  }

  public async refreshToken(): Promise<TokenRefreshResult> {
    await this.ensureAccessToken({ force: true });
    const latestStore = this.getAccessTokenStore();
    const iamKeyId = await fetchIamKeyId(getSignHttpClient().client);

    return {
      token: latestStore.tokenString!,
      tokenKid: iamKeyId,
      client: latestStore.client ?? undefined,
    };
  }

  public async requestRefreshToken(requestData: {
    grantType: string;
    userId?: string | number | null;
  }): Promise<{ token: string; tokenKid: string }> {
    if (this.isRefreshPending && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshPending = true;
    const tokenStore = this.getAccessTokenStore();

    this.refreshPromise = (async () => {
      try {
        if (!tokenStore.isLogin || !tokenStore.tokenString) {
          throw new Error('NO_LOGIN');
        }

        const http = getAuthHttpClient();
        const jti = Generator.random();
        const dpop = await this.createTokenProof(
          getTokenEndPoint(),
          requestData,
          tokenStore.client,
          jti,
        );

        const response = await http.client.post<{ token: string; keyId: string }>(
          getTokenEndPoint(),
          requestData,
          {
            headers: {
              Authorization: `Bearer ${tokenStore.tokenString}`,
              DPoP: dpop,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        );

        const responseResult = response as unknown as Result<{ token: string; keyId: string }>;
        if (responseResult.status !== 200 && responseResult.status !== 0) {
          throw new Error('REFRESH_TOKEN_FAILURE');
        }

        const { token, keyId } = responseResult.data;
        const signHttp = getSignHttpClient();
        const iamKeyId = await fetchIamKeyId(signHttp.client);
        const publicKey = await fetchIamPublicKey(signHttp.client);
        await tokenStore.setTokens(token, keyId, iamKeyId, publicKey);

        refreshBarrier.resolveRefresh();
        return { token, tokenKid: keyId };
      } catch (error) {
        console.error('刷新 token 失败:', error);
        const refreshError = error instanceof Error ? error : new Error('TOKEN_REFRESH_FAILED');
        refreshBarrier.rejectRefresh(refreshError);
        throw refreshError;
      } finally {
        this.isRefreshPending = false;
        this.refreshPromise = null;
        this.getAccessTokenStore().setTokenExpired(false);
      }
    })();

    return this.refreshPromise;
  }

  public async switchToken(userId: string | number): Promise<TokenRefreshResult> {
    const result = await this.requestRefreshToken({ grantType: 'exchange_token', userId });
    const latestStore = this.getAccessTokenStore();

    return {
      token: result.token,
      tokenKid: result.tokenKid,
      client: latestStore.client ?? undefined,
    };
  }

  public start(): void {
    this.stop();
    const tokenStore = this.getAccessTokenStore();

    if (isAuthPublicPath(window.location.pathname)) {
      console.log('[SSOService] Auth public path, skipping SSO redirect.');
      return;
    }

    if (!tokenStore.isLogin && (!tokenStore.status || tokenStore.status === 'NORMAL')) {
      this.redirectToSSO().catch((error) => {
        console.error('[SSOService] 启动时跳转 SSO 失败:', error);
      });
    }

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

    this.stopWatchLogged = watch(
      () => tokenStore.logged,
      async (newLogged) => {
        if (tokenStore.status === 'SSO' || tokenStore.status === 'LOGOUT') {
          return;
        }
        if (!newLogged && tokenStore.status === 'NORMAL') {
          await this.redirectToSSO();
        }
      },
      { immediate: true },
    );

    console.log('[SSOService] 已启动 Token 状态监听');
  }

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
