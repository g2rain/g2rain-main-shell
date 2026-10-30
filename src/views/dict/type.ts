/**
 * dict 相关类型（DictSelect / DictText）
 */

import type { BaseVo } from '@platform/types/api.type';

export interface DictItem extends BaseVo {
  parentId: number;
  parentName?: string;
  usageCode: string;
  code: string;
  name: string;
  description: string;
  sortIndex: number;
}
