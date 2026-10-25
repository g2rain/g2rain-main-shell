/**
 * Legacy-only applicationCode registry.
 * Unlisted codes use AppKit. Only explicitly registered legacy apps use compatibility props.
 */

export interface LegacyIntegrationSpec {
  protocolVersion: 'legacy';
}

export const LEGACY_APPLICATION_REGISTRY: Record<string, LegacyIntegrationSpec> = {
  'g2rain-manager-app': { protocolVersion: 'legacy' },
  'g2rain-infra-app': { protocolVersion: 'legacy' },
  'g2rain-department-app': { protocolVersion: 'legacy' },
  'g2rain-cms-app': { protocolVersion: 'legacy' },
};

export function isLegacyApplication(applicationCode: string): boolean {
  const code = applicationCode.trim();
  if (!code) return false;
  return Object.prototype.hasOwnProperty.call(LEGACY_APPLICATION_REGISTRY, code);
}

export function getLegacyIntegration(
  applicationCode: string,
): LegacyIntegrationSpec | undefined {
  const code = applicationCode.trim();
  if (!isLegacyApplication(code)) return undefined;
  return LEGACY_APPLICATION_REGISTRY[code];
}
