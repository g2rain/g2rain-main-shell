/**
 * 认证相关路由配置
 * 包含 SSO 回调等认证相关路由
 */

import type { RouteRecordRaw } from 'vue-router';

export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/sso_callback',
    name: 'SsoCallback',
    component: () => import('@/views/auth/SsoCallback.vue'), // SSO回调组件
    meta: { title: 'SSO回调', requiresAuth: false }, // 明确标记不需要认证
  },
  {
    path: '/logout',
    name: 'Logout',
    component: () => import('@/views/auth/Logout.vue'), // 退出页面
    meta: { title: '退出登录', requiresAuth: false }, // 明确标记不需要认证
  },
  {
    path: '/passport/bind-result',
    name: 'PassportBindResult',
    component: () => import('@/views/passport/BindResult.vue'),
    meta: { title: '钉钉绑定结果', requiresAuth: false },
  },
];

