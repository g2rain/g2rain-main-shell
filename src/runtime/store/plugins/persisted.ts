/**
 * Pinia 持久化配置
 * 用于统一管理各个 store 的持久化配置
 */

// localStorage 键名常量
export const STORAGE_KEYS = {
  TOKEN: 'g2rain_token',
  // 可以在这里添加其他 store 的存储键名
} as const;

/**
 * Store 持久化配置映射
 * 通过 store id 来匹配对应的持久化配置
 */
const persistConfigMap: Record<string, any> = {
  token: {
    key: STORAGE_KEYS.TOKEN,
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
