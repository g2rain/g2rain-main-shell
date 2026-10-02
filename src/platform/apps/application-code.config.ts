import type { AppIntegrationMode } from '@platform/types';

/**
 * 子应用按 applicationCode 的接入模式配置。
 *
 * 配置只表达 Shell 的集成契约，不承载菜单、入口地址或权限；这些仍以服务端菜单为准。
 * 未显式登记的历史应用按 legacy 处理，确保新增此配置不会中断现有子应用。
 */
export interface ApplicationCodeConfig {
  mode: AppIntegrationMode;
  protocolVersion: string;
}

export const APPLICATION_CODE_CONFIG: Readonly<Record<string, ApplicationCodeConfig>> = {
  'g2rain-member-app': {
    mode: 'appkit',
    protocolVersion: '1',
  },
  'g2rain-manager-app': {
    mode: 'legacy',
    protocolVersion: 'legacy',
  },
};

const LEGACY_DEFAULT: ApplicationCodeConfig = {
  mode: 'legacy',
  protocolVersion: 'legacy',
};

export function resolveApplicationCodeConfig(applicationCode: string): ApplicationCodeConfig {
  return APPLICATION_CODE_CONFIG[applicationCode] ?? LEGACY_DEFAULT;
}
