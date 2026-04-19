/**
 * URL / 路径拼接工具（与业务无关）
 */

/**
 * 将多段路径或 URL 片段用 `/` 拼成一条字符串。
 *
 * - 只保留整串里**第一个** `//`，其余出现的 `//` 均改为 `/`。
 * - 不补全协议，不做 `URL` 解析。
 * - 不主动去掉或追加末尾的 `/`。
 */
export function joinUrlSegments(
  ...parts: Array<string | undefined | null>
): string {
  const segments = parts
    .filter((p): p is string => p != null && String(p).trim() !== '')
    .map((p) => String(p).trim());
  if (segments.length === 0) {
    return '';
  }
  const merged =
    segments.length === 1
      ? segments[0]
      : segments.reduce((a, b) => `${a}/${b}`);
  return keepFirstDoubleSlashCollapseRest(merged);
}

/**
 * 保留第一个 `//`，之后所有 `//` 逐次替换为 `/`。
 */
function keepFirstDoubleSlashCollapseRest(s: string): string {
  const i = s.indexOf('//');
  if (i === -1) {
    return s;
  }
  const head = s.slice(0, i + 2);
  let tail = s.slice(i + 2);
  while (tail.includes('//')) {
    tail = tail.replace('//', '/');
  }
  return head + tail;
}
