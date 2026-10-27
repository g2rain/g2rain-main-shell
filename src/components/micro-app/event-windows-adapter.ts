/**
 * window 事件适配器实现
 * 使用 window 事件系统实现主应用与子应用之间的通信
 */

import type { EventAdapter, MicroAppMessageUnion } from './types';
import { MicroAppEventType } from './types';
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
      // 主壳收到的都是子应用发给主壳的消息：message.appKey 是来源实例，不是投递目标，不按它过滤
      const message = customEvent.detail as MicroAppMessageUnion;

      // 使用 processor 的 processRaw 方法处理原始数据
      await this.messageProcessor.processRaw(message);
    };

    // 主壳只向子应用派发 TOKEN_RESPONSE，不在此注册监听，避免 emit 后同一窗口上的自监听误进 processor
    Object.values(MicroAppEventType)
      .filter((eventType) => eventType !== MicroAppEventType.TOKEN_RESPONSE)
      .forEach((eventType) => {
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

