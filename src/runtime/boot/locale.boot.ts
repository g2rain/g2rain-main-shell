/**
 * 地域语言启动：登录后加载可选语言列表并恢复用户选择
 */

import { watch } from 'vue';
import { useAccessTokenStore } from '@platform/stores/token.store';
import { useLocaleStore } from '@platform/stores/locale.store';
import { useRuntimeStore } from '@platform/stores/runtime.store';

class LocaleBoot {
  private stopWatch: (() => void) | null = null;
  private stopLocaleWatch: (() => void) | null = null;

  private pushLocaleToSubApps(): void {
    useRuntimeStore().pushLocaleToSubApps();
  }

  async initLocale(): Promise<void> {
    const tokenStore = useAccessTokenStore();
    const localeStore = useLocaleStore();

    if (!tokenStore.isLogin) {
      return;
    }

    if (localeStore.initialized) {
      return;
    }

    await localeStore.initialize();
    this.pushLocaleToSubApps();
  }

  start(): void {
    const tokenStore = useAccessTokenStore();
    const localeStore = useLocaleStore();

    if (this.stopWatch) {
      this.stopWatch();
    }
    if (this.stopLocaleWatch) {
      this.stopLocaleWatch();
    }

    if (tokenStore.isLogin && !localeStore.initialized) {
      this.initLocale().catch((error) => {
        console.error('[LocaleBoot] 启动时加载语言列表失败:', error);
      });
    }

    this.stopWatch = watch(
      () => tokenStore.isLogin,
      (isLogin) => {
        if (isLogin) {
          this.initLocale().catch((error) => {
            console.error('[LocaleBoot] 登录后加载语言列表失败:', error);
          });
        }
      },
    );

    this.stopLocaleWatch = watch(
      () => localeStore.locale,
      () => {
        if (localeStore.initialized) {
          this.pushLocaleToSubApps();
        }
      },
    );

    console.log('[LocaleBoot] 已开始监听登录状态');
  }

  stop(): void {
    if (this.stopWatch) {
      this.stopWatch();
      this.stopWatch = null;
    }
    if (this.stopLocaleWatch) {
      this.stopLocaleWatch();
      this.stopLocaleWatch = null;
    }
  }

  reset(): void {
    useLocaleStore().reset();
  }
}

export const localeBoot = new LocaleBoot();
