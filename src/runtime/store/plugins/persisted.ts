/**
 * Pinia 持久化配置
 * 用于统一管理各个 store 的持久化配置
 */

import { env } from '../../../shared/env';

/** Pre-namespaced key; migrate once when claims match this shell. */
const LEGACY_TOKEN_STORAGE_KEY = 'g2rain_token';

function getTokenStorageKey(): string {
  return `${LEGACY_TOKEN_STORAGE_KEY}:${env.VITE_APPLICATION_CODE}`;
}

/**
 * One-time migrate from shared legacy key when JWT claims include this shell's applicationCode.
 * Safe for same-origin multi-shell: only claim matching sessions move.
 */
function migrateLegacyTokenIfNeeded(): void {
  try {
    const storageKey = getTokenStorageKey();
    if (localStorage.getItem(storageKey)) return;
    const raw = localStorage.getItem(LEGACY_TOKEN_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as {
      token?: { applicationScopes?: Array<{ applicationCode?: string }> };
    };
    const code = env.VITE_APPLICATION_CODE;
    const scopes = parsed.token?.applicationScopes;
    const belongs =
      Array.isArray(scopes) && scopes.some((scope) => scope.applicationCode === code);
    if (!belongs) return;
    localStorage.setItem(storageKey, raw);
    localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
  } catch {
    /* ignore corrupt / private mode */
  }
}

migrateLegacyTokenIfNeeded();

// localStorage 键名常量（按 applicationCode 隔离，兼容同 origin 多独立 Shell）
export const STORAGE_KEYS = {
  get TOKEN() {
    return getTokenStorageKey();
  },
} as const;

/**
 * Store 持久化配置映射
 * 通过 store id 来匹配对应的持久化配置
 */
const persistConfigMap: Record<string, any> = {
  token: {
    key: getTokenStorageKey(),
    storage: localStorage,
    pick: ['client', 'token', 'tokenString', 'logged', 'tokenExpired'] as string[],
  },
  // 可以在这里添加其他 store 的持久化配置
};

/**
 * 获取指定 store 的持久化配置
 * @param storeId store 的 id（defineStore 的第一个参数）
 * @returns 持久化配置对象，如果不存在则返回 undefined
 */
export function getPersistConfig(storeId: string) {
  return persistConfigMap[storeId];
}
