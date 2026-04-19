import { watch, type WatchStopHandle } from 'vue';
import { QiankunManager } from '@/platform/apps';
import { useMenuStore } from '@platform/stores/menu.store';
import { useMicroAppStore } from '@platform/stores';
import { useRuntimeStore } from '@platform/stores/runtime.store';

/**
 * 微应用启动器
 * 监听菜单初始化状态，自动初始化微应用
 */
class MicroAppBoot {
  private stopWatch: WatchStopHandle | null = null;

  /**
   * 启动微应用监控
   * 监听菜单初始化状态，自动初始化微应用
   */
  startMicroApp(): void {
    // 如果已经有 watch 在运行，先停止
    if (this.stopWatch) {
      this.stopWatch();
    }

    // 初始化 qiankun 框架（必须在任何 loadMicroApp 调用之前）
    QiankunManager.initialize();

    const menuStore = useMenuStore();
    const microAppStore = useMicroAppStore();
    const runtimeStore = useRuntimeStore();

    // 监听菜单初始化状态
    this.stopWatch = watch(
      () => menuStore.initialized,
      async (initialized) => {
        if (initialized && menuStore.menuItems.length > 0) {
          // 先初始化微应用 store（从菜单中提取微应用定义）
          await microAppStore.initializeFromMenu(menuStore.menuItems);

          // 注册所有微应用定义到 runtime store（会通过 QiankunManager 注册）
          const apps = microAppStore.apps;
          if (apps.length > 0) {
            runtimeStore.registerApps(apps);
            console.log(`[MicroAppBoot] 已注册 ${apps.length} 个微应用定义`);
          }
        }
      },
      { immediate: true },
    );

    console.log('[MicroAppBoot] 已启动菜单初始化监控');
  }

  /**
   * 停止微应用监控（用于清理）
   */
  stopMicroApp(): void {
    if (this.stopWatch) {
      this.stopWatch();
      this.stopWatch = null;
    }
    console.log('[MicroAppBoot] 已停止监控');
  }

  /**
   * 重置启动器状态
   */
  reset(): void {
    this.stopMicroApp();
  }
}

export const microAppBoot = new MicroAppBoot();
