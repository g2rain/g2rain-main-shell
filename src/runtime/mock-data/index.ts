/**
 * Runtime 层 Mock 数据统一导出入口
 * 
 * 职责：
 * - 统一导出所有业务相关的 mock 数据
 * - 注册逻辑由 mock.boot.ts 统一管理
 */

export { authMockDataMap, mockMenuList, IAM_PUBLIC_KEY, IAM_KEY_ID } from './auth.data';
export { testMockDataMap } from './test.api';
export { commonMockDataMap } from './data';
