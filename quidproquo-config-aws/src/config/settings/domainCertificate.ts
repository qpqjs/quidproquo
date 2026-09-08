import { QPQConfigSetting } from 'quidproquo-core';
import { DomainTarget } from 'quidproquo-webserver';

import { QPQAwsConfigSettingType } from '../QPQConfig';

export interface DomainCertificateQPQConfigSetting extends QPQConfigSetting {
  region: string;
  targets: DomainTarget[];
  includeApex: boolean;
}

/**
 * One ACM certificate per region covering every declared root: each target resolves to a
 * host on every root (through the app's domain resolver at synth), plus each root's site
 * root when `includeApex`. CloudFront needs `us-east-1`; regional API Gateway needs the
 * deploy region. Entries for the same region merge.
 */
export const defineDomainCertificate = (
  region: string,
  targets: DomainTarget[],
  options?: { includeApex?: boolean },
): DomainCertificateQPQConfigSetting => ({
  configSettingType: QPQAwsConfigSettingType.awsDomainCertificate,
  uniqueKey: region,

  region,
  targets,
  includeApex: options?.includeApex ?? false,
});
