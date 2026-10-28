import type { MainPublicProps } from '@g2rain/platform/main';
import type { AdapterResolver, ShellMicroAppAdapter, ShellMicroAppMountInput } from './types';

/**
 * AppKit-only resolver：所有 applicationCode 走同一适配器。
 */
export function createAppkitOnlyResolver(appkit: ShellMicroAppAdapter): AdapterResolver {
  return (): ShellMicroAppAdapter => appkit;
}

export type { AdapterResolver, ShellMicroAppAdapter, ShellMicroAppMountInput, MainPublicProps };
export { createAppkitAdapter } from './appkit-adapter';
