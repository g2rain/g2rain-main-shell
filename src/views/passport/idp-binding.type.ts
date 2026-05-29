import type { BaseVo } from '@platform/types/api.type';

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
