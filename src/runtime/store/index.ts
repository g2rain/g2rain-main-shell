import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import type { App } from 'vue';
import { getPersistConfig } from './plugins/persisted';

const store = createPinia();

// 通过插件机制统一设置 store 的持久化配置
// 必须在 piniaPluginPersistedstate 之前注册，这样持久化插件才能读取到配置
store.use((context) => {
  // 在 store 创建之前设置 persist 配置
  const persistConfig = getPersistConfig(context.store.$id);
  if (persistConfig && context.options) {
    // 直接修改 options，这样 pinia-plugin-persistedstate 在初始化时就能读取到
    (context.options as any).persist = persistConfig;
  }
});

// 注册持久化插件，此时 store 的 persist 配置已经设置好了
store.use(piniaPluginPersistedstate);

export const setupStore = (app: App<Element>) => {
  app.use(store);
};

export default store;
