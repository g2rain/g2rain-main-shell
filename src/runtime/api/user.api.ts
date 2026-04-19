/**
 * 用户（AuthorityUser）相关 API
 *
 * 对应后端 AuthorityUserVo / UserVo / PassportVo 结构：
 * public class AuthorityUserVo extends UserVo {
 *   private PassportVo passport;
 * }
 */

import { getHttpClient } from '@/components/http';
import type { BaseVo } from '@platform/types';

/**
 * 对应后端 PassportVo
 */
export interface PassportVo extends BaseVo {
  /** 登录用户 */
  username: string;
  /** 真实姓名 */
  realName: string;
  /** 性别[MALE:男性, FEMALE:女性] */
  sex: string;
  /** 生日 */
  birthday: string;
  /** 身份证号 */
  idNo: string;
  /** 手机号码 */
  mobile: string;
  /** 邮箱地址 */
  email: string;
  /** 状态[NORMAL:正常, FROZEN:冻结] */
  status: string;
  /** 删除标识[0:未删除, 1:已删除] */
  deleteFlag: boolean;
}

/**
 * 对应后端 OrganVo
 */
export interface OrganVo extends BaseVo {
  /** 机构名称 */
  organName: string;
  /** 机构类型[服务商、渠道、公司、租户] */
  organType: string;
  /** 机构状态[ACTIVE:有效, INACTIVE:无效] */
  status: string;
  /** 运营标记 */
  admin: boolean;
}

/**
 * 对应后端 UserVo
 */
export interface UserVo extends BaseVo {
  /** 账号标识 */
  passportId: number;
  /** 机构标识 */
  organId: number;
  /** 邮箱地址 */
  email: string;
  /** 手机号码 */
  mobile: string;
  /** 真实姓名 */
  realName: string;
  /** 管理员标记 */
  admin: boolean;
  /** 删除标识[0:未删除, 1:已删除] */
  deleteFlag: boolean;
}

/**
 * 对应后端 AuthorityUserVo extends UserVo，包含账号和机构信息
 */
export interface AuthorityUserVo extends UserVo {
  /** 账号信息 */
  passport: PassportVo;
  /** 机构信息 */
  organ: OrganVo;
}

// 缓存当前登录用户的 AuthorityUser 信息
let authorityUserCache: AuthorityUserVo | null = null;

/**
 * 查询当前登录用户的 AuthorityUser 信息（带缓存）
 * GET /authority/user
 * @param forceRefresh 是否强制刷新（默认使用缓存）
 */
export async function getAuthorityUser(forceRefresh = false): Promise<AuthorityUserVo> {
  // 使用缓存且不强制刷新时，直接返回
  if (!forceRefresh && authorityUserCache) {
    return authorityUserCache;
  }

  const httpClient = getHttpClient('default');
  const res = await httpClient.get<AuthorityUserVo>('/basis/authority/user');
  authorityUserCache = res.data;
  return res.data;
}

/**
 * 更新当前登录用户的 User 信息
 * POST /authority/user/update
 */
export async function updateUser(payload: Partial<UserVo> & { id: number }): Promise<void> {
  const httpClient = getHttpClient('default');
  await httpClient.post('/authority/user/update', payload);
  // 更新用户信息后清空缓存，下次调用时重新加载
  authorityUserCache = null;
}
