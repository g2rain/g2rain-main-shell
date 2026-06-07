import type { Language } from 'element-plus/es/locale';

/**
 * 由后端 locale code（如 zh-CN、en-US）加载 Element Plus 语言包。
 * 依次尝试「完整码小写」「仅语言段」，与 EP 包名（zh-cn、en、ja…）对齐。
 */
export async function loadElementPlusLocaleByCode(localeCode: string): Promise<Language> {
  const normalized = localeCode.trim().toLowerCase().replace('_', '-');
  const lang = normalized.split('-')[0] ?? '';
  const candidates = [...new Set([normalized, lang].filter(Boolean))];

  for (const key of candidates) {
    try {
      const mod = await import(/* @vite-ignore */ `element-plus/es/locale/lang/${key}.mjs`);
      return mod.default as Language;
    } catch {
      // EP 无对应包名时尝试下一候选
    }
  }

  const fallback = await import('element-plus/es/locale/lang/zh-cn.mjs');
  return fallback.default as Language;
}
