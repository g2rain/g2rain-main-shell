/** 传给子应用的 locale props（仅 localeCode，子应用自行 parse / 设 Accept-Language） */
export function buildSubAppLocaleProps(localeCode: string): { localeCode: string } | null {
  if (!localeCode?.trim()) {
    return null;
  }
  return { localeCode: localeCode.trim() };
}
