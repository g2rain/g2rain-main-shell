/**
 * 账号开通相关类型定义
 */

/**
 * 用于创建提交的负载
 */
export interface TenantProvisionPayload {
  organName: string;
  organType: string;
  realName: string;
  email: string;
  mobile: string;
}

/**
 * 通过邀请码加入机构
 */
export interface TenantJoinOrganPayload {
  inviteCode: string;
}