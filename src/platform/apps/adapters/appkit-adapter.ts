import type { MainPublicProps } from '@g2rain/platform/main';
import type { ShellMicroAppAdapter, ShellMicroAppMountInput } from './types';

/**
 * AppKit path: props pass through; Auth Bridge on window CustomEvent.
 * Mount/update/unmount are injected so Shared Qiankun loader stays single.
 */
export function createAppkitAdapter(loader: {
  mount: (input: ShellMicroAppMountInput) => Promise<void>;
  update: (instanceId: string, props: Readonly<MainPublicProps> | Readonly<Record<string, unknown>>) => Promise<void>;
  unmount: (instanceId: string) => Promise<void>;
  has: (instanceId: string) => boolean;
}): ShellMicroAppAdapter {
  return {
    mount: (input) => loader.mount(input),
    update: (instanceId, props) => loader.update(instanceId, props),
    unmount: (instanceId) => loader.unmount(instanceId),
    has: (instanceId) => loader.has(instanceId),
  };
}
