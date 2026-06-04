/**
 * 全局环境变量访问工具（shared 层）
 * - 封装对 window._env_ 和 import.meta.env 的访问
 * - 提供与原 @runtime/env 相同的 env / getPathWithContextPath 能力
 */

function getEnvVar(key: string, defaultValue = ''): string {
  if (typeof window !== 'undefined' && (window as any)._env_) {
    const runtimeValue = (window as any)._env_[key];
    if (runtimeValue !== undefined && runtimeValue !== null && runtimeValue !== '') {
      if (
        typeof runtimeValue === 'string' &&
        !runtimeValue.startsWith('__') &&
        !runtimeValue.endsWith('__')
      ) {
        return runtimeValue;
      }
    }
  }

  if (import.meta.env && (import.meta.env as any)[key]) {
    const buildTimeValue = (import.meta.env as any)[key] as string;
    if (!buildTimeValue.startsWith('__') || !buildTimeValue.endsWith('__')) {
      return buildTimeValue;
    }
  }

  return defaultValue;
}

function getEnvBoolean(key: string, defaultValue = false): boolean {
  const value = getEnvVar(key, '');
  if (value === '') {
    return defaultValue;
  }
  return value.toLowerCase() === 'true';
}

export type SharedEnv = {
  VITE_APPLICATION_CODE: string;
  VITE_CONTEXT_PATH: string;
  VITE_TOKEN_END_POINT: string;
  VITE_SSO_BASE_URL: string;
  VITE_AUTH_END_POINT: string;
  VITE_REDIRECT_URI: string;
  VITE_MOCK_ENABLED: boolean;
  VITE_DINGTALK_BIND_MODE: string;
  /** 国际化文案包 tags（逗号分隔，与 i18n_message.tag 一致） */
  VITE_I18N_TAGS: string;
};

/**
 * env 使用“懒读取/动态读取”：
 * - 避免 env-config.js 通过动态 script 加载时序导致初始化时取不到值
 * - 每次访问 env.xxx 时，都从 window._env_ / import.meta.env 实时读取
 */
export const env: SharedEnv = new Proxy({} as SharedEnv, {
  get(_target, prop: string | symbol) {
    if (prop === 'VITE_APPLICATION_CODE') return getEnvVar('VITE_APPLICATION_CODE', 'g2rain-main-shell');
    if (prop === 'VITE_CONTEXT_PATH') return getEnvVar('VITE_CONTEXT_PATH', '/');
    if (prop === 'VITE_TOKEN_END_POINT') return getEnvVar('VITE_TOKEN_END_POINT', '/auth/token');
    if (prop === 'VITE_SSO_BASE_URL') return getEnvVar('VITE_SSO_BASE_URL', '');
    if (prop === 'VITE_AUTH_END_POINT') return getEnvVar('VITE_AUTH_END_POINT', '/auth/authorize');
    if (prop === 'VITE_REDIRECT_URI') return getEnvVar('VITE_REDIRECT_URI', '');
    if (prop === 'VITE_MOCK_ENABLED') return getEnvBoolean('VITE_MOCK_ENABLED', false);
    if (prop === 'VITE_DINGTALK_BIND_MODE') return getEnvVar('VITE_DINGTALK_BIND_MODE', 'INTERNAL');
    if (prop === 'VITE_I18N_TAGS') return getEnvVar('VITE_I18N_TAGS', 'G2RAIN_SHARED');

    // 保持对象行为一致（如 JSON.stringify / util.inspect 等）
    if (prop === Symbol.toStringTag) return 'SharedEnv';
    return undefined;
  },
}) as SharedEnv;

/**
 *  将子路径与 contextPath 拼接成完整路径
 * - 若 subPath 以 `/` 开头，则直接拼接（如 contextPath + subPath.slice(1)）
 * - 否则在两者之间补一个 `/`（如 contextPath + '/' + subPath）
 * - 若 subPath 为空，则返回 contextPath 本身
 */
export function getPathWithContextPath(subPath: string): string {
  const base = getRouterHistoryBase();
  if (!subPath) {
    return base;
  }

  // 若 subPath 以 / 开头, 直接拼接 subPath(此时 base 去掉尾斜杠)
  // 否则直接字符串相加, 完全避免了 subPath.slice(1) 产生的新字符串内存分配
  return (subPath.startsWith('/') ? base.slice(0, -1) : base) + subPath;
}

/**
 * 供 `createWebHistory` 使用，与 vite.config 中 `base` 规则一致（非根则带尾部 `/`）。
 * 值由 `VITE_CONTEXT_PATH`（含 window._env_ 运行时覆盖）推导，替代 import.meta.env.BASE_URL。
 */
export function getRouterHistoryBase(): string {
  const base = getEnvVar('VITE_CONTEXT_PATH', '/');
  return `/${base}/`.replace(/\/+/g, '/');
}

