/**
 * 子应用网关导航：/main/redirect/{context}/... → /{context}/...
 * 用于同域下 main-shell 与子应用的 SSO 回跳与深链恢复。
 */

import type { Router } from 'vue-router';
import { getContextPath, getPathWithContextPath } from '@shared/env';
import { stripActiveRule, wrapActiveRule } from '@shared/url.util';
import { useAccessTokenStore } from '@platform/stores/token.store';
import { useMenuStore } from '@platform/stores/menu.store';
import { useMicroAppStore } from '@platform/stores/app.store';
import { useTabStore } from '@platform/stores';
import { useRuntimeStore } from '@platform/stores/runtime.store';
import type { MenuItem } from '@platform/types';

/** 浏览器地址栏中的网关前缀，如 /main/redirect（随 VITE_CONTEXT_PATH 变化） */
export function getRedirectGatewayPrefix(): string {
  return normalizePathname(getPathWithContextPath('/redirect'));
}

/** Vue Router 内注册的相对路径前缀（history base 之下） */
export const REDIRECT_GATEWAY_ROUTE_PREFIX = '/redirect';

export const RETURN_URL_STORAGE_KEY = 'return_url';

let navigationRestored = false;

/** 深链恢复：router.replace('/home') 离开网关期间，禁止 beforeEach 自动激活首页 Tab */
let deepLinkLeavingGateway = false;

/** 网关离开 + 开 Tab 的 in-flight，防止 restoreAfterAuth / 网关页并行跑两遍 */
let gatewayRestorePromise: Promise<boolean> | null = null;

export function isDeepLinkLeavingGateway(): boolean {
  return deepLinkLeavingGateway;
}

/** 深链恢复进行中或已完成：菜单 watch 勿再强制 /home */
export function isDeepLinkRestorePending(): boolean {
  return deepLinkLeavingGateway || gatewayRestorePromise !== null || navigationRestored;
}


function splitPathAndSuffix(fullPath: string): { pathname: string; suffix: string } {
  const q = fullPath.indexOf('?');
  const h = fullPath.indexOf('#');
  if (q < 0 && h < 0) {
    return { pathname: fullPath, suffix: '' };
  }
  const cut = Math.min(q >= 0 ? q : Infinity, h >= 0 ? h : Infinity);
  return {
    pathname: fullPath.slice(0, cut) || '/',
    suffix: fullPath.slice(cut),
  };
}

function normalizePathname(pathname: string): string {
  const p = `/${(pathname || '').trim()}`.replace(/\/+/g, '/');
  if (p.length > 1 && p.endsWith('/')) {
    return p.slice(0, -1);
  }
  return p || '/';
}

function normalizeActiveRule(activeRule: string): string {
  return normalizePathname(activeRule);
}

export function isAuthPagePath(pathname: string): boolean {
  return pathname.endsWith('/sso_callback') || pathname.endsWith('/logout');
}

function matchesGatewayPrefix(pathname: string, prefix: string): boolean {
  const normalized = normalizePathname(pathname);
  return normalized === prefix || normalized.startsWith(`${prefix}/`);
}

export function isRedirectGatewayPath(fullPath: string): boolean {
  const { pathname } = splitPathAndSuffix(fullPath);
  return (
    matchesGatewayPrefix(pathname, getRedirectGatewayPrefix()) ||
    matchesGatewayPrefix(pathname, REDIRECT_GATEWAY_ROUTE_PREFIX)
  );
}

/** 浏览器 pathname 是否落在 Shell Context Path 之外（如 /member/...） */
export function isMicroAppBrowserPath(pathname?: string): boolean {
  const path = normalizePathname(pathname ?? window.location.pathname);
  if (isAuthPagePath(path) || isRedirectGatewayPath(path)) return false;
  const ctx = normalizePathname(getContextPath());
  if (ctx === '/' || ctx === '') return false;
  return path !== ctx && !path.startsWith(`${ctx}/`);
}

/**
 * SPA 若以子应用深链文档加载（Nginx 回退到 shell index），Vue Router base
 * 会把地址改写成 /{shellContext}/member/...，破坏深链恢复。
 * 须在 createWebHistory 之前改写到 Redirect Gateway（位于 Shell base 下）。
 */
export function rewriteMicroDeepLinkToGateway(): void {
  if (typeof window === 'undefined') return;
  const full = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (!isMicroAppBrowserPath(window.location.pathname)) return;

  const gateway = buildRedirectGatewayFromTarget(full);
  if (
    normalizePathname(splitPathAndSuffix(gateway).pathname) ===
    normalizePathname(window.location.pathname)
  ) {
    return;
  }

  console.info('[SubAppRedirect] rewrite micro deep-link → gateway', { from: full, to: gateway });
  window.history.replaceState(window.history.state, '', gateway);
}

/** 将 router.fullPath 或 location 规范为浏览器网关路径（写入 return_url） */
export function normalizeToBrowserGatewayPath(fullPath: string): string {
  const { pathname, suffix } = splitPathAndSuffix(fullPath);
  const browserPrefix = getRedirectGatewayPrefix();

  if (matchesGatewayPrefix(pathname, browserPrefix)) {
    return `${normalizePathname(pathname)}${suffix}`;
  }

  if (matchesGatewayPrefix(pathname, REDIRECT_GATEWAY_ROUTE_PREFIX)) {
    const rest =
      normalizePathname(pathname) === REDIRECT_GATEWAY_ROUTE_PREFIX
        ? ''
        : normalizePathname(pathname).slice(REDIRECT_GATEWAY_ROUTE_PREFIX.length);
    return `${browserPrefix}${rest}${suffix}`;
  }

  return buildRedirectGatewayFromTarget(fullPath);
}

/**
 * 将子应用真实路径包装为网关路径（保留 query/hash）
 */
export function buildRedirectGatewayFromTarget(targetFullPath: string): string {
  if (isRedirectGatewayPath(targetFullPath)) {
    return targetFullPath;
  }
  const { pathname, suffix } = splitPathAndSuffix(targetFullPath);
  return `${getRedirectGatewayPrefix()}${pathname}${suffix}`;
}

/**
 * 解析网关路径为子应用真实路径
 */
export function parseRedirectGateway(fullPath: string): {
  targetFullPath: string;
  contextPath: string;
  internalPath: string;
} | null {
  const { pathname, suffix } = splitPathAndSuffix(fullPath);
  const normalized = normalizePathname(pathname);

  let rest = '';
  if (matchesGatewayPrefix(normalized, getRedirectGatewayPrefix())) {
    const prefix = getRedirectGatewayPrefix();
    rest = normalized === prefix ? '' : normalized.slice(prefix.length);
  } else if (matchesGatewayPrefix(normalized, REDIRECT_GATEWAY_ROUTE_PREFIX)) {
    const prefix = REDIRECT_GATEWAY_ROUTE_PREFIX;
    rest = normalized === prefix ? '' : normalized.slice(prefix.length);
  } else {
    return null;
  }

  if (!rest || rest === '/') {
    return null;
  }

  const targetPathname = normalizePathname(rest);
  const targetFullPath = `${targetPathname}${suffix}`;
  const segments = targetPathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    return null;
  }

  const contextPath = `/${segments[0]}`;
  const internalPath = stripActiveRule(contextPath, targetPathname);

  return {
    targetFullPath,
    contextPath,
    internalPath,
  };
}

export function saveReturnUrl(fullPath?: string): void {
  const raw =
    fullPath ??
    `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const { pathname } = splitPathAndSuffix(raw);

  if (isAuthPagePath(pathname)) {
    return;
  }

  if (isRedirectGatewayPath(pathname)) {
    localStorage.setItem(RETURN_URL_STORAGE_KEY, normalizeToBrowserGatewayPath(raw));
    return;
  }

  localStorage.setItem(RETURN_URL_STORAGE_KEY, buildRedirectGatewayFromTarget(raw));
}

export function peekReturnUrl(): string | null {
  return localStorage.getItem(RETURN_URL_STORAGE_KEY);
}

export function consumeReturnUrl(): string | null {
  const value = localStorage.getItem(RETURN_URL_STORAGE_KEY);
  if (value) {
    localStorage.removeItem(RETURN_URL_STORAGE_KEY);
  }
  return value;
}

export function clearReturnUrl(): void {
  localStorage.removeItem(RETURN_URL_STORAGE_KEY);
}

export function resetNavigationRestoreState(): void {
  navigationRestored = false;
}

function collectMenuItems(items: MenuItem[]): MenuItem[] {
  const result: MenuItem[] = [];
  const traverse = (list: MenuItem[]) => {
    list.forEach((item) => {
      result.push(item);
      if (item.children?.length) {
        traverse(item.children);
      }
    });
  };
  traverse(items);
  return result;
}

function findMainMenuItemByRoutePath(menuItems: MenuItem[], routePath: string): MenuItem | null {
  const { pathname } = splitPathAndSuffix(routePath);
  const normalized = normalizePathname(pathname);

  for (const item of collectMenuItems(menuItems)) {
    if (item.type === 'main' && item.routePath && normalizePathname(item.routePath) === normalized) {
      return item;
    }
  }
  return null;
}

function normalizeInternalRoute(path: string): string {
  const p = normalizePathname(path);
  return p || '/';
}

/** 菜单 routePath 与 URL 剥离后的内部路径是否一致（用于刷新深链选中正确菜单项） */
function menuItemMatchesInternalPath(menuItem: MenuItem, internalPath: string): boolean {
  const menuRoute = normalizeInternalRoute(menuItem.routePath || '/');
  if (menuRoute === '/') {
    return true;
  }

  return internalPath === menuRoute || internalPath.startsWith(`${menuRoute}/`);
}

function scoreSubMenuItemForInternalPath(menuItem: MenuItem, rule: string, internalPath: string): number {
  const menuRoute = normalizeInternalRoute(menuItem.routePath || '/');
  if (menuRoute === '/') {
    return rule.length;
  }

  if (internalPath === menuRoute) {
    return rule.length * 10000 + menuRoute.length * 100 + 1000;
  }

  if (internalPath.startsWith(`${menuRoute}/`)) {
    return rule.length * 10000 + menuRoute.length * 100;
  }

  return -1;
}

function findSubMenuItemByTargetPath(menuItems: MenuItem[], targetFullPath: string): {
  menuItem: MenuItem;
  internalPath: string;
} | null {
  const { pathname } = splitPathAndSuffix(targetFullPath);
  const normalizedTarget = normalizePathname(pathname);

  const candidates: { menuItem: MenuItem; rule: string }[] = [];

  for (const item of collectMenuItems(menuItems)) {
    if (item.type !== 'sub' || !item.activeRule) {
      continue;
    }

    const rule = normalizeActiveRule(item.activeRule);
    if (rule === '/') {
      continue;
    }

    if (normalizedTarget === rule || normalizedTarget.startsWith(`${rule}/`)) {
      candidates.push({ menuItem: item, rule });
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  const longestRule = candidates.reduce((a, b) => (a.rule.length >= b.rule.length ? a : b)).rule;
  const internalPath = stripActiveRule(longestRule, normalizedTarget);

  const matching = candidates.filter((c) =>
    menuItemMatchesInternalPath(c.menuItem, internalPath),
  );
  const pool = matching.length > 0 ? matching : candidates;

  let bestItem = pool[0].menuItem;
  let bestScore = scoreSubMenuItemForInternalPath(bestItem, pool[0].rule, internalPath);

  for (let i = 1, j = pool.length; i < j; i++) {
    const score = scoreSubMenuItemForInternalPath(pool[i].menuItem, pool[i].rule, internalPath);
    if (score > bestScore) {
      bestScore = score;
      bestItem = pool[i].menuItem;
    }
  }

  return {
    menuItem: bestItem,
    internalPath,
  };
}

function canRestoreNavigation(): boolean {
  const tokenStore = useAccessTokenStore();
  const menuStore = useMenuStore();
  const microAppStore = useMicroAppStore();

  if (!tokenStore.isLogin || !menuStore.initialized || !microAppStore.initialized) {
    return false;
  }

  const pathname = normalizePathname(window.location.pathname);
  if (isAuthPagePath(pathname)) {
    return false;
  }

  return true;
}

function openMainTarget(router: Router, menuItem: MenuItem, targetFullPath: string): boolean {
  const tabStore = useTabStore();
  const { pathname } = splitPathAndSuffix(targetFullPath);

  if (tabStore.tabs.some((t) => t.key === menuItem.key)) {
    tabStore.setActiveTab(menuItem.key);
  } else {
    tabStore.addMainTab(menuItem.key, menuItem.title, menuItem.routePath!, menuItem.menuCode);
  }

  if (router.currentRoute.value.path !== pathname) {
    router.replace(targetFullPath).catch(() => undefined);
  }
  return true;
}

function openSubTarget(targetFullPath: string, internalPath?: string): boolean {
  const menuStore = useMenuStore();
  const tabStore = useTabStore();
  const runtimeStore = useRuntimeStore();

  const resolved = findSubMenuItemByTargetPath(menuStore.menuItems, targetFullPath);

  if (!resolved) {
    console.warn('[SubAppRedirect] 未找到匹配的子应用菜单:', targetFullPath);
    return false;
  }

  const pathToRemember = internalPath ?? resolved.internalPath;

  if (tabStore.tabs.some((t) => t.key === resolved.menuItem.key)) {
    tabStore.setActiveTab(resolved.menuItem.key);
  } else {
    tabStore.addTabFromMenuItem(resolved.menuItem, pathToRemember);
  }

  if (pathToRemember) {
    runtimeStore.setLastActivePath(resolved.menuItem.key, pathToRemember);
  }

  return true;
}

/** 仅用 history.replaceState 同步子应用浏览器地址，禁止 router.replace(微路径)（会拼到 Shell base 下） */
function syncBrowserAddressForActiveSubTab(): void {
  const tabStore = useTabStore();
  const runtimeStore = useRuntimeStore();
  const tab = tabStore.activeTab;
  if (!tab?.isSubTab() || !tab.app?.activeRule) {
    return;
  }
  const rawPath = runtimeStore.getLastActivePath(tab.key) ?? tab.initialPath;
  if (!rawPath) {
    return;
  }
  const pathname = wrapActiveRule(tab.app.activeRule, rawPath);
  const url = `${window.location.origin}${pathname}`;
  if (window.location.href === url) {
    return;
  }
  window.history.replaceState(
    { ...(window.history.state || {}), microApp: true },
    '',
    url,
  );
}

function openSubAndSyncBrowser(targetFullPath: string, internalPath: string): boolean {
  const opened = openSubTarget(targetFullPath, internalPath);
  if (opened) {
    syncBrowserAddressForActiveSubTab();
  }
  return opened;
}

/**
 * 将导航目标（网关或真实路径）应用到 Tab + 地址栏
 */
export function applyNavigationTarget(router: Router, fullPath: string): boolean {
  if (isRedirectGatewayPath(fullPath)) {
    const parsed = parseRedirectGateway(fullPath);
    if (!parsed) {
      return false;
    }

    if (gatewayRestorePromise) {
      return true;
    }

    const leaveGateway =
      router.currentRoute.value.name === 'SubAppRedirectGateway' ||
      isRedirectGatewayPath(router.currentRoute.value.fullPath);

    if (leaveGateway) {
      // 先离开网关，再开 Tab + replaceState 微路径；全程单飞
      const run = (async () => {
        deepLinkLeavingGateway = true;
        try {
          await router.replace('/home');
        } catch {
          /* ignore duplicate navigation */
        } finally {
          deepLinkLeavingGateway = false;
        }
        const opened = openSubAndSyncBrowser(parsed.targetFullPath, parsed.internalPath);
        if (opened) {
          navigationRestored = true;
        }
        return opened;
      })();
      gatewayRestorePromise = run;
      void run.finally(() => {
        if (gatewayRestorePromise === run) {
          gatewayRestorePromise = null;
        }
      });
      return true;
    }

    const opened = openSubAndSyncBrowser(parsed.targetFullPath, parsed.internalPath);
    if (opened) {
      navigationRestored = true;
    }
    return opened;
  }

  const menuStore = useMenuStore();
  const mainItem = findMainMenuItemByRoutePath(menuStore.menuItems, fullPath);
  if (mainItem?.routePath) {
    return openMainTarget(router, mainItem, fullPath);
  }

  const subResolved = findSubMenuItemByTargetPath(menuStore.menuItems, fullPath);
  if (subResolved) {
    const opened = openSubTarget(fullPath, subResolved.internalPath);
    if (opened) {
      syncBrowserAddressForActiveSubTab();
    }
    return opened;
  }

  return false;
}

/**
 * SSO 或菜单就绪后恢复 pending 导航（幂等）
 */
export function restoreAfterAuth(router: Router): boolean {
  if (navigationRestored || gatewayRestorePromise) {
    return true;
  }
  if (!canRestoreNavigation()) {
    return false;
  }

  const tabStore = useTabStore();
  let pending = consumeReturnUrl();
  let applied = false;

  if (pending) {
    applied = applyNavigationTarget(router, pending);
  } else if (
    (router.currentRoute.value.meta.microApp === true ||
      isMicroAppBrowserPath(window.location.pathname)) &&
    !tabStore.activeTabKey
  ) {
    const browserPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    applied = applyNavigationTarget(router, browserPath);
  } else if (isRedirectGatewayPath(router.currentRoute.value.fullPath)) {
    // 当前就在网关页：交给 SubAppRedirectGateway，避免与 restoreAfterAuth 双开
    return false;
  } else if (isRedirectGatewayPath(window.location.pathname)) {
    pending = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    applied = applyNavigationTarget(router, pending);
  }

  if (applied) {
    if (!gatewayRestorePromise) {
      navigationRestored = true;
    }
    console.log('[SubAppRedirect] 导航恢复完成');
    return true;
  }

  if (pending) {
    console.warn('[SubAppRedirect] 无法恢复导航目标，回退首页:', pending);
    router.replace('/home').catch(() => undefined);
    navigationRestored = true;
    return false;
  }

  return false;
}

/**
 * 已登录用户访问网关：解析并打开子应用真实路径
 */
export function handleRedirectGatewayWhenAuthed(router: Router, gatewayFullPath: string): boolean {
  if (navigationRestored || gatewayRestorePromise) {
    return true;
  }

  const parsed = parseRedirectGateway(gatewayFullPath);
  if (!parsed) {
    router.replace('/home').catch(() => undefined);
    return false;
  }

  if (!canRestoreNavigation()) {
    return false;
  }

  const opened = applyNavigationTarget(router, gatewayFullPath);
  if (!opened) {
    router.replace('/home').catch(() => undefined);
  }
  return opened;
}
