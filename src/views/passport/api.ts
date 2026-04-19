/**
 * passport相关 API 服务
 * 提供passport数据的 CRUD 操作接口
 */

import { getHttpClient } from '@/components/http';
import type { Passport, PassportPayload, PassportQuery } from './type';
import type { PageData, PageSelectListDto } from '@platform/types';

// 导入 mock 数据以触发自动注册（副作用导入）
import './mock';

/**
 * passport API 服务类
 */
export class PassportApi {
  /**
   * 保存passport（新增或更新）
   * 如果 payload 中包含 id，则为更新；否则为新增
   * @param payload passport数据（包含 id 时为更新，不包含时为新增）
   * @returns 保存后的passport
   */
  static async save(payload: PassportPayload): Promise<Passport> {
    const httpClient = getHttpClient('default');
    const res = await httpClient.post<Passport>('/basis/passport/save', payload);
    return res.data;
  }

  /**
   * 修改指定用户的密码
   * @param id passport ID（作为路径参数）
   * @param payload 密码变更信息
   */
  static async changePassword(
    id: string | number,
    payload: {
      oldPassword: string;
      newPassword: string;
    }
  ): Promise<void> {
    const httpClient = getHttpClient('default');
    await httpClient.post(`/basis/passport/${id}/password`, payload);
  }
}

