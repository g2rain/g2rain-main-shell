import type { MainPublicProps } from '@g2rain/platform/main';
import type { DpopClient } from '@g2rain/http';

/**
 * Private mount props for legacy sub-apps only.
 * Must not appear on core Definition types. Never log these fields.
 */
export type LegacyMountProps = Readonly<MainPublicProps> &
  Readonly<{
    token?: string;
    tokenKid?: string;
    client?: DpopClient;
    mainAppInfo?: { name: string };
    [key: string]: unknown;
  }>;
