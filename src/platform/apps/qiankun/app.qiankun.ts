// platform/micro-frontend/micro-frontend.qiankun.ts
/**
 * Qiankun 微前端管理器
 */

import { BaseAppManager } from '../app.base';
import type { RuntimeInstance, RuntimeAdapter } from '@platform/types';
import { loadMicroApp, start, type MicroApp } from 'qiankun';
import { useRuntimeStore } from '@platform/stores/runtime.store';
import { WindowEventAdapter } from '@/components/micro-app/event-windows-adapter';

/**
 * Qiankun 运行时适配器
 */
class QiankunAdapter implements RuntimeAdapter {
  type: 'qiankun' = 'qiankun';
  /** 按 instanceId 记录 qiankun MicroApp 实例 */
  private microApps: Map<string, MicroApp> = new Map();
  /**
   * 创建并挂载实例
   * 说明：
   * - 每个 RuntimeInstance 使用独立的 qiankun 应用名（app.name__instanceId），从而支持同一子应用的多实例并存（多活）
   * - 仅在同一 instanceId 重复 mount 时会先卸载旧实例，避免重复挂载
   */
  async mount(instance: RuntimeInstance): Promise<void> {
    const { app, containerId, props } = instance;
    // 如果同一 instanceId 之前已有 MicroApp，先卸载并移除，避免重复 mount 导致 #31
    const existingSameInstance = this.microApps.get(instance.instanceId);
    if (existingSameInstance) {
      try {
        await existingSameInstance.unmount();
      } catch (error) {
        console.warn(`[QiankunAdapter] 旧实例卸载失败: ${instance.instanceId}`, error);
      }

      this.microApps.delete(instance.instanceId);
      const sameContainer = document.querySelector(`#${containerId}`);
      if (sameContainer) {
        sameContainer.innerHTML = '';
        const wrapper = sameContainer.querySelector('[id^="__qiankun_microapp_wrapper_"]');
        if (wrapper) {
          wrapper.remove();
        }
      }
    }

    // entry 校验（保持最小约束）
    if (!app.entry) {
      throw new Error(`[QiankunAdapter] entry 为空: ${app.name}`);
    }

    // 确保容器存在；若未渲染则等待最多 1 秒
    let finalContainer = document.querySelector(`#${containerId}`);
    if (!finalContainer) {
      await new Promise<void>((resolve, reject) => {
        let attempts = 0;
        const timer = setInterval(() => {
          attempts++;
          finalContainer = document.querySelector(`#${containerId}`);
          if (finalContainer) {
            clearInterval(timer);
            resolve();
          } else if (attempts >= 20) {
            clearInterval(timer);
            reject(
              new Error(
                `[QiankunAdapter] 容器不存在且超时: #${containerId}，请确保 MicroAppPage 组件已渲染`,
              ),
            );
          }
        }, 50);
      });
    }

    // 清空容器，移除 qiankun wrapper
    if (finalContainer) {
      finalContainer.innerHTML = '';
      const wrapper = finalContainer.querySelector('[id^="__qiankun_microapp_wrapper_"]');
      if (wrapper) {
        wrapper.remove();
      }
    }

    // 为每个实例生成唯一的 qiankun 应用名，避免 single-spa 对同名应用的单实例限制
    const qiankunAppName = `${app.name}__${instance.instanceId}`;

    // 加载 qiankun 微应用
    const microApp = loadMicroApp(
      {
        name: qiankunAppName,
        entry: app.entry,
        container: `#${containerId}`,
        props: props || {},
      },
      {
        singular: false,
        sandbox: {
          experimentalStyleIsolation: true,
        },
      },
    );

    // 记录 MicroApp 实例，由适配器内部管理
    this.microApps.set(instance.instanceId, microApp);
    // 等待挂载成功
    await microApp.mountPromise;

    console.log(`[QiankunAdapter] 已挂载实例: ${instance.instanceId}`);
  }

  /**
   * 卸载实例
   */
  async unmount(instanceId: string): Promise<void> {
    // 通过 runtime.store 确认实例是否存在（单一来源）
    const runtimeStore = useRuntimeStore();
    const instance = runtimeStore.getInstanceById(instanceId);
    // 实例可能已被上层销毁（例如先关闭 Tab 再触发重复卸载），这里静默返回即可，避免噪音日志
    if (!instance) {
      if ((import.meta.env as any).DEV) {
        console.debug?.(`[QiankunAdapter] ignore unmount, instance not found: ${instanceId}`);
      }
      return;
    }

    const microApp = this.microApps.get(instanceId);
    if (!microApp) {
      console.info(`[QiankunAdapter] 实例不存在: ${instanceId}`);
      return;
    }

    try {
      await microApp.unmount();
      console.log(`[QiankunAdapter] 已卸载实例: ${instanceId}`);
    } catch (error) {
      console.warn(`[QiankunAdapter] 卸载实例失败: ${instanceId}`, error);
    } finally {
      // 无论 unmount 是否成功都从 Map 移除，避免与 DOM/qiankun 真实状态漂移
      this.microApps.delete(instanceId);
    }
  }

  /**
   * 销毁实例
   */
  async destroy(instanceId: string): Promise<void> {
    const runtimeStore = useRuntimeStore();
    const instance = runtimeStore.getInstanceById(instanceId);
    // 与 unmount 类似，实例有可能已被上层逻辑移除，这里不再输出 warn，只在开发模式下做调试输出
    if (!instance) {
      if ((import.meta.env as any).DEV) {
        console.debug?.(`[QiankunAdapter] ignore destroy, instance not found: ${instanceId}`);
      }
      return;
    }

    const microApp = this.microApps.get(instanceId);
    if (!microApp) {
      // MicroApp 可能已经被 qiankun 内部或其他逻辑卸载，这里不再使用 warn，避免正常流程下的噪音
      if ((import.meta.env as any).DEV) {
        console.debug?.(`[QiankunAdapter] ignore destroy, microApp not found: ${instanceId}`);
      }
      // 即使没有 microApp 实例，也要清理容器
      const containerElement = document.querySelector(`#${instance.containerId}`);
      if (containerElement) {
        containerElement.innerHTML = '';
        // 清理 qiankun wrapper
        const wrapper = containerElement.querySelector('[id^="__qiankun_microapp_wrapper_"]');
        if (wrapper) {
          wrapper.remove();
        }
      }
      return;
    }

    // 从内部缓存中移除，避免内存泄漏
    this.microApps.delete(instanceId);

    // 等待一小段时间，确保 qiankun 内部状态更新
    await new Promise((resolve) => setTimeout(resolve, 100));

    console.log(`[QiankunAdapter] 已销毁实例: ${instanceId}`);
  }

  /**
   * 获取 MicroApp 实例（用于更新 props）
   */
  getMicroApp(instanceId: string): MicroApp | undefined {
    return this.microApps.get(instanceId);
  }
}

/**
 * Qiankun 微前端管理器
 */
export class QiankunManager extends BaseAppManager {
  protected adapter: RuntimeAdapter = new QiankunAdapter();
  protected eventAdapter = new WindowEventAdapter();
  /** qiankun 框架是否已初始化 */
  private static qiankunInitialized = false;

  /**
   * 初始化 qiankun 框架
   * 必须在任何 loadMicroApp 调用之前调用
   * 只会初始化一次（即使多次调用）
   */
  static initialize(): void {
    if (QiankunManager.qiankunInitialized) {
      console.log('[QiankunManager] qiankun 框架已初始化，跳过');
      return;
    }

    start({
      // 允许多个子应用同时处于活动状态（多活），与 Tab 多实例模型保持一致
      singular: false,
      sandbox: {
        // 样式隔离配置
        // strictStyleIsolation: true, // 使用 Shadow DOM（严格隔离，但可能影响某些库，如 Element Plus）
        experimentalStyleIsolation: true, // 实验性样式隔离（通过添加前缀，避免样式冲突）
        // 注意：experimentalStyleIsolation 会为子应用的样式添加作用域前缀，防止样式污染主应用
      },
    });

    QiankunManager.qiankunInitialized = true;
    console.log('[QiankunManager] qiankun 框架已启动（支持子应用多活模式）');
  }

  /**
   * 更新实例的 props
   */
  async updateInstanceProps(instanceId: string, props: Record<string, any>): Promise<void> {
    const runtimeStore = useRuntimeStore();
    const instance = runtimeStore.getInstanceById(instanceId);
    if (!instance) {
      console.warn(`[QiankunManager] 实例不存在: ${instanceId}`);
      return;
    }

    // 更新实例的 props
    instance.props = { ...instance.props, ...props };

    // 调用 qiankun 的 update 方法
    const qiankunAdapter = this.adapter as QiankunAdapter;
    const microApp = qiankunAdapter.getMicroApp(instanceId);
    if (microApp && microApp.update) {
      microApp.update(instance.props);
      console.log(`[QiankunManager] 已更新实例 props: ${instanceId}`);
    }
  }
}

