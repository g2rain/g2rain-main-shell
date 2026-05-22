import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';
import { i18n } from '@platform/i18n';

// runtime store 和 router
import { setupStore } from '@runtime/store';
import { setupRouter, registerRouteMap } from '@runtime/router';
import { shellRouteMap } from '@/shell/route-map';
import { viewsRouteMap } from '@/views/route-map';

// 样式系统
import '@platform/styles/index.css';

// 主题系统
import { useThemeStore } from '@platform/stores/theme.store';

// 应用启动器
import { start } from '@/runtime/boot';

async function bootstrap() {
  const app = createApp(App);

  // -------------------------
  // 1. 初始化状态管理
  // -------------------------
  setupStore(app);

  app.use(i18n);

  // -------------------------
  // 2. 安装 ElementPlus UI
  // -------------------------
  app.use(ElementPlus);

  // -------------------------
  // 3. 初始化路由
  // -------------------------
  // 注册路由映射（必须在 setupRouter 之前注册）
  registerRouteMap(shellRouteMap);
  registerRouteMap(viewsRouteMap);
  
  setupRouter(app);

  // -------------------------
  // 4. 初始化主题系统
  // -------------------------
  const themeStore = useThemeStore();
  try {
    await themeStore.initialize();
  } catch (error) {
    console.error('[main.ts] 主题初始化失败:', error);
  }

  // -------------------------
  // 5. 加载应用级服务
  // 注意：这些服务需要在路由初始化后加载，因为它们可能依赖路由
  // -------------------------
  start();

  // -------------------------
  // 7. 挂载应用
  // -------------------------
  app.mount('#app');

  console.log('[main.ts] 应用启动完成');
}

// 启动主应用
bootstrap().catch((error) => {
  console.error('[main.ts] 应用启动失败:', error);
});
