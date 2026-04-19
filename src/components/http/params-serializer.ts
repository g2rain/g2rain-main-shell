/**
 * GET 参数序列化工具
 *
 * - 提供统一的 RFC3986 严格编码 + key/value 排序
 * - 同时用于：
 *   - Axios 实际发送请求时的 paramsSerializer
 *   - DPoP 签名中的查询参数规范化
 */

/**
 * RFC 3986 URL 编码
 *
 * encodeURIComponent 会保留 RFC3986 的 unreserved 字符：ALPHA / DIGIT / - . _ ~
 * 但会“额外保留” ! ' ( ) *（这更接近 RFC2396 的历史行为）
 * 这里将 ! ' ( ) * 也按 RFC3986 的常见“严格”做法进行百分号编码，确保输出稳定且标准。
 * 同时保留冒号 :，便于时间字符串等场景的可读性。
 */
export function rfc3986Encode(str: string): string {
  return encodeURIComponent(str)
    // RFC3986 严格编码 ! ' ( ) *
    .replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase())
    // 保留冒号 :，用于时间串等场景
    .replace(/%3A/gi, ':');
}

/**
 * 将 URLSearchParams 规范化为有序的查询字符串
 * - 对 key / value 都进行 RFC3986 编码
 * - 先按 key 排序，再按 value 排序，保证稳定性
 */
export function canonicalizeSearchParams(sp: URLSearchParams): string {
  const entries: [string, string][] = [];

  for (const [key, value] of sp.entries()) {
    const encodedKey = rfc3986Encode(key);
    const encodedValue = rfc3986Encode(value);
    entries.push([encodedKey, encodedValue]);
  }

  entries.sort(([keyA, valueA], [keyB, valueB]) => {
    const keyCompare = keyA.localeCompare(keyB);
    if (keyCompare !== 0) return keyCompare;
    return valueA.localeCompare(valueB);
  });

  return entries.map(([key, value]) => `${key}=${value}`).join('&');
}

/**
 * 将各种来源的参数追加到 URLSearchParams 中
 *
 * - string: 直接视为查询字符串（支持带或不带 ? 前缀）
 * - URLSearchParams: 直接使用
 * - object: 视为 key -> value / value[] 的字典
 */
export function appendParamsFromSource(sp: URLSearchParams, source: unknown): void {
  if (source == null || source === '') return;

  if (typeof source === 'string') {
    const raw = source.startsWith('?') ? source.slice(1) : source;
    if (!raw) return;
    const tmp = new URLSearchParams(raw);
    for (const [key, value] of tmp.entries()) {
      sp.append(key, value);
    }
    return;
  }

  if (source instanceof URLSearchParams) {
    for (const [key, value] of source.entries()) {
      sp.append(key, value);
    }
    return;
  }

  if (typeof source === 'object') {
    Object.entries(source as Record<string, any>).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        return;
      }
      if (Array.isArray(value)) {
        value.forEach(v => {
          sp.append(key, String(v));
        });
      } else {
        sp.append(key, String(value));
      }
    });
  }
}

/**
 * 默认 GET 参数序列化方法
 *
 * - 统一用于：
 *   - Axios `paramsSerializer`
 *   - DPoP 签名中的查询串规范化
 */
export function defaultParamsSerializer(params: unknown): string {
  const sp = new URLSearchParams();

  appendParamsFromSource(sp, params);

  if (![...sp.keys()].length) {
    return '';
  }

  return canonicalizeSearchParams(sp);
}
