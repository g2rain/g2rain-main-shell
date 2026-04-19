/**
 * passport相关 Mock 数据
 */

import type { AxiosRequestConfig } from 'axios';
import type { Result } from '@/components/http/types';
import Mock from 'mockjs';
import type { MockDataMap } from '@/components/http/mock-data';
import { mockManager } from '@/components/http/mock-data';

/**
 * 生成符合 Result 格式的响应
 */
function createResult<T>(data: T, status: number = 200): Result<T> {
  // 先使用 Mock.mock 生成元数据，然后直接设置 data，避免 data 被 mock 处理
  const result = Mock.mock({
    requestId: '@guid',
    requestTime: '@datetime("yyyy-MM-dd HH:mm:ss")',
    status,
    errorCode: status === 200 ? '' : '@word(5,10)',
    errorMessage: status === 200 ? '' : '@cword(5,15)',
  }) as Result<T>;
  
  // 直接设置 data，不经过 Mock.mock 处理
  result.data = data;
  
  return result;
}

/**
 * 生成符合 Passport 类型的 Mock 数据模板
 */
function getPassportTemplate(overrides: Partial<any> = {}): any {
  return {
    'id|+1': 1,
    'username|1': ['admin', 'user', 'test'],
    'realName|1': ['@cname', '@cname', '@cname'],
    'sex|1': ['MALE', 'FEMALE'],
    'birthday': '@date("yyyy-MM-dd")',
    'idNo': '@id',
    'mobile': /^1[3-9]\d{9}$/,
    'email': '@email',
    'version': '@integer(1, 100)',
    'createTime': '@datetime("yyyy-MM-dd HH:mm:ss")',
    'updateTime': '@datetime("yyyy-MM-dd HH:mm:ss")',
    ...overrides,
  };
}

/**
 * passport相关的 Mock 数据映射
 */
export const passportMockDataMap: MockDataMap = {
  // GET /passport - 根据条件查询列表
  '/passport': (config: AxiosRequestConfig) => {
    const query = config.params || {};
    const username = query?.username;
    const realName = query?.realName;
    const sex = query?.sex;
    const birthday = query?.birthday;
    const idNo = query?.idNo;
    const mobile = query?.mobile;
    const email = query?.email;

    const count = 15;

    const list: any[] = [];
    for (let i = 0; i < count; i++) {
      const item = Mock.mock(
        getPassportTemplate({
          id: i + 1,
        }),
      );
      list.push(item);
    }

    let filteredList = list;
    if (username) {
      filteredList = filteredList.filter((item: any) => {
        return item.username && item.username.includes(username);
      });
    }
    if (realName) {
      filteredList = filteredList.filter((item: any) => {
        return item.realName && item.realName.includes(realName);
      });
    }
    if (sex) {
      filteredList = filteredList.filter((item: any) => {
        return item.sex === sex;
      });
    }
    if (birthday) {
      filteredList = filteredList.filter((item: any) => {
        return item.birthday && item.birthday.includes(birthday);
      });
    }
    if (idNo) {
      filteredList = filteredList.filter((item: any) => {
        return item.idNo && item.idNo.includes(idNo);
      });
    }
    if (mobile) {
      filteredList = filteredList.filter((item: any) => {
        return item.mobile && item.mobile.includes(mobile);
      });
    }
    if (email) {
      filteredList = filteredList.filter((item: any) => {
        return item.email && item.email.includes(email);
      });
    }

    return createResult(filteredList);
  },

  // GET /passport/list - 根据条件查询列表（兼容接口）
  '/passport/list': (config: AxiosRequestConfig) => {
    const query = config.params || {};
    const username = query?.username;
    const realName = query?.realName;
    const sex = query?.sex;
    const birthday = query?.birthday;
    const idNo = query?.idNo;
    const mobile = query?.mobile;
    const email = query?.email;

    const count = 15;

    const list: any[] = [];
    for (let i = 0; i < count; i++) {
      const item = Mock.mock(
        getPassportTemplate({
          id: i + 1,
        }),
      );
      list.push(item);
    }

    let filteredList = list;
    if (username) {
      filteredList = filteredList.filter((item: any) => {
        return item.username && item.username.includes(username);
      });
    }
    if (realName) {
      filteredList = filteredList.filter((item: any) => {
        return item.realName && item.realName.includes(realName);
      });
    }
    if (sex) {
      filteredList = filteredList.filter((item: any) => {
        return item.sex === sex;
      });
    }
    if (birthday) {
      filteredList = filteredList.filter((item: any) => {
        return item.birthday && item.birthday.includes(birthday);
      });
    }
    if (idNo) {
      filteredList = filteredList.filter((item: any) => {
        return item.idNo && item.idNo.includes(idNo);
      });
    }
    if (mobile) {
      filteredList = filteredList.filter((item: any) => {
        return item.mobile && item.mobile.includes(mobile);
      });
    }
    if (email) {
      filteredList = filteredList.filter((item: any) => {
        return item.email && item.email.includes(email);
      });
    }

    return createResult(filteredList);
  },

  // GET /passport/page - 根据条件分页查询
  '/passport/page': (config: AxiosRequestConfig) => {
    const query = config.params || {};
    const pageNum = parseInt(query?.pageNum || query?.page || '1', 10);
    const pageSize = parseInt(query?.pageSize || query?.size || '10', 10);
    const username = query?.query?.username || query?.username;
    const realName = query?.query?.realName || query?.realName;
    const sex = query?.query?.sex || query?.sex;
    const birthday = query?.query?.birthday || query?.birthday;
    const idNo = query?.query?.idNo || query?.idNo;
    const mobile = query?.query?.mobile || query?.mobile;
    const email = query?.query?.email || query?.email;

    const total = 50;
    const count = Math.min(pageSize, total - (pageNum - 1) * pageSize);
    const template: any = {
      [`records|${count}`]: [getPassportTemplate()],
    };

    const result = Mock.mock(template);

    // 计算总页数
    const totalPages = Math.ceil(total / pageSize);

    const pageData = {
      pageNum,
      pageSize,
      total,
      totalPages,
      records: result.records,
    };

    return createResult(pageData);
  },

  // GET /passport/:id - 按 ID 查询单条明细
  // DELETE /passport/:id - 删除
  '/passport/:id': (config: AxiosRequestConfig) => {
    const method = (config.method || 'GET').toUpperCase();
    const id = parseInt((config.url || '').split('/').pop() || '1', 10);
    
    if (method === 'DELETE') {
      // DELETE 请求：返回删除的行数
      const deletedRows = 1;
      return createResult(deletedRows);
    } else {
      // GET 请求：返回单条明细
      const passportItem = Mock.mock(
        getPassportTemplate({
          id,
        }),
      );
      return createResult(passportItem);
    }
  },

  // POST /passport/save - 保存（新增或更新）
  '/passport/save': (config: AxiosRequestConfig) => {
    const payload = config.data || {};
    const isUpdate = payload.id !== undefined && payload.id !== null;
    
    // 如果是更新，使用传入的 id；如果是新增，生成新 id
    const id = isUpdate ? payload.id : Mock.Random.integer(1000, 9999);
    
    // 生成完整的passport数据
    const passportItem = Mock.mock(
      getPassportTemplate({
        id,
        username: payload.username !== undefined ? payload.username : 'user' + id,
        realName: payload.realName !== undefined ? payload.realName : '@cname',
        sex: payload.sex !== undefined ? payload.sex : '@pick(["MALE", "FEMALE"])',
        birthday: payload.birthday !== undefined ? payload.birthday : '@date("yyyy-MM-dd")',
        idNo: payload.idNo !== undefined ? payload.idNo : '@id',
        mobile: payload.mobile !== undefined ? payload.mobile : /^1[3-9]\d{9}$/,
        email: payload.email !== undefined ? payload.email : '@email',
        updateTime: '@datetime("yyyy-MM-dd HH:mm:ss")',
        createTime: isUpdate ? '@datetime("yyyy-MM-dd HH:mm:ss")' : '@datetime("yyyy-MM-dd HH:mm:ss")',
      }),
    );
    
    return createResult(passportItem);
  },

  // GET /passport/current - 获取当前登录用户的账号信息
  '/passport/current': (config: AxiosRequestConfig) => {
    // 模拟当前用户信息（固定返回一个用户）
    const currentUser = Mock.mock(
      getPassportTemplate({
        id: 1,
        username: 'admin',
        realName: '管理员',
        sex: 'MALE',
        birthday: '1990-01-01',
        idNo: '110101199001011234',
        mobile: '13800138000',
        email: 'admin@example.com',
        version: 1,
        createTime: '2024-01-01 00:00:00',
        updateTime: '2024-01-01 00:00:00',
      }),
    );
    return createResult(currentUser);
  },

  // POST /passport/current/update - 更新当前用户的账号信息
  '/passport/current/update': (config: AxiosRequestConfig) => {
    const payload = config.data || {};
    
    // 模拟更新后的用户信息
    const updatedUser = Mock.mock(
      getPassportTemplate({
        id: 1,
        username: payload.username !== undefined ? payload.username : 'admin',
        realName: payload.realName !== undefined ? payload.realName : '管理员',
        sex: payload.sex !== undefined ? payload.sex : 'MALE',
        birthday: payload.birthday !== undefined ? payload.birthday : '1990-01-01',
        idNo: payload.idNo !== undefined ? payload.idNo : '110101199001011234',
        mobile: payload.mobile !== undefined ? payload.mobile : '13800138000',
        email: payload.email !== undefined ? payload.email : 'admin@example.com',
        version: 1,
        createTime: '2024-01-01 00:00:00',
        updateTime: '@datetime("yyyy-MM-dd HH:mm:ss")',
      }),
    );
    
    return createResult(updatedUser);
  },

  // POST /passport/current/change-password - 修改当前用户的密码
  '/passport/current/change-password': (config: AxiosRequestConfig) => {
    const payload = config.data || {};
    
    // 模拟密码验证（简单验证：原密码不能为空）
    if (!payload.oldPassword || payload.oldPassword.trim() === '') {
      return createResult(null, 400);
    }
    
    // 模拟密码修改成功
    return createResult({ success: true });
  },
};

// 模块加载时自动注册到 mockManager
mockManager.registerAll(passportMockDataMap);
