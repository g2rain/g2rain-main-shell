/**
 * 与 Vue Router history base 配合的路径工具
 * - 菜单 / 服务端仍可使用带 context 的完整路径（如 /main/home）
 * - 注册到 createWebHistory(getRouterHistoryBase()) 的路由 record 需去掉 context 前缀（如 /home）
 */

import { env } from './env';

/**
 * 将「浏览器级」完整路径转为路由 record 的 path（相对 Vite base）
 */
export function toRouterRecordPath(fullPath: string): string {
  const ctx = env.VITE_CONTEXT_PATH.replace(/\/$/, '') || '';
  const p = fullPath.startsWith('/') ? fullPath : `/${fullPath}`;

  if (!ctx || ctx === '/') {
    return p;
  }
  if (p === ctx || p === `${ctx}/`) {
    return '/';
  }
  if (p.startsWith(`${ctx}/`)) {
    const rest = p.slice(ctx.length);
    if (!rest || rest === '/') {
      return '/';
    }
    return rest.startsWith('/') ? rest : `/${rest}`;
  }
  return p;
}

/**
 * 当前请求路径是否落在主应用 context 之下（用于守卫）
 */
export function isPathUnderContextPath(pathname: string): boolean {
  const raw = env.VITE_CONTEXT_PATH || '/';
  const ctx = raw.replace(/\/$/, '') || '';
  // 无 context（部署在 /）时与历史约定一致：仅 /main 前缀视为主应用壳内路径
  if (!ctx || ctx === '/') {
    return pathname === '/main' || pathname.startsWith('/main/');
  }
  return pathname === ctx || pathname.startsWith(`${ctx}/`);
}

/**
 * 将路由解析得到的 path 还原为菜单 / 服务端使用的「完整路径」（含 context）
 * - 若已是 /main/... 则原样返回
 * - 若为 history base 下的相对路径（如 /home），则补上 context
 */
export function resolveMenuRoutePath(routerPath: string): string {
  const ctx = env.VITE_CONTEXT_PATH.replace(/\/$/, '') || '';
  const p = routerPath.startsWith('/') ? routerPath : `/${routerPath}`;
  if (!ctx || ctx === '/') {
    return p;
  }
  if (p === ctx || p.startsWith(`${ctx}/`)) {
    return p;
  }
  if (p === '/') {
    return `${ctx}/`;
  }
  return `${ctx}${p}`;
}
