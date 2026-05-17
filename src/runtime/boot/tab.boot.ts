/**
 * Tab 路由同步启动服务
 * 监听 activeTabKey 变化，自动同步路由
 */

import { watch, type WatchStopHandle } from 'vue';
import type { Router } from 'vue-router';
import { useTabStore } from '@platform/stores';
import { storeToRefs } from 'pinia';

class TabBoot {
  private stopWatch: WatchStopHandle | null = null;

  /**
   * 启动 Tab 路由同步
   * 监听 activeTabKey 变化，自动同步到路由
   * @param router 路由实例（从外部传入，避免在非 setup 中调用 useRouter）
   * @param defaultMenu 可选的默认菜单项，用于在没有激活 Tab 时激活首页
   */
  start(router: Router): void {
    // 如果已经有 watch 在运行，先停止
    if (this.stopWatch) {
      this.stopWatch();
    }

    const tabStore = useTabStore();

    const { tabList: tabs, activeTabKey } = storeToRefs(tabStore);

    //监听 activeTabKey 变化，自动同步路由
    this.stopWatch = watch(
      activeTabKey,
      (key) => {
        // 拦截无效 Key
        if (key == null || key === '') return;

        const currentTab = tabs.value.find((tab) => tab.key === key);
        if (!currentTab) return;

        // 主应用路由
        if (currentTab.type === 'main' && currentTab.routePath) {
          const currentPath = router.currentRoute.value.path;
          const tabRoutePath = currentTab.routePath;
          if (currentPath !== tabRoutePath) {
            router.push({ path: tabRoutePath });
          }
        }
      },
      { immediate: true },
    );

    console.log('[TabBoot] 已启动 Tab 路由同步');
  }

  /**
   * 停止 Tab 路由同步（用于清理）
   */
  stop(): void {
    if (this.stopWatch) {
      this.stopWatch();
      this.stopWatch = null;
    }
    console.log('[TabBoot] 已停止 Tab 路由同步');
  }
}

export const tabBoot = new TabBoot();
