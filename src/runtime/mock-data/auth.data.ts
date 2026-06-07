/**
 * 认证相关 Mock 数据
 * 包含菜单、权限等认证相关的 mock 数据
 */

import type { MenuItem } from '@platform/types';
import type { MockDataFunction, MockDataMap } from '@/components/http/mock-data';
import type { Result } from '@/components/http/types';

/**
 * Mock 菜单列表数据
 */
export const mockMenuList: MenuItem[] = [
  {
    key: 'home',
    menuCode: 'home',
    title: '首页',
    type: 'main',
    routePath: '/main/home',
  },
  {
    key: 'system',
    menuCode: 'system',
    title: '系统设置',
    type: 'group',
    children: [
      {
        key: 'system-passport',
        menuCode: 'system-passport',
        title: '账号管理',
        type: 'main',
        routePath: '/main/system/passport',
      },
    ],
  },
  {
    key: 'group-test',
    menuCode: 'group-test',
    title: '测试1',
    type: 'group',
    children: [
      {
        key: 'test-dict',
        menuCode: 'test-dict',
        title: '字典管理',
        type: 'sub', // 子应用菜单项必须是 'sub' 类型
        routePath: '/dict',
        name: 'g2rain-test-app',
        activeRule: '/test',
        entry: 'http://localhost:3001', // 子应用入口地址（开发环境，使用完整 URL）
      },
      {
        key: 'test-',
        menuCode: 'test-home',
        title: '测试应用首页',
        type: 'sub', // 子应用菜单项必须是 'sub' 类型
        routePath: '/',
        name: 'g2rain-test-app',
        activeRule: '/test',
        entry: 'http://localhost:3001', // 子应用入口地址（开发环境，使用完整 URL）
      },
    ],
  },
];

// IAM 公钥（PEM 格式）
export const IAM_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEDwZbuQCoqp/oUrv4uWRgCW329J5A
a5HpunjEjttgwHFZicDa6fUJNi7Djj8eZ8TdFotc0II0mLc1BVDdEkN8MA==
-----END PUBLIC KEY-----`;

// IAM Key ID
export const IAM_KEY_ID = 'yEMzeGLlhMpK5GxQKP5Fhg7JH9eALB7BK2BkadTOUxw';

// Mock Token - 访问令牌（用于 /auth/token 接口）
const MOCK_ACCESS_TOKEN =
  'eyJraWQiOiJ5RU16ZUdMbGhNcEs1R3hRS1A1RmhnN0pIOWVBTEI3QksyQmthZFRPVXh3IiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJjbGllbnRQdWJsaWNLZXkiOiJ7XCJrdHlcIjpcIkVDXCIsXCJjcnZcIjpcIlAtMjU2XCIsXCJ4XCI6XCJxQzByaE5Ua2lSSjUyUmJIT2dNd3Q3dlBUeU43el9uYmlNZmpkd28wWXhFXCIsXCJ5XCI6XCJXVmZaTVBfaWZfVVlPeGhRa1J4TlZjWFcyd0h2by1raHJvTlNIZXZsMlo0XCJ9IiwiYWRtaW5fY29tcGFueSI6ZmFsc2UsImFwcGxpY2F0aW9uQ29kZXMiOlsiZzJyYWluLWRlZmF1bHQiXSwicmVmcmVzaEV4cGlyZUF0IjoxNzY2ODM0NDcxLCJpc3N1ZWRBdCI6MTc2NjgzMDg3MSwiZXhwaXJlQXQiOjE3NjY4MzI2NzEsImFkbWluX3VzZXIiOmZhbHNlfQ.z5o2Xgb1dB8OdcWR04_0DshI8m5qNiwdUWUc5VZsR11AaMn7a-oSlC757yUutVLXNKEdXMJLBWohVrm4sgV-hg';

// Mock Token - DPoP Token（用于 /lua/sign_code 接口）
const MOCK_DPOP_TOKEN =
  'eyJhbGciOiJFUzI1NiIsInBoX2FsZyI6IlNIQS0yNTYiLCJraWQiOiJ5RU16ZUdMbGhNcEs1R3hRS1A1RmhnN0pIOWVBTEI3QksyQmthZFRPVXh3IiwidHlwIjoiZHBvcCtqd3QiLCJqd2siOnsia3R5IjoiRUMiLCJ4IjoiaFJiRWJHd2hBNEhuTzVMVkNyekxMb2Vzb05pWXdiRkRpYmItQVI3dTJlVSIsImNydiI6IlAtMjU2IiwieSI6IjlIVWthS0VBM0dXNjFiMkt6VGNFNURsaklOa01SVXJWb0djbVViODZfUDAifX0.eyJodG0iOiJQT1NUIiwiYWNkIjoiZzJyYWluLWRlZmF1bHQiLCJwaGEiOiJ6SGZjNE9HaW9SSjREWHZwWlpVTUhnbTM1OXktaXRIOTVKMGdfLTJLVEJVIiwiaWF0IjoxNzY2NTM4MDI0LCJleHAiOjE3NjY1MzgzMjQsImh0dSI6IlwvYXV0aFwvdG9rZW4iLCJqdGkiOiIwMTliNGRkZjE2MzAwMDAwYmI2YWQzZjkxYTY4MjZjZDZlYzE1N2M2ODNmY2YzYTMifQ.ElBUY0GTaNqFbtCTi3rLXDD1Nc8pxa0P0AHCX5EgKHseZ6QIAiwRRh7iWPko5louYJzy1wFPA5xS5UCJdudjVg';

/**
 * 认证相关 Mock 接口配置
 * 包含 token 获取、签名等认证相关的 mock 接口
 */
export const authMockDataMap: MockDataMap = {
  // POST /auth/token - 获取访问令牌
  // 请求体：{ code: string, grantType: string }
  // 返回：Result<{ token: string, keyId: string }>
  // 支持两种格式：/auth/token 和 /*/auth/token（如 /main/auth/token）
  '/auth/token': (() => {
    return {
      requestId: null,
      requestTime: null,
      status: 200,
      errorCode: '',
      errorMessage: '',
      data: {
        token: MOCK_ACCESS_TOKEN,
        keyId: IAM_KEY_ID,
      },
    } as unknown as Result;
  }) as MockDataFunction,
  '/*/auth/token': (() => {
    return {
      requestId: null,
      requestTime: null,
      status: 200,
      errorCode: '',
      errorMessage: '',
      data: {
        token: MOCK_ACCESS_TOKEN,
        keyId: IAM_KEY_ID,
      },
    } as unknown as Result;
  }) as MockDataFunction,

  // POST /lua/sign_code - Lua 签名接口
  // 用于生成 Application-DPoP Token
  // 查询参数：jti (JWT ID)
  // 请求体：{ code: string, grantType: string }
  // 返回：{ token: string } (JWT Token 字符串)
  // 支持两种格式：/lua/sign_code 和 /*/lua/sign_code（如 /main/lua/sign_code）
  '/lua/sign_code': (() => {
    return {
      token: MOCK_DPOP_TOKEN,
    };
  }) as MockDataFunction,
  '/*/lua/sign_code': (() => {
    return {
      token: MOCK_DPOP_TOKEN,
    };
  }) as MockDataFunction,
};
