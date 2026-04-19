/**
 * window 事件适配器实现
 * 使用 window 事件系统实现主应用与子应用之间的通信
 */

import type { EventAdapter, MicroAppMessageUnion } from './types';
import { MicroAppEventType } from './types';
import { env } from '@shared/env';
import { MicroAppMessageProcessorImpl } from './message-processor';

/**
 * window 事件适配器
 * 使用 window.dispatchEvent 和 window.addEventListener 实现事件通信
 */
export class WindowEventAdapter implements EventAdapter {
  private boundHandlers: Map<string, (event: Event) => void> = new Map();
  private messageProcessor: MicroAppMessageProcessorImpl = new MicroAppMessageProcessorImpl();

  /**
   * 获取消息处理器
   */
  getMessageProcessor(): MicroAppMessageProcessorImpl {
    return this.messageProcessor;
  }

  /**
   * 初始化事件监听器
   * 只注册一个统一的 processor 处理器
   */
  initEventListeners(): void {
    // 统一的事件监听器：所有事件都通过 processor 处理
    const unifiedEventHandler = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const message = customEvent.detail as MicroAppMessageUnion;
      const appKey = message.appKey ?? '';

      // appKey 为空：所有子应用都处理
      // appKey 不为空：只有 appKey 等于当前应用 appKey 的实例处理
      if (appKey) {
        const currentAppKey = env.VITE_APPLICATION_CODE || '';

        if (!currentAppKey || appKey !== currentAppKey) {
          return;
        }
      }

      // 使用 processor 的 processRaw 方法处理原始数据
      await this.messageProcessor.processRaw(message);
    };

    // 监听所有事件类型，都使用同一个处理器
    Object.values(MicroAppEventType).forEach((eventType) => {
      window.addEventListener(eventType, unifiedEventHandler);
      this.boundHandlers.set(eventType, unifiedEventHandler);
    });

    console.log('[WindowEventAdapter] 事件监听器已初始化，使用统一的消息处理器');
  }

  /**
   * 清理事件监听器
   */
  cleanupEventListeners(): void {
    // 移除所有事件监听器
    this.boundHandlers.forEach((handler, eventName) => {
      window.removeEventListener(eventName, handler);
    });
    this.boundHandlers.clear();

    // 清空所有处理器
    this.messageProcessor.clearHandlers();

    console.log('[WindowEventAdapter] 事件监听器已清理');
  }

  /**
   * 发送事件到子应用
   */
  emitEvent(message: MicroAppMessageUnion): void {
    const eventName = message.type;
    window.dispatchEvent(new CustomEvent(eventName, { detail: message }));
  }
}

