/**
 * 应用启动器
 * 统一管理所有服务的加载和卸载，确保按依赖顺序加载
 */

import type { Router } from 'vue-router';
import router from '@runtime/router/index';
import { sso } from '@runtime/auth';
import { pageBoot } from '@/runtime/boot/page.boot';
import { tabBoot } from '@/runtime/boot/tab.boot';
import { microAppBoot } from '@/runtime/boot/micro-app.boot';
import { mockBoot } from '@/runtime/boot/mock.boot';
import { useAccessTokenStore } from '@platform/stores/token.store';
import { useMenuStore } from '@platform/stores/menu.store';
import { useMicroAppStore } from '@platform/stores';
import { useTabStore } from '@platform/stores';
import { useRuntimeStore } from '@platform/stores/runtime.store';
import { TokenInvalidHandler } from '@platform/apps';
import { initHttp } from '@runtime/http';
import { clearReturnUrl, resetNavigationRestoreState } from '@runtime/navigation/sub-app-redirect';

/**
 * 启动所有服务
 * 按依赖顺序加载：
 * 0. Mock Data - Mock 数据注册（最基础，在 HTTP 请求之前）
 * 1. SSO Service - 认证服务（最基础）
 * 2. Resource Service - 资源服务（依赖 token）
 * 3. Micro App - 微应用管理（依赖菜单）
 * 4. Tab Route Sync - Tab 路由同步（依赖路由和 tab store）
 * 5. Micro App Event Listeners - 微应用事件监听（依赖微应用）
 */
export function start(): void {
  console.log('[Boot] 开始加载服务...');

  // -1. 初始化 HTTP 组件（认证会话 + 认证异常处理），需在所有 HTTP 请求之前
  initHttp();
  console.log('[Boot] ✅ Http 已初始化');

  // 0. 加载 Mock 数据（在 HTTP 请求之前注册）
  mockBoot.start();
  console.log('[Boot] ✅ Mock Data 已加载');

  // 1. 加载 SSO 服务（认证服务，最基础）
  sso.start();
  console.log('[Boot] ✅ SSO Service 已加载');

  // 2. 加载资源服务（依赖 token，监听登录状态加载菜单）
  pageBoot.start();
  console.log('[Boot] ✅ Resource Service 已加载');

  // 3. 加载微应用监控（依赖菜单，监听菜单初始化状态）
  microAppBoot.startMicroApp();
  console.log('[Boot] ✅ 微应用监控已加载');

  // 4. 加载 Tab 路由同步（依赖路由和 tab store）
  tabBoot.start(router);
  console.log('[Boot] ✅ Tab Route Sync Service 已加载');

  // 5. 初始化微应用事件监听器（依赖微应用）
  const runtimeStore = useRuntimeStore();
  runtimeStore.initEventListeners();
  console.log('[Boot] ✅ 微应用事件监听器已加载');

  //6. 初始化sso到message-handlers的TokenInvalidHandler
  TokenInvalidHandler.setAuthHandler(sso);
  console.log('[Boot] ✅ TokenInvalidHandler 已绑定 SSO AuthHandler');

  console.log('[Boot] 所有服务加载完成');
}

/**
 * 卸载所有服务
 * 按相反顺序卸载，确保依赖关系正确
 */
export function unloadServices(): void {
  console.log('[Boot] 开始卸载服务...');

  // 5. 清理微应用事件监听器
  const runtimeStore = useRuntimeStore();
  runtimeStore.cleanupEventListeners();
  console.log('[Boot] ✅ 微应用事件监听器已卸载');

  // 4. 停止 Tab 路由同步
  tabBoot.stop();
  console.log('[Boot] ✅ Tab Route Sync Service 已卸载');

  // 3. 停止微应用监控
  microAppBoot.stopMicroApp();
  console.log('[Boot] ✅ 微应用监控已卸载');

  // 2. 停止资源服务
  pageBoot.stop();
  console.log('[Boot] ✅ Resource Service 已卸载');

  // 1. 停止 SSO 服务
  sso.stop();
  console.log('[Boot] ✅ SSO Service 已卸载');

  // 0. 停止 Mock 数据
  mockBoot.stop();
  console.log('[Boot] ✅ Mock Data 已卸载');

  console.log('[Boot] 所有服务已卸载');
}

/**
 * 退出登录
 * 清理所有状态和服务，并跳转到退出页面
 * @param router 可选的路由实例，如果提供则自动跳转到退出页面
 */
export function logout(router?: Router): void {
  console.log('[Boot] 开始退出登录...');

  // 1. 卸载所有服务
  unloadServices();

  // 2. 清理 token store
  const tokenStore = useAccessTokenStore();
  tokenStore.logout();

  // 3. 清理菜单 store
  const menuStore = useMenuStore();
  menuStore.reset();

  // 4. 清理微应用 store
  const microAppStore = useMicroAppStore();
  microAppStore.reset();

  // 5. 清理 tab store
  const tabStore = useTabStore();
  tabStore.tabs = [];
  tabStore.activeTabKey = '';

  clearReturnUrl();
  resetNavigationRestoreState();

  // 6. 跳转到退出页面（如果提供了 router）
  if (router) {
    router.push({ path: '/logout' }).catch((error) => {
      console.error('[Boot] 跳转到退出页面失败:', error);
    });
  }

  console.log('[Boot] 退出登录完成');
}
