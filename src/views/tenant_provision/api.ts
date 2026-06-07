/**
 * 账号开通
 */
import { getHttpClient } from '@/components/http';
import type { UserVo } from '@/runtime/api/user.api';
import type { TenantJoinOrganPayload, TenantProvisionPayload } from './type';

/**
 * 账号开通 服务类
 */
export class TenantProvisionApi {
  /**
   * 账号开通
   * @param payload organ 和 user 数据
   * @returns 创建成功的用户信息
   */
  static async provisionAccount(payload: TenantProvisionPayload): Promise<UserVo> {
    const httpClient = getHttpClient('default');
    const res = await httpClient.post<UserVo>(
      '/basis/tenant_provision/provision_account',
      payload,
    );
    return res.data;
  }

  /**
   * 通过邀请码加入机构
   */
  static async joinOrgan(payload: TenantJoinOrganPayload): Promise<UserVo> {
    const httpClient = getHttpClient('default');
    const res = await httpClient.post<UserVo>(
      '/basis/tenant_provision/join_organ',
      payload,
    );
    return res.data;
  }
}