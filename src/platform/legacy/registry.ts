/**
 * Legacy-only applicationCode registry.
 * Unlisted codes keep main-shell historical default: legacy (SHELL-014 migration).
 * Explicit AppKit codes must not appear here.
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

/** AppKit allow-list — not legacy even if unlisted default would be legacy. */
const APPKIT_APPLICATION_CODES = new Set(['g2rain-member-app']);

export function isLegacyApplication(applicationCode: string): boolean {
  const code = applicationCode.trim();
  if (!code) return false;
  if (APPKIT_APPLICATION_CODES.has(code)) return false;
  if (Object.prototype.hasOwnProperty.call(LEGACY_APPLICATION_REGISTRY, code)) return true;
  // Historical default: unlisted = legacy (do not use for new apps).
  return true;
}

export function getLegacyIntegration(
  applicationCode: string,
): LegacyIntegrationSpec | undefined {
  const code = applicationCode.trim();
  if (!isLegacyApplication(code)) return undefined;
  return LEGACY_APPLICATION_REGISTRY[code] ?? { protocolVersion: 'legacy' };
}
