import type { AppIntegrationMode } from '@platform/types';
import { getLegacyIntegration } from '../legacy';

/**
 * 子应用按 applicationCode 的接入模式配置。
 *
 * 配置只表达 Shell 的集成契约，不承载菜单、入口地址或权限；这些仍以服务端菜单为准。
 * 未显式登记的应用默认采用 AppKit；旧应用仅通过 legacy registry 保留兼容。
 */
export interface ApplicationCodeConfig {
  mode: AppIntegrationMode;
  protocolVersion: string;
}

export const APPLICATION_CODE_CONFIG: Readonly<Record<string, ApplicationCodeConfig>> = {
  'g2rain-knowledge-app': {
    mode: 'appkit',
    protocolVersion: '1',
  },
  'g2rain-member-app': {
    mode: 'appkit',
    protocolVersion: '1',
  },
  'g2rain-manager-app': {
    mode: 'legacy',
    protocolVersion: 'legacy',
  },
  'g2rain-infra-app': {
    mode: 'legacy',
    protocolVersion: 'legacy',
  },
  'g2rain-department-app': {
    mode: 'legacy',
    protocolVersion: 'legacy',
  },
  'g2rain-cms-app': {
    mode: 'legacy',
    protocolVersion: 'legacy',
  },
};

const APPKIT_DEFAULT: ApplicationCodeConfig = {
  mode: 'appkit',
  protocolVersion: '1',
};

export function resolveApplicationCodeConfig(applicationCode: string): ApplicationCodeConfig {
  const code = applicationCode.trim();
  if (getLegacyIntegration(code)) {
    return { mode: 'legacy', protocolVersion: 'legacy' };
  }
  return APPLICATION_CODE_CONFIG[code] ?? APPKIT_DEFAULT;
}
