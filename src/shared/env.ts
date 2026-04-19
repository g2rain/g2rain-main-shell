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

    // 保持对象行为一致（如 JSON.stringify / util.inspect 等）
    if (prop === Symbol.toStringTag) return 'SharedEnv';
    return undefined;
  },
}) as SharedEnv;

export function getPathWithContextPath(subPath: string): string {
  const contextPath = env.VITE_CONTEXT_PATH;

  if (!subPath) {
    return contextPath;
  }

  if (contextPath.endsWith('/') && subPath.startsWith('/')) {
    return contextPath + subPath.substring(1);
  }

  if (!contextPath.endsWith('/') && !subPath.startsWith('/')) {
    return contextPath + '/' + subPath;
  }

  return contextPath + subPath;
}

/**
 * 供 `createWebHistory` 使用，与 vite.config 中 `base` 规则一致（非根则带尾部 `/`）。
 * 值由 `VITE_CONTEXT_PATH`（含 window._env_ 运行时覆盖）推导，替代 import.meta.env.BASE_URL。
 */
export function getRouterHistoryBase(): string {
  const raw = getEnvVar('VITE_CONTEXT_PATH', '/');
  if (!raw || raw === '/') {
    return '/';
  }
  return raw.endsWith('/') ? raw : `${raw}/`;
}

