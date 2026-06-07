import type { Plugin } from 'vite';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { loadEnv } from 'vite';

const APP_CONTEXT_PATH_PLACEHOLDER = '__G2RAIN_APP_CONTEXT_PATH__';

/**
 * 用于 env-config.js 等 URL 拼接：取自 VITE_CONTEXT_PATH，去掉尾部斜杠
 * @example '/main/' -> '/main'，'/' -> '/'
 */
function normalizeContextPathForUrl(raw: string | undefined): string {
  const trimmed = (raw ?? '').trim();
  if (!trimmed || trimmed === '/') {
    return '/';
  }
  let p = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  p = p.replace(/\/+$/, '');
  return p || '/';
}

/**
 * Vite 插件：生成运行时环境配置文件，并向 index.html 注入应用静态根路径（来自 VITE_CONTEXT_PATH）
 */
export function envConfigPlugin(): Plugin {
  let env: Record<string, string> = {};

  const getContextPathForUrl = () => normalizeContextPathForUrl(env.VITE_CONTEXT_PATH);

  return {
    name: 'vite-plugin-env-config',
    configResolved(config) {
      env = loadEnv(config.mode, config.envDir || process.cwd(), '');
    },
    transformIndexHtml(html) {
      return html.split(APP_CONTEXT_PATH_PLACEHOLDER).join(getContextPathForUrl());
    },
    closeBundle() {
      const outDir = resolve(process.cwd(), 'dist');
      const contextPathForUrl = getContextPathForUrl();

      const configContent = `// env-config.js
// 这个文件会在容器启动时被 docker-entrypoint.sh 替换为实际的配置
window._env_ = {
  VITE_SSO_BASE_URL: '__SSO_BASE_URL__',
};
`;
      writeFileSync(resolve(outDir, 'env-config.js'), configContent, 'utf-8');
      console.log(
        `✅ env-config.js 已生成；应用静态根路径: ${contextPathForUrl}（来自 VITE_CONTEXT_PATH）`,
      );
    },
  };
}
