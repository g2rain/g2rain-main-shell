import type { MainPublicProps } from '@g2rain/platform/main';

/**
 * Protocol adapter port used by RuntimeStore via AdapterResolver.
 */
export interface ShellMicroAppMountInput {
  instanceId: string;
  entry: string;
  container: string | HTMLElement;
  props: Readonly<MainPublicProps> | Readonly<Record<string, unknown>>;
  name: string;
}

export interface ShellMicroAppAdapter {
  mount(input: ShellMicroAppMountInput): Promise<void>;
  update(instanceId: string, props: Readonly<MainPublicProps> | Readonly<Record<string, unknown>>): Promise<void>;
  unmount(instanceId: string): Promise<void>;
  has(instanceId: string): boolean;
}

export type AdapterResolver = (applicationCode: string) => ShellMicroAppAdapter;
