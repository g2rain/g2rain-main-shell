import { defineStore } from 'pinia';
import { jwtVerify } from 'jose';
import { publicKeyStringToJwk } from '@shared/utils/jwt.util';
import type { Token, ApplicationScope } from '@platform/types';
import type { Client } from '@/components/http';

export const useAccessTokenStore = defineStore('token', {
  state: () => ({
    client: null as Client | null,
    token: null as Token | null,
    tokenString: null as string | null,
    logged: false,
    status: 'NORMAL' as string,
    tokenExpired: false,
  }),
  getters: {
    isLogin(): boolean {
      if (!this.client || !this.token) return false;
      const now = new Date();
      const refreshExpireAt = new Date(this.token?.refreshExpireAt * 1000);
      return refreshExpireAt > now;
    },
    isAdminCompany(): boolean {
      return this.token?.adminCompany === true;
    },
    organId(): number | undefined {
      return this.token?.organId;
    },
    isAccessTokenValid(): boolean {
      if (!this.token?.expireAt) return false;
      const expireAt = new Date(this.token.expireAt * 1000);
      return expireAt > new Date();
    },
  },
  actions: {
    setTokenExpired(expired: boolean) {
      this.tokenExpired = expired;
    },
    async setTokens(tokenString: string, tokenKid: string, iamKeyId: string, publicKey: string) {
      try {
        if (tokenKid !== iamKeyId) throw new Error('TokenKid 不匹配');
        const publicKeyJwk = await publicKeyStringToJwk(publicKey);
        const { payload } = await jwtVerify(tokenString, publicKeyJwk);

        this.tokenString = tokenString;
        const rawOrganId = payload.organId;
        const organId = rawOrganId != null && rawOrganId !== '' ? Number(rawOrganId) : undefined;

        this.token = {
          clientId: (payload.clientId as string) || '',
          clientPublicKey: (payload.clientPublicKey as string) || '',
          applicationScopes: (payload.applicationScopes as ApplicationScope[]) || [],
          expireAt: (payload.expireAt as number) || 0,
          refreshExpireAt: (payload.refreshExpireAt as number) || 0,
          adminCompany: payload.adminCompany === true,
          organId: organId != null && !Number.isNaN(organId) ? organId : undefined,
        };

        this.logged = true;
        this.status = 'NORMAL';
      } catch (error) {
        console.error('Token 验证失败:', error);
        throw new Error('无效的 token');
      }
    },

    logout() {
      this.token = null;
      this.tokenString = null;
      this.client = null;
      this.tokenExpired = false;
      this.logged = false;
      this.status = 'LOGOUT';
    }
  }
});
