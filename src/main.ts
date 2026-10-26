import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import { G2rainUi } from '@g2rain/ui';
import '@g2rain/theme/styles.css';
import '@g2rain/ui/style.css';
import 'element-plus/dist/index.css';
import '@platform/styles/index.css';
import App from './App.vue';
import { i18n } from '@platform/i18n';

import { setupStore } from '@runtime/store';
import { setupRouter, registerRouteMap } from '@runtime/router';
import { shellRouteMap } from '@/shell/route-map';
import { viewsRouteMap } from '@/views/route-map';

import { useThemeStore } from '@platform/stores/theme.store';
import { useLocaleStore } from '@platform/stores/locale.store';
import { initThemeController } from '@platform/theme/controller';

import { start } from '@/runtime/boot';
import { rewriteMicroDeepLinkToGateway } from '@runtime/navigation/sub-app-redirect';

async function bootstrap() {
  // 子应用深链文档回退到 shell 时，须在 createWebHistory 前改写到 /main/redirect/...
  rewriteMicroDeepLinkToGateway();

  const app = createApp(App);

  setupStore(app);

  app.use(i18n);

  app.use(ElementPlus);

  const localeStore = useLocaleStore();
  app.use(G2rainUi, {
    translate: (_key: string, fallback: string) => fallback,
    locale: () => localeStore.locale,
  });

  registerRouteMap(shellRouteMap);
  registerRouteMap(viewsRouteMap);

  setupRouter(app);

  initThemeController();
  const themeStore = useThemeStore();
  try {
    await themeStore.initialize();
  } catch (error) {
    console.error('[main.ts] 主题初始化失败:', error);
  }

  start();

  app.mount('#app');

  console.log('[main.ts] 应用启动完成');
}

bootstrap().catch((error) => {
  console.error('[main.ts] 应用启动失败:', error);
});
