import { DomainCertificateQPQConfigSetting, qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { QPQConfig } from 'quidproquo-core';
import { qpqWebServerUtils } from 'quidproquo-webserver';

import { Construct } from 'constructs';

import { DomainCertificateStack } from './DomainCertificateStack';

// A region holds exactly one cert (one SSM parameter), so entries for the same region
// become one cert covering the union of their names.
const mergeConfigsByRegion = (configs: DomainCertificateQPQConfigSetting[]): DomainCertificateQPQConfigSetting[] => {
  const merged = new Map<string, DomainCertificateQPQConfigSetting>();

  for (const config of configs) {
    const existing = merged.get(config.region);
    if (!existing) {
      merged.set(config.region, { ...config, targets: [...config.targets] });
      continue;
    }

    const seen = new Set(existing.targets.map(qpqWebServerUtils.getDomainTargetKey));
    existing.targets.push(...config.targets.filter((target) => !seen.has(qpqWebServerUtils.getDomainTargetKey(target))));
    existing.includeApex = existing.includeApex || config.includeApex;
  }

  return [...merged.values()];
};

/**
 * One DomainCertificateStack per region across every `defineDomainCertificate` entry.
 * `DomainQpqServiceStack` calls this; it is exported for setups that manage the sibling
 * stacks themselves.
 */
export const createDomainCertificateStacks = (scope: Construct, qpqConfig: QPQConfig, idPrefix: string): DomainCertificateStack[] => {
  const configs = mergeConfigsByRegion(qpqConfigAwsUtils.getDomainCertificateConfigs(qpqConfig));

  // The construct id keeps the region so a us-east-1 CloudFront cert and a regional API cert
  // stay distinct siblings; the deployed name drops it because each stack lands in its own
  // region, where `<prefix>-cert` is already unique.
  return configs.map(
    (certificateConfig) =>
      new DomainCertificateStack(scope, `${idPrefix}-cert-${certificateConfig.region}`, {
        qpqConfig,
        certificateConfig,
        stackName: `${idPrefix}-cert`,
      }),
  );
};
