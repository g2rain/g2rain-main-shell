/**
 * 地域语言（Locale）状态：列表、当前选中、持久化
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { LocaleOption } from '@platform/locale';
import { parseLocaleCode, loadSavedLocaleCode, saveLocaleCode } from '@platform/locale';
import { getLocaleCodeNameList, type LocaleCodeName } from '@/runtime/api/locale.api';
import { loadAndApplyI18nMessages } from '@platform/i18n';

function toLocaleOption(item: LocaleCodeName): LocaleOption {
  const { languageCode, regionCode } = parseLocaleCode(item.code);
  return {
    code: item.code,
    name: item.name,
    languageCode,
    regionCode,
  };
}

function resolveInitialCode(options: LocaleOption[], savedCode: string | null): string {
  if (savedCode && options.some((o) => o.code === savedCode)) {
    return savedCode;
  }
  return options[0]?.code ?? '';
}

export const useLocaleStore = defineStore('locale', () => {
  const options = ref<LocaleOption[]>([]);
  const currentCode = ref('');
  const initialized = ref(false);
  let initializing: Promise<void> | null = null;

  const current = computed<LocaleOption | null>(() => {
    if (!currentCode.value) {
      return null;
    }
    return options.value.find((o) => o.code === currentCode.value) ?? null;
  });

  const languageCode = computed(() => current.value?.languageCode ?? '');
  const regionCode = computed(() => current.value?.regionCode ?? '');

  /** 供后续业务 HTTP 使用的 Accept-Language 值（与 code 一致，如 zh-CN） */
  const acceptLanguage = computed(() => currentCode.value);

  async function syncI18nMessages(force = false): Promise<void> {
    const locale = current.value;
    if (!locale?.languageCode || !currentCode.value) {
      return;
    }
    await loadAndApplyI18nMessages(
      currentCode.value,
      locale.languageCode,
      locale.regionCode ?? '',
      force,
    );
  }

  function applyCurrentCode(code: string): void {
    if (!code || !options.value.some((o) => o.code === code)) {
      return;
    }
    currentCode.value = code;
    saveLocaleCode(code);
  }

  /**
   * 登录后加载语言列表并恢复/默认选中项
   */
  async function initialize(): Promise<void> {
    if (initialized.value) {
      return;
    }
    if (initializing) {
      return initializing;
    }

    initializing = (async () => {
      try {
        const list = await getLocaleCodeNameList();
        const mapped = list.map(toLocaleOption);
        options.value = mapped;

        const saved = loadSavedLocaleCode();
        const code = resolveInitialCode(mapped, saved);
        if (code) {
          currentCode.value = code;
          saveLocaleCode(code);
        } else {
          currentCode.value = '';
        }

        initialized.value = true;
        await syncI18nMessages(true);
        console.log('[LocaleStore] 语言列表初始化完成:', currentCode.value || '(无可用项)');
      } catch (error) {
        console.error('[LocaleStore] 语言列表初始化失败:', error);
        throw error;
      } finally {
        initializing = null;
      }
    })();

    return initializing;
  }

  /**
   * Header 等处切换语言
   */
  async function setCurrentCode(code: string): Promise<void> {
    if (!initialized.value) {
      console.warn('[LocaleStore] 尚未初始化，忽略切换:', code);
      return;
    }
    if (currentCode.value === code) {
      return;
    }
    applyCurrentCode(code);
    await syncI18nMessages(true);
  }

  /**
   * 登出：清空内存状态，保留 localStorage 中的用户偏好
   */
  function reset(): void {
    options.value = [];
    currentCode.value = '';
    initialized.value = false;
    initializing = null;
  }

  return {
    options,
    currentCode,
    current,
    languageCode,
    regionCode,
    acceptLanguage,
    initialized,
    initialize,
    setCurrentCode,
    reset,
  };
});
