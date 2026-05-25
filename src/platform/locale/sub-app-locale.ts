import type { SubAppLocaleProps } from './types';

/** 传给子应用的 locale props */
export function buildSubAppLocaleProps(locale: string): SubAppLocaleProps | null {
  if (!locale?.trim()) {
    return null;
  }
  return { locale: locale.trim() };
}
