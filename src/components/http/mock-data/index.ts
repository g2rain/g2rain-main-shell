/**
 * Mock 数据管理模块统一导出
 * 
 * 职责：
 * - 提供 Mock 服务管理功能
 * - 供 HTTP interceptors 调用
 * - 外部通过注册接口注册 mock 数据
 */

export { mockManager, MockManager } from './manager';
export type { MockData, MockDataFunction, MockDataMap } from './types';
