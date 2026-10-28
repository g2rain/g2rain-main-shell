import { stripActiveRule } from '@/shared/url.util';
import { useRuntimeStore } from '@platform/stores/runtime.store';
import { useTabStore } from '@platform/stores/tab.store';

const ROUTE_CHANGE = 'g2rain:sub-app:route-change';

interface RouteChangeDetail {
  type?: string;
  instanceId?: string;
  appKey?: string;
  data?: {
    appKey?: string;
    activeRule?: string;
    routePath?: string;
    fullPath?: string;
  };
}

let started = false;

/**
 * Sub → Main route-change: update lastActivePath + browser address bar.
 * Ignores late messages from non-active tabs (fast Tab switch).
 */
export function startRouteChangeHandler(): void {
  if (started || typeof window === 'undefined') return;
  started = true;

  window.addEventListener(ROUTE_CHANGE, ((event: Event) => {
    handleRouteChange(event);
  }) as EventListener);
}

function handleRouteChange(event: Event): void {
  const detail = (event as CustomEvent<RouteChangeDetail>).detail;
  if (!detail || typeof detail !== 'object') return;

  const fullPath =
    typeof detail.data?.fullPath === 'string' ? detail.data.fullPath.trim() : '';
  if (!fullPath) return;

  const appKey =
    (typeof detail.data?.appKey === 'string' && detail.data.appKey.trim()) ||
    (typeof detail.instanceId === 'string' && detail.instanceId.trim()) ||
    (typeof detail.appKey === 'string' && detail.appKey.trim()) ||
    '';
  if (!appKey) {
    console.warn('[RouteChangeHandler] missing appKey/instanceId, ignore');
    return;
  }

  const tabStore = useTabStore();
  const active = tabStore.activeTab;
  if (active?.key !== appKey || !active.isSubTab()) {
    return;
  }

  const activeRule =
    typeof detail.data?.activeRule === 'string' ? detail.data.activeRule : '';
  const internalPath = stripActiveRule(activeRule, fullPath);

  const runtimeStore = useRuntimeStore();
  runtimeStore.setLastActivePath(appKey, internalPath);

  console.log('[RouteChangeHandler] updated lastActivePath', {
    appKey,
    activeRule,
    fullPath,
    internalPath,
  });

  window.history.replaceState(
    { ...(window.history.state || {}), microApp: true },
    '',
    `${window.location.origin}${fullPath.startsWith('/') ? fullPath : `/${fullPath}`}`,
  );
}
