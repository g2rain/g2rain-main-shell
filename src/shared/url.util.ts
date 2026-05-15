/**
 * 将多段路径或 URL 片段用 `/` 拼成一条字符串
 *
 * - 只保留整串里**第一个** `//`，其余出现的 `//` 均改为 `/`
 * - 不补全协议，不做 `URL` 解析
 * - 不主动去掉或追加末尾的 `/`
 */
export function joinUrlSegments(...parts: Array<string | undefined | null>): string {
  // 先合并成一条字符串
  const input = parts.map(p => p?.trim()).filter((p): p is string => !!p).join('/');

  // 获取协议部分的长度(如果存在), 以便后续处理时跳过
  const schemeIdx = input.indexOf('://');
  const start = schemeIdx > 0 ? schemeIdx + 3 : input.startsWith('//') ? 2 : 0;

  // 用于构建结果的字符数组, 以及一个标记上一个字符是否为 `/` 的布尔值
  const chars: string[] = [];
  let prevSlash = false;

  // 从 start 位置开始遍历字符串，构建结果字符数组
  for (let i = start, j = input.length; i < j; i++) {
    const ch = input[i];
    if (ch !== '/' || !prevSlash) {
      chars.push(ch);
    }

    prevSlash = ch === '/';
  }

  // 将字符数组拼成字符串, 并在前面加上协议部分(如果存在)
  return input.slice(0, start) + chars.join('');
}

/**
 * 剥离路径前缀 activeRule, 返回子应用内部路径
 *
 * 示例：
 * stripActiveRule('/app', '/app/home') -> '/home'
 * stripActiveRule('/app', '/app')      -> '/'
 * stripActiveRule('/', '/home')        -> '/home'
 */
export function stripActiveRule(activeRule: string | null | undefined, path: string | null | undefined): string {
  // 1. 规范化规则，空值默认回退到 '/'
  const normalizedRule =
    `/${(activeRule || '').trim()}`
      .replace(/\/+/g, '/')
      .replace(/\/$/, '') || '/';

  // 2. 规范化路径
  const normalizedPath =
    `/${(path || '').trim()}`
      .replace(/\/+/g, '/');

  // 3. 激活规则是根路径，不脱壳
  if (normalizedRule === '/') {
    return normalizedPath;
  }

  // 4. 完全相等：/app -> /
  if (normalizedPath === normalizedRule) {
    return '/';
  }

  // 5. 前缀匹配：/app/home -> /home
  const prefixWithSlash = `${normalizedRule}/`;
  if (normalizedPath.startsWith(prefixWithSlash)) {
    return normalizedPath.slice(normalizedRule.length);
  }

  // 6. 不匹配原样返回
  return normalizedPath;
}

/**
 * 为子应用内部路径前置拼接 activeRule（加壳）
 *
 * 示例：
 * wrapActiveRule('/app', '/home') -> '/app/home'
 * wrapActiveRule('/app', '/')     -> '/app'
 * wrapActiveRule('/', '/home')    -> '/home'
 */
export function wrapActiveRule(activeRule: string | null | undefined, path: string | null | undefined): string {
  // 1. 规范化 activeRule（确保以 / 开头，且结尾没有 /）
  const normalizedRule = `/${(activeRule || '').trim()}`.replace(/\/+/g, '/').replace(/\/$/, '') || '/';

  // 2. 规范化子应用内部 path
  let normalizedPath = `/${(path || '').trim()}`.replace(/\/+/g, '/');

  // 3. 如果规则是根路径 '/'，直接返回规范化后的路径即可
  if (normalizedRule === '/') {
    return normalizedPath;
  }

  // 4. 核心判定：如果路径已经包含了该前缀，则无需重复拼接，直接返回
  if (normalizedPath === normalizedRule || normalizedPath.startsWith(`${normalizedRule}/`)) {
    return normalizedPath;
  }

  // 5. 核心加壳：如果内部路径是 '/'，直接返回前缀；否则拼接前缀与路径
  return normalizedPath === '/' ? normalizedRule : `${normalizedRule}${normalizedPath}`;
}
