/**
 * 子应用路径唯一语义：
 * - 「内路径」：子应用 vue-router 的 path，如 /foo/bar
 * - 「壳路径」：浏览器 pathname，如 /activeRule/foo/bar
 *
 * 菜单 linkPath、router.to.path 两者都可能给到「壳路径」或「内路径」，必须先规范化再拼接，否则会 /rule/rule/... 串 URL，
 * 且 router.resolve 失败一直停在首页。
 */

export function normalizeActiveRule(rule: string): string {
  let r = (rule || '').trim();
  if (!r) return '';
  if (!r.startsWith('/')) r = `/${r}`;
  const t = r.replace(/\/+$/, '');
  return t === '' ? '/' : t;
}

/**
 * 任意输入 → 子应用 router 使用的内路径（可反复剥掉 activeRule 前缀以修复脏数据）
 */
export function toInternalPath(activeRule: string, path: string): string {
  let p = (path ?? '/').trim();
  if (!p) p = '/';
  if (!p.startsWith('/')) p = `/${p}`;

  const R = normalizeActiveRule(activeRule);
  if (!R || R === '/') {
    return p;
  }

  for (let i = 0; i < 16; i++) {
    if (p === R || p.startsWith(`${R}/`)) {
      const rest = p === R ? '/' : p.slice(R.length);
      p = rest.startsWith('/') ? rest : `/${rest}`;
      continue;
    }
    break;
  }
  return p || '/';
}

/**
 * 内路径或任意混合格式 → 浏览器壳 pathname（单一写法）
 */
export function toShellPath(activeRule: string, path: string): string {
  const internal = toInternalPath(activeRule, path);
  const R = normalizeActiveRule(activeRule);
  if (!R || R === '/') {
    const out = internal.replace(/\/+/g, '/');
    return out.startsWith('/') ? out : `/${out}`;
  }
  const merged = `${R}${internal.startsWith('/') ? internal : `/${internal}`}`.replace(/\/+/g, '/');
  return merged.startsWith('/') ? merged : `/${merged}`;
}
