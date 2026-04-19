/**
 * platform/types 公共导出入口
 *
 * 统一从这里导出平台层的基础类型，禁止外部直接 import 具体文件：
 * - ❌ import type { MenuItem } from '@platform/types/menu.type'
 * - ✅ import type { MenuItem } from '@platform/types'
 */

export * from './app.type';
export * from './api.type';
export * from './http.types';
export * from './menu.type';
export * from './runtime.type';
export * from './tab.types';

