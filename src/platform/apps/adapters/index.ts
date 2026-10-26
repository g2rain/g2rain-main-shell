import type { MainPublicProps } from '@g2rain/platform/main';
import type { AdapterResolver, ShellMicroAppAdapter, ShellMicroAppMountInput } from './types';
import { isLegacyApplication } from '../../legacy';

/**
 * Default AppKit adapter: RuntimeStore / QiankunManager still own the loader.
 * This resolver marks protocol selection; mount is delegated by callers that hold the loader.
 */
export function createPassthroughResolver(
  appkit: ShellMicroAppAdapter,
  legacy: ShellMicroAppAdapter,
): AdapterResolver {
  return (applicationCode: string): ShellMicroAppAdapter => {
    return isLegacyApplication(applicationCode) ? legacy : appkit;
  };
}

export type { AdapterResolver, ShellMicroAppAdapter, ShellMicroAppMountInput, MainPublicProps };
export { createAppkitAdapter } from './appkit-adapter';
