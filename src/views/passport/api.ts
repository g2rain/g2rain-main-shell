/**
 * passport 相关 API 服务
 */

import { getHttpClient, type Result } from '@/components/http';
import { getPathWithContextPath } from '@shared/env';
import { useAccessTokenStore } from '@platform/stores/token.store';
import type {
  DingTalkBindStartRequest,
  DingTalkBindStartResponse,
  Passport,
  PassportIdpBinding,
  PassportIdpBindingQuery,
  PassportPayload,
} from './type';

// 导入 mock 数据以触发自动注册（副作用导入）
import './mock';

const DINGTALK_BIND_START_PATH = '/auth/dingtalk/bind/passport/start';

export class PassportApi {
  static async save(payload: PassportPayload): Promise<Passport> {
    const httpClient = getHttpClient('default');
    const res = await httpClient.post<Passport>('/basis/passport/save', payload);
    return res.data;
  }

  static async changePassword(
    id: string | number,
    payload: {
      oldPassword: string;
      newPassword: string;
    }
  ): Promise<void> {
    const httpClient = getHttpClient('default');
    await httpClient.post(`/basis/passport/${id}/password`, payload);
  }
}

/** Basis：通行证 IdP 绑定查询 */
export class PassportIdpBindingApi {
  static async listByPassport(passportId: number): Promise<PassportIdpBinding[]> {
    const http = getHttpClient('default');
    const params: PassportIdpBindingQuery = { passportId };
    const res = await http.get<PassportIdpBinding[]>('/basis/passport_idp_binding/list', params);
    return res.data ?? [];
  }
}

/** IAM：已登录通行证发起钉钉扫码绑定 */
export const IdpBindApi = {
  start(body: DingTalkBindStartRequest) {
    const tokenStore = useAccessTokenStore();
    if (!tokenStore.tokenString) {
      return Promise.reject(new Error('NO_LOGIN'));
    }
    return getHttpClient('auth').post<Result<DingTalkBindStartResponse>>(DINGTALK_BIND_START_PATH, body, {
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
