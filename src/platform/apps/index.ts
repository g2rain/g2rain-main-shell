/**
 * platform/apps 统一导出入口
 * 对外只暴露本目录下需要使用的类型和类
 */

// 微应用运行时管理相关
export type { AppManager } from './app-manager.type';
export { BaseAppManager } from './app.base';
export { QiankunManager } from './qiankun/app.qiankun';

// 认证处理器相关
export type { AuthHandler, TokenRefreshResult } from './auth-handler.type';

export {
  TokenInvalidHandler,
  RouteChangeHandler,
} from './message-handlers';

