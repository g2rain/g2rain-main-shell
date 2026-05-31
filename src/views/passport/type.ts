/**
 * passport相关类型定义
 */

import type { BaseSelectListDto, BaseVo } from '@platform/types';

/**
 * passport接口
 */
export interface Passport extends BaseVo {
  username: string;
  password?: string; // 密码通常不在查询结果中返回，但类型定义中保留
  realName: string;
  sex: string; // MALE:男性, FEMALE:女性
  birthday: string;
  idNo: string; // 身份证号
  mobile: string; // 手机号码
  email: string; // 邮箱地址
}

/**
 * 用于创建 / 更新时提交的负载（不包含审计字段）
 */
export interface PassportPayload {
  id?: number; // 更新时传入 ID，新增时不传
  username?: string;
  password?: string;
  realName?: string;
  sex?: string; // MALE:男性, FEMALE:女性
  birthday?: string;
  idNo?: string;
  mobile?: string;
  email?: string;
}

/**
 * passport查询条件
 * 用于分页查询时的业务查询参数
 * 包含业务查询字段和基础查询字段（BaseSelectListDto）
 */
export interface PassportQuery extends BaseSelectListDto {
  // 业务查询字段
  username?: string;
  realName?: string;
  sex?: string;
  birthday?: string;
  idNo?: string;
  mobile?: string;
  email?: string;
}

/** 账号与外部身份源绑定 */
export interface PassportIdpBinding extends BaseVo {
  passportId?: number;
  idpType?: string;
  idpSubject?: string;
  corpId?: string;
  idpUserId?: string;
  idpApplicationCode?: string;
  bindMode?: string;
  rawProfile?: string;
}

export interface PassportIdpBindingQuery {
  passportId?: number;
  idpType?: string;
}

export interface DingTalkBindStartRequest {
  bindMode?: string;
  returnUrl?: string;
}

export interface DingTalkBindStartResponse {
  gotoUrl: string;
}
