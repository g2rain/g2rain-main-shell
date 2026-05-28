import { getHttpClient, type Result } from '@/components/http';
import { getPathWithContextPath } from '@shared/env';
import { useAccessTokenStore } from '@platform/stores/token.store';

export interface DingTalkBindStartRequest {
  bindMode?: string;
  returnUrl?: string;
}

export interface DingTalkBindStartResponse {
  gotoUrl: string;
}

const START_PATH = '/auth/dingtalk/bind/passport/start';

export const IdpBindApi = {
  start(body: DingTalkBindStartRequest) {
    const tokenStore = useAccessTokenStore();
    if (!tokenStore.tokenString) {
      return Promise.reject(new Error('NO_LOGIN'));
    }
    return getHttpClient('auth').post<Result<DingTalkBindStartResponse>>(START_PATH, body, {
      headers: {
        Authorization: `Bearer ${tokenStore.tokenString}`,
      },
    });
  },
};

export function buildBindReturnUrl(): string {
  if (typeof window === 'undefined') {
    return getPathWithContextPath('/passport/bind-result');
  }
  return window.location.origin + getPathWithContextPath('/passport/bind-result');
}

export function parseIamResult<T>(result: Result<T>): T {
  if (result.status !== 200 && result.status !== 0) {
    throw new Error(result.errorMessage || '请求失败');
  }
  return result.data;
}
