/**
 * Shell HTTP assembly on @g2rain/http.
 * - business: withAuth → `{contextPath}/api`
 * - auth / sign: withAuth false → same-origin Context Path
 *
 * Local `src/components/http` remains for mock helpers until Phase 7 cleanup.
 */

import {
  createHttpClient,
  type EnsureAccessTokenOptions,
  type HttpAuthSession,
  type HttpClient,
  type HttpClientInstance,
  type Result,
} from '@g2rain/http';
import { loadingManager } from '@/components/loading';
import { getApplicationCode, getContextPath } from '@shared/env';
import { useAccessTokenStore } from '@platform/stores/token.store';
import { useLocaleStore } from '@platform/stores/locale.store';

let businessClient: HttpClientInstance | undefined;
let authClient: HttpClientInstance<true> | undefined;
let signClient: HttpClientInstance<true> | undefined;

function authSessionProvider(): HttpAuthSession {
  const store = useAccessTokenStore();
  return {
    client: store.client,
    isLogin: store.isLogin,
    isAccessTokenValid: store.isAccessTokenValid,
    tokenExpired: store.tokenExpired,
    tokenString: store.tokenString,
    setTokenExpired: (expired) => store.setTokenExpired(expired),
  };
}

export function initHttpClient(): HttpClientInstance {
  if (businessClient) return businessClient;

  const ensureAccessToken = async (opts?: EnsureAccessTokenOptions): Promise<void> => {
    const { sso } = await import('../auth/sso');
    await sso.ensureAccessToken(opts);
  };

  const authErrorHandler = async (
    reason: 'NO_LOGIN' | 'TOKEN_REFRESH_FAILED',
    error: unknown,
  ): Promise<void> => {
    console.warn(`[shell-http] auth error: ${reason}`, error);
    loadingManager.hide();
    const store = useAccessTokenStore();
    if (store.client) {
      store.client = { ...store.client, isAuthenticated: false };
    }
    const { sso } = await import('../auth/sso');
    await sso.redirectToSSO();
  };

  const shellBaseURL = getContextPath();
  const sameOriginBase = shellBaseURL === '/' ? undefined : shellBaseURL;
  const apiBaseURL =
    shellBaseURL === '/' || shellBaseURL === '' ? '/api' : `${shellBaseURL}/api`;

  businessClient = createHttpClient({
    baseURL: apiBaseURL,
    withAuth: true,
    dpop: { applicationCode: getApplicationCode() },
    authSessionProvider,
    ensureAccessToken,
    authErrorHandler,
    getLocale: () => useLocaleStore().locale || undefined,
  });

  authClient = createHttpClient({
    baseURL: sameOriginBase,
    withAuth: false,
    isDirectResponse: true,
  });

  signClient = createHttpClient({
    baseURL: sameOriginBase,
    withAuth: false,
    isDirectResponse: true,
  });

  return businessClient;
}

/** @deprecated Use initHttpClient; kept for boot call sites during migration. */
export function initHttp(): void {
  initHttpClient();
}

export function getBusinessHttpClient(): HttpClientInstance {
  if (!businessClient) {
    throw new Error('HTTP client is not initialized. Call initHttpClient from the composition root.');
  }
  return businessClient;
}

export function getAuthHttpClient(): HttpClientInstance<true> {
  if (!authClient) {
    initHttpClient();
  }
  if (!authClient) {
    throw new Error('Auth HTTP client is not initialized');
  }
  return authClient;
}

export function getSignHttpClient(): HttpClientInstance<true> {
  if (!signClient) {
    initHttpClient();
  }
  if (!signClient) {
    throw new Error('Sign HTTP client is not initialized');
  }
  return signClient;
}

/**
 * Compatibility shim for call sites that used local getHttpClient('default'|'auth').
 */
export function getHttpClient(type?: 'default'): HttpClient;
export function getHttpClient(type: 'auth'): HttpClient<true>;
export function getHttpClient(type: 'default' | 'auth' = 'default'): HttpClient | HttpClient<true> {
  if (type === 'auth') {
    return getAuthHttpClient().client;
  }
  return getBusinessHttpClient().client;
}

export type { Result, HttpClient, EnsureAccessTokenOptions };
export { refreshBarrier } from './refresh-barrier';
export { fetchIamKeyId, fetchIamPublicKey, clearIamKeyCache } from './iam-keys';
