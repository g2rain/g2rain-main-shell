import { getHttpClient } from '@/components/http';
import type { PassportIdpBinding, PassportIdpBindingQuery } from './idp-binding.type';

export class PassportIdpBindingApi {
  static async listByPassport(passportId: number): Promise<PassportIdpBinding[]> {
    const http = getHttpClient('default');
    const params: PassportIdpBindingQuery = { passportId };
    const res = await http.get<PassportIdpBinding[]>('/basis/passport_idp_binding/list', params);
    return res.data ?? [];
  }
}
