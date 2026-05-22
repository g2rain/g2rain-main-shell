/**
 * 将 locale code（如 zh-CN）解析为 languageCode / regionCode
 */

export interface ParsedLocaleCode {
  languageCode: string;
  regionCode: string;
}

/**
 * 解析 BCP 47 风格区域标识
 * - zh-CN → zh + CN
 * - en → en + ''（无地区时 regionCode 为空）
 */
export function parseLocaleCode(code: string): ParsedLocaleCode {
  const trimmed = code.trim();
  if (!trimmed) {
    return { languageCode: '', regionCode: '' };
  }

  const sep = trimmed.indexOf('-');
  if (sep <= 0) {
    return { languageCode: trimmed, regionCode: '' };
  }

  return {
    languageCode: trimmed.slice(0, sep),
    regionCode: trimmed.slice(sep + 1),
  };
}
