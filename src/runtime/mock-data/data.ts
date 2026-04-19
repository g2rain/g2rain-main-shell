/**
 * 通用 Mock 数据
 * 包含菜单列表等通用 mock 数据
 */

import type { MockDataMap } from '@/components/http/mock-data';
import type { Result } from '@/components/http/types';
import { mockMenuList, IAM_PUBLIC_KEY, IAM_KEY_ID } from './auth.data';

/**
 * 通用 Mock 数据映射
 */
export const commonMockDataMap: MockDataMap = {
  // 菜单列表接口
  '/menu/list': {
    requestId: 'mock-request-id',
    requestTime: new Date().toISOString(),
    status: 200,
    errorCode: '',
    errorMessage: '',
    data: mockMenuList,
  } as Result,

  // GET /keys/iam-public-key - 获取 IAM 公钥
  // 返回纯文本格式的 PEM 公钥（注意：此接口返回纯文本，不是 JSON）
  // 支持两种格式：/keys/iam-public-key 和 /*/keys/iam-public-key（如 /main/keys/iam-public-key）
  '/keys/iam-public-key': IAM_PUBLIC_KEY,
  '/*/keys/iam-public-key': IAM_PUBLIC_KEY,

  // GET /keys/iam-key-id - 获取 IAM Key ID
  // 返回纯文本格式的 Key ID（注意：此接口返回纯文本，不是 JSON）
  // 支持两种格式：/keys/iam-key-id 和 /*/keys/iam-key-id（如 /main/keys/iam-key-id）
  '/keys/iam-key-id': IAM_KEY_ID,
  '/*/keys/iam-key-id': IAM_KEY_ID,
};
