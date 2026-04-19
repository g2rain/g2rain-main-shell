/**
 * 微前端消息处理器实现
 * 每个消息类型都有对应的处理器，继承自 MicroAppMessageHandler
 */

import type {
  MicroAppMessage,
  MicroAppMessageHandler,
  MicroAppMessageUnion,
  TokenRequestMessage,
  TokenResponseMessage,
  TokenInvalidMessage,
  RouteChangeMessage,
  EventAdapter,
} from '@/components/micro-app';
import {
  MicroAppEventType,
  isTokenRequestMessage,
  isTokenResponseMessage,
  isTokenInvalidMessage,
  isRouteChangeMessage,
  MicroAppMessageFactory,
} from '@/components/micro-app';
import { MicroAppMessageProcessorImpl } from '@/components/micro-app/message-processor';
import type { AuthHandler } from './auth-handler.type';

/**
 * Token 失效消息处理器
 * 当子应用通知 token 失效时，主应用刷新 token 并发送给子应用
 */
export class TokenInvalidHandler implements MicroAppMessageHandler {
  private static authHandler: AuthHandler | null = null;
  private static eventAdapter: EventAdapter | null = null;

  /**
   * 设置用于处理 token 刷新的 AuthHandler
   * 通过启动流程在 runtime 中进行初始化
   */
  static setAuthHandler(authHandler: AuthHandler): void {
    TokenInvalidHandler.authHandler = authHandler;
  }

  /**
   * 设置用于发送事件的 EventAdapter
   * 在事件系统初始化时注入（由 BaseAppManager 调用）
   */
  static setEventAdapter(eventAdapter: EventAdapter): void {
    TokenInvalidHandler.eventAdapter = eventAdapter;
  }

  async process(message: MicroAppMessage<MicroAppEventType, unknown>): Promise<void> {
    const messageUnion = message as MicroAppMessageUnion;
    if (!isTokenInvalidMessage(messageUnion)) {
      return;
    }

    const typedMessage = messageUnion as TokenInvalidMessage;
    const appKey = typedMessage.appKey;

    try {
      const authHandler = TokenInvalidHandler.authHandler;
      if (!authHandler) {
        console.warn(
          '[TokenInvalidHandler] 未配置 AuthHandler，忽略 token 失效消息',
          typedMessage,
        );
        return;
      }

      // 调用 AuthHandler 刷新 token
      const tokenResult = await authHandler.refreshToken();

      // 创建 TokenResponseMessage
      const responseMessage = MicroAppMessageFactory.createTokenResponse(
        {
          token: tokenResult.token,
          tokenKid: tokenResult.tokenKid,
          client: tokenResult.client,
        },
        typedMessage.requestId, // 使用原消息的 requestId
      );

      // 如果原消息有 appKey，则设置到响应消息中，用于定向发送
      if (appKey) {
        responseMessage.appKey = appKey;
      }

      // 通过注入的 EventAdapter 发送事件到子应用
      const eventAdapter = TokenInvalidHandler.eventAdapter;
      if (!eventAdapter) {
        console.warn(
          '[TokenInvalidHandler] 未配置 EventAdapter，无法发送 TokenResponse 消息',
          responseMessage,
        );
        return;
      }

      eventAdapter.emitEvent(responseMessage);

      console.log('[TokenInvalidHandler] Token 刷新成功，已发送给子应用:', {
        appKey,
        requestId: typedMessage.requestId,
      });
    } catch (error) {
      console.error('[TokenInvalidHandler] Token 刷新失败:', error);
      // 刷新失败时不发送响应，子应用可以根据超时或其他机制处理
    }
  }
}

/**
 * 路由变化消息处理器
 */
export class RouteChangeHandler implements MicroAppMessageHandler {
  async process(message: MicroAppMessage<MicroAppEventType, unknown>): Promise<void> {
    const messageUnion = message as MicroAppMessageUnion;
    if (!isRouteChangeMessage(messageUnion)) {
      return;
    }
    const typedMessage = messageUnion as RouteChangeMessage;
    const fullPath = typedMessage.data.fullPath;
    if (!fullPath) return;

    // 构造最终地址：如果是相对路径，则拼上 origin
    const url = fullPath.startsWith('http')
      ? fullPath
      : `${window.location.origin}${fullPath}`;

    // 仅修改浏览器地址栏，不触发主应用 Router 导航
    window.history.replaceState(
      { ...(window.history.state || {}), microApp: true },
      '',
      url,
    );
  }
}

/**
 * 初始化微前端消息处理器的默认处理逻辑
 * - 注册子应用路由变化事件，用于同步主应用浏览器地址栏
 * - 注册子应用 token 失效事件，用于刷新 token 并发送给子应用
 * - 注入 EventAdapter 到 TokenInvalidHandler，用于发送 TokenResponse 消息
 */
export function initMicroAppMessageHandlers(
  processor: MicroAppMessageProcessorImpl,
  eventAdapter: EventAdapter,
): void {
  // 为 TokenInvalidHandler 注入 EventAdapter
  TokenInvalidHandler.setEventAdapter(eventAdapter);

  // 注册处理器
  processor.registerHandler(MicroAppEventType.ROUTE_CHANGE, new RouteChangeHandler());
  processor.registerHandler(MicroAppEventType.TOKEN_INVALID, new TokenInvalidHandler());

  console.log(
    '[MicroAppMessageHandlers] 子应用路由变化和 token 失效事件处理已初始化',
  );
}

